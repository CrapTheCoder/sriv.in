"use client";

import React, {useCallback, useEffect, useRef, useState} from "react";
import {Delaunay} from "d3-delaunay";
import {useCustomCursor} from "@/components/providers/CustomCursorProvider";

const VERT_SHADER = `
attribute vec2 a_pos;
attribute float a_depth_val;
uniform vec2 u_res;
varying float v_depth_val;

void main() {
  vec2 zero_to_one = a_pos / u_res;
  vec2 clip_space = (zero_to_one * 2.0 - 1.0) * vec2(1.0, -1.0);
  gl_Position = vec4(clip_space, 0.0, 1.0);
  v_depth_val = a_depth_val;
}
`;

const FRAG_SHADER = `
precision mediump float;
uniform vec4 u_clr;
varying float v_depth_val;

void main() {
  float alpha_mod = 1.0 - v_depth_val * 0.99;
  alpha_mod = max(0.05, alpha_mod);
  gl_FragColor = vec4(u_clr.rgb, u_clr.a * alpha_mod);
}
`;

type Point = [number, number];

interface DrawStyle {
    name: string;
    scaleMode: "linear" | "exp" | "none";
    rotate: boolean;
    maxLayers: number;
    scaleStepLinear?: number;
    cutoffVolMul?: number;
}

const DRAW_STYLES: DrawStyle[] = [
    {name: "simple", scaleMode: "none", rotate: false, maxLayers: 1},
    {name: "scaleExp", scaleMode: "exp", rotate: false, maxLayers: 8, cutoffVolMul: 2e-5},
    {name: "scaleExpRot", scaleMode: "exp", rotate: true, maxLayers: 7, cutoffVolMul: 2e-5},
    {name: "scaleLin", scaleMode: "linear", rotate: false, maxLayers: 9, scaleStepLinear: 0.05, cutoffVolMul: 5e-5},
    {name: "scaleLinRot", scaleMode: "linear", rotate: true, maxLayers: 15, scaleStepLinear: 0.02, cutoffVolMul: 2e-5},
];

const MAX_SEGS = 12000;
const MAX_POS_FLOATS = MAX_SEGS * 4;
const MAX_DEPTH_FLOATS = MAX_SEGS * 2;

const INIT_BOUNDARY_PTS = 10;

const DESKTOP_PARAMS = {
    MAX_PTS_UPPER: 200,
    MAX_PTS_LOWER: 70,
    MIN_PTS_UPPER: 50,
    MIN_PTS_LOWER: 20,
    ADD_PT_PROB: 20,
    RM_PT_PROB: 30,
    PT_UPDATE_MS: 100,
    RM_PTS_PER_TICK: 1,
};

const MOBILE_PARAMS = {
    MAX_PTS_UPPER: 60,
    MAX_PTS_LOWER: 30,
    MIN_PTS_UPPER: 20,
    MIN_PTS_LOWER: 10,
    ADD_PT_PROB: 0,
    RM_PT_PROB: 0,
    PT_UPDATE_MS: 999999,
    RM_PTS_PER_TICK: 0,
};

const getCentroid = (poly: Point[]): Point => {
    if (!poly || poly.length === 0) return [0, 0];
    let x = 0, y = 0;
    for (const p of poly) {
        x += p[0];
        y += p[1];
    }
    return [x / poly.length, y / poly.length];
};

const getPolyPerim = (poly: Point[]): number => {
    if (!poly || poly.length < 2) return 0;
    let perim = 0;
    for (let i = 0; i < poly.length; i++) {
        const p1 = poly[i];
        const p2 = poly[(i + 1) % poly.length];
        const dx = p2[0] - p1[0];
        const dy = p2[1] - p1[1];
        if (Number.isFinite(dx) && Number.isFinite(dy))
            perim += Math.sqrt(dx * dx + dy * dy);
    }
    return perim;
};

const transformPoly = (poly: Point[], centroid: Point, scale: number, angle: number): Point[] => {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    return poly.map(([px, py]) => {
        let x = px - centroid[0];
        let y = py - centroid[1];
        if (angle !== 0) {
            const rx = x * cosA - y * sinA;
            const ry = x * sinA + y * cosA;
            x = rx;
            y = ry;
        }
        x *= scale;
        y *= scale;
        return [x + centroid[0], y + centroid[1]];
    });
};

