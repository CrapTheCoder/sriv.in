"use client";

import React, {ReactNode, useCallback, useEffect, useRef, useState} from "react";
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

const MAX_SEGS = 35000;
const MAX_POS_FLOATS = MAX_SEGS * 4;
const MAX_DEPTH_FLOATS = MAX_SEGS * 2;

const INIT_BOUNDARY_PTS = 20;

const DESKTOP_PARAMS = {
    MAX_PTS_UPPER: 300,
    MAX_PTS_LOWER: 100,
    MIN_PTS_UPPER: 70,
    MIN_PTS_LOWER: 30,
    ADD_PT_PROB: 50,
    PT_UPDATE_MS: 45,
    RM_PTS_PER_TICK: 1,
};

const MOBILE_PARAMS = {
    MAX_PTS_UPPER: 60,
    MAX_PTS_LOWER: 30,
    MIN_PTS_UPPER: 20,
    MIN_PTS_LOWER: 10,
    ADD_PT_PROB: 0,
    PT_UPDATE_MS: 99999,
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
        if (Number.isFinite(dx) && Number.isFinite(dy)) {
            perim += Math.sqrt(dx * dx + dy * dy);
        }
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

const Background = ({children}: { children: ReactNode }) => {
    const cnvRef = useRef<HTMLCanvasElement>(null);
    const {isCursorVisible: isDesktop} = useCustomCursor();
    const glRef = useRef<WebGLRenderingContext | null>(null);
    const progRef = useRef<WebGLProgram | null>(null);

    const posBufRef = useRef<WebGLBuffer | null>(null);
    const posAttrRef = useRef<number>(-1);
    const depthBufRef = useRef<WebGLBuffer | null>(null);
    const depthAttrRef = useRef<number>(-1);

    const resUniRef = useRef<WebGLUniformLocation | null>(null);
    const clrUniRef = useRef<WebGLUniformLocation | null>(null);

    const jsPosDataRef = useRef<Float32Array | null>(null);
    const jsDepthDataRef = useRef<Float32Array | null>(null);

    const ptsChangedRef = useRef(true);
    const cachePosRef = useRef<number[]>([]);
    const cacheDepthRef = useRef<number[]>([]);

    const prevSizeRef = useRef<{ width: number; height: number } | null>(null);
    const initDoneRef = useRef(false);

    const ptsRef = useRef<Point[]>([]);
    const maxPtsRef = useRef(DESKTOP_PARAMS.MAX_PTS_UPPER);
    const minPtsRef = useRef(DESKTOP_PARAMS.MIN_PTS_LOWER);

    const addingPtsRef = useRef(true);
    const lastPtUpdateRef = useRef(0);

    const [styleIdx, setStyleIdx] = useState(0);
    const animFrameRef = useRef<number | null>(null);
    const perfParams = isDesktop ? DESKTOP_PARAMS : MOBILE_PARAMS;

    const draw = useCallback(() => {
        const curGl = glRef.current;
        const curCnv = cnvRef.current;
        const curPosBuf = posBufRef.current;
        const curPosAttr = posAttrRef.current;
        const curDepthBuf = depthBufRef.current;
        const curDepthAttr = depthAttrRef.current;
        const curJsPosData = jsPosDataRef.current;
        const curJsDepthData = jsDepthDataRef.current;

        if (!curGl || !curCnv || !curPosBuf || curPosAttr === -1 ||
            !curDepthBuf || curDepthAttr === -1 ||
            !curJsPosData || !curJsDepthData ||
            curCnv.width === 0 || curCnv.height === 0) return;

        curGl.lineWidth(isDesktop ? 1.0 : 3.0);

        curGl.uniform2f(resUniRef.current, curCnv.width, curCnv.height);
        curGl.uniform4f(clrUniRef.current, 210 / 255, 210 / 255, 210 / 255, 1.0);

        if (ptsChangedRef.current || cachePosRef.current.length === 0) {
            const newPos: number[] = [];
            const newDepths: number[] = [];
            let segCount = 0;

            if (ptsRef.current.length > 3) {
                try {
                    const dln = Delaunay.from(ptsRef.current);
                    const cnvW = curCnv.width / (window.devicePixelRatio || 1);
                    const cnvH = curCnv.height / (window.devicePixelRatio || 1);
                    const expFactor = Math.max(cnvW, cnvH) * 0.1;
                    const voroBounds: [number, number, number, number] = [-expFactor, -expFactor, cnvW + expFactor, cnvH + expFactor];
                    const voro = dln.voronoi(voroBounds);
                    const style = DRAW_STYLES[styleIdx];

                    for (const vCell of voro.cellPolygons()) {
                        if (!vCell || vCell.length < 3) continue;
                        const vCentroid = getCentroid(vCell);
                        if (!Number.isFinite(vCentroid[0]) || !Number.isFinite(vCentroid[1])) continue;
                        const vPerim = getPolyPerim(vCell);
                        if (!Number.isFinite(vPerim) || vPerim === 0) continue;

                        let effMaxLayers = style.maxLayers;
                        if (style.scaleMode !== "none") {
                            effMaxLayers = Math.min(2 + (Math.floor(vPerim) % 18), style.maxLayers);
                            effMaxLayers = Math.max(effMaxLayers, 1);
                        }

                        for (let i = 0; i < effMaxLayers; i++) {
                            const normDepth = style.maxLayers > 1 ? i / (style.maxLayers - 1) : 0.0;
                            let scl: number;

                            if (style.scaleMode === "linear") {
                                scl = 1.0 - i * (style.scaleStepLinear || 0.1);
                                if (scl < 0.05) break;
                            } else if (style.scaleMode === "exp") {
                                scl = 1.0 / (i + 1);
                                if (i > 0 && scl < 0.05) break;
                            } else {
                                scl = 1.0;
                            }

                            if (style.cutoffVolMul && i > 0 && scl < 1 &&
                                vPerim * scl < (cnvW * cnvH * style.cutoffVolMul)) break;

                            const ang = style.rotate ? (1 - scl) * Math.PI / 2 * (style.scaleMode === 'exp' ? i : 1) : 0;
                            const tfCell = transformPoly(vCell, vCentroid, scl, ang);
                            const dpr = window.devicePixelRatio || 1;

                            for (let j = 0; j < tfCell.length; j++) {
                                if (segCount >= MAX_SEGS ||
                                    newPos.length + 4 > MAX_POS_FLOATS ||
                                    newDepths.length + 2 > MAX_DEPTH_FLOATS) break;

                                const p1 = tfCell[j];
                                const p2 = tfCell[(j + 1) % tfCell.length];
                                if (Number.isFinite(p1[0]) && Number.isFinite(p1[1]) && Number.isFinite(p2[0]) && Number.isFinite(p2[1])) {
                                    newPos.push(p1[0] * dpr, p1[1] * dpr, p2[0] * dpr, p2[1] * dpr);
                                    newDepths.push(normDepth, normDepth);
                                    segCount++;
                                }
                            }
                            if (segCount >= MAX_SEGS || newPos.length + 4 > MAX_POS_FLOATS || newDepths.length + 2 > MAX_DEPTH_FLOATS) break;
                            if (style.scaleMode === "none") break;
                        }
                        if (segCount >= MAX_SEGS || newPos.length + 4 > MAX_POS_FLOATS || newDepths.length + 2 > MAX_DEPTH_FLOATS) break;
                    }
                } catch (e) {
                    console.log("Delaunay triangulation failed:", e);
                }
            }
            cachePosRef.current = newPos;
            cacheDepthRef.current = newDepths;
            ptsChangedRef.current = false;
        }

        const finalPos = cachePosRef.current;
        const finalDepths = cacheDepthRef.current;
        const posFloatsLen = finalPos.length;
        const vertCount = posFloatsLen / 2;

        curGl.clear(curGl.COLOR_BUFFER_BIT);

        if (vertCount > 0) {
            for (let i = 0; i < posFloatsLen; i++) curJsPosData[i] = finalPos[i];
            curGl.bindBuffer(curGl.ARRAY_BUFFER, curPosBuf);
            curGl.bufferSubData(curGl.ARRAY_BUFFER, 0, curJsPosData.subarray(0, posFloatsLen));
            curGl.vertexAttribPointer(curPosAttr, 2, curGl.FLOAT, false, 0, 0);

            const depthFloatsLen = finalDepths.length;
            for (let i = 0; i < depthFloatsLen; i++) curJsDepthData[i] = finalDepths[i];
            curGl.bindBuffer(curGl.ARRAY_BUFFER, curDepthBuf);
            curGl.bufferSubData(curGl.ARRAY_BUFFER, 0, curJsDepthData.subarray(0, depthFloatsLen));
            curGl.vertexAttribPointer(curDepthAttr, 1, curGl.FLOAT, false, 0, 0);

            curGl.drawArrays(curGl.LINES, 0, vertCount);
        } else {
            curGl.drawArrays(curGl.LINES, 0, 0);
        }
    }, [styleIdx, isDesktop]);

    useEffect(() => {
        if (!isDesktop) {
            draw();
        }
    }, [styleIdx, isDesktop, draw]);

    const randomizePtTgts = useCallback(() => {
        let maxTgt = Math.floor(Math.random() * (perfParams.MAX_PTS_UPPER - perfParams.MAX_PTS_LOWER + 1)) + perfParams.MAX_PTS_LOWER;
        let minTgt = Math.floor(Math.random() * (perfParams.MIN_PTS_UPPER - perfParams.MIN_PTS_LOWER + 1)) + perfParams.MIN_PTS_LOWER;
        const tgtGap = Math.max(20, (perfParams.MAX_PTS_LOWER - perfParams.MIN_PTS_UPPER) * 0.5);

        if (minTgt >= maxTgt - tgtGap) {
            minTgt = Math.max(INIT_BOUNDARY_PTS + 10, maxTgt - tgtGap - Math.floor(Math.random() * (tgtGap / 2)));
            minTgt = Math.max(perfParams.MIN_PTS_LOWER, minTgt);
        }
        if (maxTgt <= minTgt + tgtGap) {
            maxTgt = minTgt + tgtGap + Math.floor(Math.random() * (tgtGap / 2));
            maxTgt = Math.min(perfParams.MAX_PTS_UPPER, maxTgt);
        }
        minTgt = Math.max(INIT_BOUNDARY_PTS + 5, minTgt);
        maxTgt = Math.max(minTgt + tgtGap, maxTgt);
        minTgt = Math.min(minTgt, perfParams.MAX_PTS_UPPER - tgtGap);
        maxTgt = Math.min(maxTgt, perfParams.MAX_PTS_UPPER);

        maxPtsRef.current = maxTgt;
        minPtsRef.current = minTgt;
        ptsChangedRef.current = true;
    }, [perfParams]);

    const initPts = useCallback((w: number, h: number) => {
        ptsRef.current = [];
        randomizePtTgts();
        addingPtsRef.current = true;
        lastPtUpdateRef.current = 0;

        const mrg = Math.min(w, h) * 0.05;
        const boundaryPts: Point[] = [
            [mrg, mrg], [w - mrg, mrg], [w - mrg, h - mrg], [mrg, h - mrg],
            [w / 2, mrg], [w - mrg, h / 2], [w / 2, h - mrg], [mrg, h / 2],
        ];
        ptsRef.current.push(...boundaryPts);

        const initRandPts = Math.min(10, Math.floor(minPtsRef.current / 2));
        for (let i = 0; i < initRandPts; i++) {
            const rx = mrg + Math.random() * (w - 2 * mrg);
            const ry = mrg + Math.random() * (h - 2 * mrg);
            ptsRef.current.push([rx, ry]);
        }
        ptsChangedRef.current = true;
    }, [randomizePtTgts]);

    useEffect(() => {
        const cnv = cnvRef.current;
        if (!cnv || (cnv.parentElement && (cnv.parentElement.clientWidth === 0 || cnv.parentElement.clientHeight === 0))) {
            return;
        }

        const gl = cnv.getContext("webgl", {antialias: true, premultipliedAlpha: false});
        if (!gl) {
            return;
        }
        glRef.current = gl;
        gl.clearColor(30 / 255, 30 / 255, 30 / 255, 1.0);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        const compileShader = (src: string, type: number) => {
            const shader = gl.createShader(type);
            if (!shader) return null;
            gl.shaderSource(shader, src);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        };

        const vertShader = compileShader(VERT_SHADER, gl.VERTEX_SHADER);
        const fragShader = compileShader(FRAG_SHADER, gl.FRAGMENT_SHADER);
        if (!vertShader || !fragShader) return;

        const prog = gl.createProgram();
        if (!prog) return;
        gl.attachShader(prog, vertShader);
        gl.attachShader(prog, fragShader);
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            return;
        }
        progRef.current = prog;
        gl.useProgram(prog);

        posBufRef.current = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBufRef.current);
        gl.bufferData(gl.ARRAY_BUFFER, MAX_POS_FLOATS * Float32Array.BYTES_PER_ELEMENT, gl.DYNAMIC_DRAW);
        jsPosDataRef.current = new Float32Array(MAX_POS_FLOATS);
        posAttrRef.current = gl.getAttribLocation(prog, "a_pos");
        gl.enableVertexAttribArray(posAttrRef.current);

        depthBufRef.current = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, depthBufRef.current);
        gl.bufferData(gl.ARRAY_BUFFER, MAX_DEPTH_FLOATS * Float32Array.BYTES_PER_ELEMENT, gl.DYNAMIC_DRAW);
        jsDepthDataRef.current = new Float32Array(MAX_DEPTH_FLOATS);
        depthAttrRef.current = gl.getAttribLocation(prog, "a_depth_val");
        gl.enableVertexAttribArray(depthAttrRef.current);

        resUniRef.current = gl.getUniformLocation(prog, "u_res");
        clrUniRef.current = gl.getUniformLocation(prog, "u_clr");

        const handleResize = () => {
            const curCnv = cnvRef.current;
            const curGl = glRef.current;
            if (!curCnv || !curGl || !curCnv.parentElement) return;

            const dpr = window.devicePixelRatio || 1;
            const newW = curCnv.parentElement.clientWidth;
            const newH = curCnv.parentElement.clientHeight;
            if (newW === 0 || newH === 0) return;

            const newPhysicalW = newW * dpr;
            const newPhysicalH = newH * dpr;

            if (!initDoneRef.current) {
                curCnv.width = newPhysicalW;
                curCnv.height = newPhysicalH;
                curGl.viewport(0, 0, newPhysicalW, newPhysicalH);
                initPts(newW, newH);
                prevSizeRef.current = {width: newW, height: newH};
                initDoneRef.current = true;
                ptsChangedRef.current = true;
            } else {
                const oldSize = prevSizeRef.current;
                if (oldSize && (oldSize.width !== newW || oldSize.height !== newH)) {
                    if (oldSize.width > 0 && oldSize.height > 0) {
                        ptsRef.current = ptsRef.current.map(p => [
                            (p[0] / oldSize.width) * newW,
                            (p[1] / oldSize.height) * newH
                        ] as Point).map(p => [Number.isFinite(p[0]) ? p[0] : 0, Number.isFinite(p[1]) ? p[1] : 0] as Point);
                    }
                    curCnv.width = newPhysicalW;
                    curCnv.height = newPhysicalH;
                    curGl.viewport(0, 0, newPhysicalW, newPhysicalH);
                    prevSizeRef.current = {width: newW, height: newH};
                    ptsChangedRef.current = true;
                }
            }
            if (!isDesktop) {
                draw();
            }
        };
        handleResize();

        if (isDesktop) {
            const render = (time: number) => {
                animFrameRef.current = requestAnimationFrame(render);
                if (document.hidden) return;

                if (lastPtUpdateRef.current === 0) {
                    lastPtUpdateRef.current = time;
                }

                if (time - lastPtUpdateRef.current > perfParams.PT_UPDATE_MS) {
                    lastPtUpdateRef.current = time;
                    if (addingPtsRef.current) {
                        if (ptsRef.current.length < maxPtsRef.current) {
                            if (Math.random() * 100 < perfParams.ADD_PT_PROB) {
                                ptsRef.current.push([Math.random() * cnv.width, Math.random() * cnv.height]);
                            }
                        } else {
                            addingPtsRef.current = false;
                        }
                    } else {
                        if (ptsRef.current.length > minPtsRef.current) {
                            for (let i = 0; i < perfParams.RM_PTS_PER_TICK; i++) {
                                if (ptsRef.current.length > minPtsRef.current && ptsRef.current.length > INIT_BOUNDARY_PTS) {
                                    ptsRef.current.pop();
                                } else break;
                            }
                        } else {
                            addingPtsRef.current = true;
                            randomizePtTgts();
                        }
                    }
                    ptsChangedRef.current = true;
                }
                draw();
            };
            animFrameRef.current = requestAnimationFrame(render);
        }

        const debouncedResize = () => handleResize();
        window.addEventListener("resize", debouncedResize);

        const handleClick = () => {
            setStyleIdx((prev) => (prev + 1) % DRAW_STYLES.length);
            ptsChangedRef.current = true;
        };
        cnv.addEventListener("click", handleClick);

        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            window.removeEventListener("resize", debouncedResize);
            const curCnv = cnvRef.current;
            if (curCnv) curCnv.removeEventListener("click", handleClick);

            const glClean = glRef.current;
            if (glClean) {
                if (progRef.current) glClean.deleteProgram(progRef.current);
                if (posBufRef.current) glClean.deleteBuffer(posBufRef.current);
                if (depthBufRef.current) glClean.deleteBuffer(depthBufRef.current);
                const vertShader = glClean.createShader(glClean.VERTEX_SHADER);
                const fragShader = glClean.createShader(glClean.FRAGMENT_SHADER);
                if (vertShader) glClean.deleteShader(vertShader);
                if (fragShader) glClean.deleteShader(fragShader);
            }
        };
    }, [initPts, randomizePtTgts, styleIdx, perfParams, draw, isDesktop]);

    return (
        <>
            <div className="fixed inset-0 bg-[#1e1e1e]">
                <div
                    className="fixed inset-0 transition-opacity duration-700 ease-in-out pointer-events-auto"
                >
                    <canvas
                        ref={cnvRef}
                        className="absolute inset-0 w-full h-full z-0"
                    />
                </div>
            </div>
            <div className="pointer-events-none">
                {children}
            </div>
        </>
    );
};

export default Background;
