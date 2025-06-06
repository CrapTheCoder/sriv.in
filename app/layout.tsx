import type {Metadata} from "next";
import {ThemeProvider} from "next-themes";
import {Instrument_Serif, JetBrains_Mono} from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import {PostHogProvider} from "@/components/providers/PostHogProvider";
import {CustomCursorProvider} from "@/components/providers/CustomCursorProvider";
import CustomCursor from "@/components/CustomCursor";
import Footer from "@/components/Footer";

const jetbrainsMono = JetBrains_Mono({
    variable: "--font-jetbrains-mono",
    subsets: ["latin"],
});
const instrumentSerif = Instrument_Serif({
    variable: "--font-instrument-serif",
    subsets: ["latin"],
    weight: "400",
});

const fonts = [jetbrainsMono.variable, instrumentSerif.variable];
const fontVariables = fonts.join(" ");

export const metadata: Metadata = {
    title: "Srivaths P"
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="no-scrollbar sm:scroll-snap-type-y-mandatory" suppressHydrationWarning>
        <body
            className={`${fontVariables} antialiased bg-background overscroll-y-auto sm:overscroll-y-none scroll-smooth`}
        >
        <ThemeProvider enableSystem={true} disableTransitionOnChange={true}>
            <PostHogProvider>
                <CustomCursorProvider>
                    <CustomCursor/>
                    <Header/>
                    {children}
                    <Footer/>
                </CustomCursorProvider>
            </PostHogProvider>
        </ThemeProvider>
        </body>
        </html>
    );
}