const Background = ({
                        children,
                        className = "",
                        backgroundOpacity = 1,
                    }: {
    children?: React.ReactNode;
    className?: string;
    backgroundOpacity?: number;
}) => {
    const cnvRef = useRef<HTMLCanvasElement>(null);
    const {isCursorVisible: isDesktop} = useCustomCursor();
    const perfParams = isDesktop ? DESKTOP_PARAMS : MOBILE_PARAMS;
    const [styleIdx, setStyleIdx] = useState(0);

    const glObjectsRef = useRef<{
        gl: WebGLRenderingContext;
        prog: WebGLProgram;
        posBuf: WebGLBuffer;
        depthBuf: WebGLBuffer;
        posAttr: number;
        depthAttr: number;
        jsPosData: Float32Array;
        jsDepthData: Float32Array;
    } | null>(null);

    const animStateRef = useRef({
        pts: [] as Point[],
        ptsChanged: true,
        vertexCount: 0,
        maxPts: perfParams.MAX_PTS_UPPER,
        minPts: perfParams.MIN_PTS_LOWER,
        addingPts: true,
        lastPtUpdate: 0,
        animFrameId: null as number | null,
    });

    const draw = useCallback(() => {
        const glObjects = glObjectsRef.current;
        const animState = animStateRef.current;
        if (!glObjects) return;

        const {gl, posBuf, depthBuf, posAttr, depthAttr, jsPosData, jsDepthData} = glObjects;

        if (animState.ptsChanged) {
            animState.ptsChanged = false;
            const style = DRAW_STYLES[styleIdx];
            const dpr = window.devicePixelRatio || 1;
            const cnvW = gl.canvas.width / dpr, cnvH = gl.canvas.height / dpr;
            const newPos: number[] = [], newDepths: number[] = [];

            try {
                const dln = Delaunay.from(animState.pts);
                const expFactor = Math.max(cnvW, cnvH) * 0.1;
                const voroBounds: [number, number, number, number] = [-expFactor, -expFactor, cnvW + expFactor, cnvH + expFactor];
                const voro = dln.voronoi(voroBounds);

                for (const vCell of voro.cellPolygons()) {
                    if (!vCell || vCell.length < 3) continue;
                    const vCentroid = getCentroid(vCell);
                    if (!Number.isFinite(vCentroid[0])) continue;
                    const vPerim = getPolyPerim(vCell);
                    if (!vPerim) continue;

                    let effMaxLayers = style.maxLayers;
                    if (!isDesktop) {
                        effMaxLayers = Math.max(1, Math.ceil(style.maxLayers / 3));
                    } else if (style.scaleMode !== "none") {
                        effMaxLayers = Math.min(2 + (Math.floor(vPerim) % 18), style.maxLayers);
                    }

                    for (let i = 0; i < effMaxLayers; i++) {
                        let scl;
                        if (style.scaleMode === "linear") scl = 1.0 - i * (style.scaleStepLinear || 0.1); else if (style.scaleMode === "exp") scl = 1.0 / (i + 1); else scl = 1.0;
                        if (scl < 0.05 && i > 0) break;
                        const ang = style.rotate ? (1 - scl) * Math.PI / 2 * (style.scaleMode === 'exp' ? i : 1) : 0;
                        const tfCell = transformPoly(vCell, vCentroid, scl, ang);
                        for (let j = 0; j < tfCell.length; j++) {
                            if (newPos.length >= MAX_POS_FLOATS)
                                break;
                            const p1 = tfCell[j], p2 = tfCell[(j + 1) % tfCell.length];
                            if (Number.isFinite(p1[0]) && Number.isFinite(p1[1]) && Number.isFinite(p2[0]) && Number.isFinite(p2[1])) {
                                newPos.push(p1[0] * dpr, p1[1] * dpr, p2[0] * dpr, p2[1] * dpr);
                                newDepths.push(i / (style.maxLayers - 1 || 1), i / (style.maxLayers - 1 || 1));
                            }
                        }
                        if (newPos.length >= MAX_POS_FLOATS)
                            break;
                    }
                    if (newPos.length >= MAX_POS_FLOATS)
                        break;
                }
            } catch (e) {
                console.error(e);
            }

            animState.vertexCount = newPos.length / 2;
            if (animState.vertexCount > 0) {
                gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
                for (let i = 0; i < newPos.length; i++) jsPosData[i] = newPos[i];
                gl.bufferSubData(gl.ARRAY_BUFFER, 0, jsPosData.subarray(0, newPos.length));
                gl.bindBuffer(gl.ARRAY_BUFFER, depthBuf);
                for (let i = 0; i < newDepths.length; i++) jsDepthData[i] = newDepths[i];
                gl.bufferSubData(gl.ARRAY_BUFFER, 0, jsDepthData.subarray(0, newDepths.length));
            }
        }

        gl.lineWidth(isDesktop ? 1.0 : 2.5);
        gl.clear(gl.COLOR_BUFFER_BIT);
        if (animState.vertexCount > 0) {
            gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
            gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, depthBuf);
            gl.vertexAttribPointer(depthAttr, 1, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.LINES, 0, animState.vertexCount);
        }
    }, [styleIdx, isDesktop]);

    useEffect(() => {
        const cnv = cnvRef.current;
        if (!cnv)
            return;

        if (!glObjectsRef.current) {
            const gl = cnv.getContext("webgl", {antialias: true, premultipliedAlpha: false});

            if (!gl)
                return;

            const compileShader = (src: string, type: number) => {
                const shader = gl.createShader(type);
                if (!shader) return null;
                gl.shaderSource(shader, src);
                gl.compileShader(shader);
                return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : (gl.deleteShader(shader), null);
            };

            const vertShader = compileShader(VERT_SHADER, gl.VERTEX_SHADER);
            const fragShader = compileShader(FRAG_SHADER, gl.FRAGMENT_SHADER);

            if (!vertShader || !fragShader)
                return;

            const prog = gl.createProgram();

            if (!prog)
                return;

            gl.attachShader(prog, vertShader);
            gl.attachShader(prog, fragShader);
            gl.linkProgram(prog);

            if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
                return;

            gl.useProgram(prog);

            const posBuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);

            const jsPosData = new Float32Array(MAX_POS_FLOATS);
            gl.bufferData(gl.ARRAY_BUFFER, jsPosData.byteLength, gl.DYNAMIC_DRAW);

            const posAttr = gl.getAttribLocation(prog, "a_pos");
            gl.enableVertexAttribArray(posAttr);

            const depthBuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, depthBuf);

            const jsDepthData = new Float32Array(MAX_DEPTH_FLOATS);
            gl.bufferData(gl.ARRAY_BUFFER, jsDepthData.byteLength, gl.DYNAMIC_DRAW);

            const depthAttr = gl.getAttribLocation(prog, "a_depth_val");
            gl.enableVertexAttribArray(depthAttr);

            glObjectsRef.current = {gl, prog, posBuf, depthBuf, posAttr, depthAttr, jsPosData, jsDepthData};
        }

        const glObjects = glObjectsRef.current;
        const animState = animStateRef.current;
        const {gl} = glObjects;

        gl.clearColor(30 / 255, 30 / 255, 30 / 255, 1.0);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        const clrUni = gl.getUniformLocation(glObjects.prog, "u_clr");
        gl.uniform4f(clrUni, 210 / 255, 210 / 255, 210 / 255, 1.0);

        const randomizePtTgts = () => {
            animState.maxPts = Math.floor(Math.random() * (perfParams.MAX_PTS_UPPER - perfParams.MAX_PTS_LOWER + 1)) + perfParams.MAX_PTS_LOWER;
            animState.minPts = Math.floor(Math.random() * (perfParams.MIN_PTS_UPPER - perfParams.MIN_PTS_LOWER + 1)) + perfParams.MIN_PTS_LOWER;
        }

        const initPoints = (w: number, h: number) => {
            animState.pts = [];
            randomizePtTgts();
            animState.addingPts = true;

            const mrg = Math.min(w, h) * 0.05;
            animState.pts.push([mrg, mrg], [w - mrg, mrg], [w - mrg, h - mrg], [mrg, h - mrg], [w / 2, mrg], [w - mrg, h / 2], [w / 2, h - mrg], [mrg, h / 2]);

            const numPoints = isDesktop ? Math.floor(Math.random() * (animState.maxPts - animState.minPts + 1)) + animState.minPts : perfParams.MAX_PTS_UPPER;
            for (let i = 0; i < numPoints; i++)
                animState.pts.push([mrg + Math.random() * (w - 2 * mrg), mrg + Math.random() * (h - 2 * mrg)]);

            animState.ptsChanged = true;
        };

        const handleResize = () => {
            if (!cnv.parentElement)
                return;

            const dpr = window.devicePixelRatio || 1;
            const newW = cnv.parentElement.clientWidth, newH = cnv.parentElement.clientHeight;

            if (newW === 0 || newH === 0)
                return;

            const newPhysW = newW * dpr, newPhysH = newH * dpr;

            if (cnv.width !== newPhysW || cnv.height !== newPhysH) {
                cnv.width = newPhysW;
                cnv.height = newPhysH;
                gl.viewport(0, 0, newPhysW, newPhysH);

                const resUni = gl.getUniformLocation(glObjects.prog, "u_res");
                gl.uniform2f(resUni, newPhysW, newPhysH);
                initPoints(newW, newH);
            }
        };

        handleResize();

        const renderLoop = (time: number) => {
            animState.animFrameId = requestAnimationFrame(renderLoop);
            if (document.hidden) return;

            if (isDesktop && time - animState.lastPtUpdate > perfParams.PT_UPDATE_MS) {
                animState.lastPtUpdate = time;
                let didChange = false;
                if (animState.addingPts) {
                    if (animState.pts.length < animState.maxPts && Math.random() * 100 < perfParams.ADD_PT_PROB) {
                        const w = cnv.width / (window.devicePixelRatio || 1),
                            h = cnv.height / (window.devicePixelRatio || 1);
                        animState.pts.push([Math.random() * w, Math.random() * h]);
                        didChange = true;
                    } else if (animState.pts.length >= animState.maxPts) {
                        animState.addingPts = false;
                    }
                } else {
                    if (animState.pts.length > animState.minPts && Math.random() * 100 < perfParams.RM_PT_PROB) {
                        for (let i = 0; i < perfParams.RM_PTS_PER_TICK; i++) {
                            if (animState.pts.length > animState.minPts && animState.pts.length > INIT_BOUNDARY_PTS) {
                                animState.pts.pop();
                                didChange = true;
                            }
                        }
                    } else if (animState.pts.length <= animState.minPts) {
                        animState.addingPts = true;
                        randomizePtTgts();
                    }
                }
                if (didChange) animState.ptsChanged = true;
            }
            draw();
        };

        animState.animFrameId = requestAnimationFrame(renderLoop);

        const debouncedResize = () => handleResize();
        window.addEventListener("resize", debouncedResize);
        const handleClick = () => {
            setStyleIdx(prev => (prev + 1) % DRAW_STYLES.length);
            animState.ptsChanged = true;
        };
        cnv.addEventListener("click", handleClick);

        return () => {
            if (animState.animFrameId) cancelAnimationFrame(animState.animFrameId);
            window.removeEventListener("resize", debouncedResize);
            cnv.removeEventListener("click", handleClick);
        };
    }, [isDesktop, perfParams, draw]);

    return (<div className="absolute inset-0 bg-[#1e1e1e]">
            <div
                className="fixed inset-0 transition-opacity duration-700 ease-in-out"
                style={{opacity: backgroundOpacity}}
            >
                <canvas
                    ref={cnvRef}
                    className="absolute inset-0 w-full h-full z-0"
                />
            </div>
            <div className={`relative w-full h-full z-10 ${className} pointer-events-none`}>
                {children}
            </div>
        </div>);
};
export default Background;