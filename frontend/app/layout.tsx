import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Artha Wealth — Finance Hub",
  description: "All-in-one Global Finance Hub. Live stock market analytics across India, US, Europe, China, Japan, and Arab markets, mutual funds aggregator, CAS statement parser, and currency exchange.",
  keywords: "finance hub, wealth management, stock market analytics, mutual funds, portfolio tracker, CAS parser, currency exchange",
  openGraph: {
    title: "Artha Wealth — Finance Hub",
    description: "All-in-one Global Finance Hub for live global markets, mutual funds, portfolio analytics, and currency exchange.",
    url: "https://artha-wealth.vercel.app",
    siteName: "Artha Wealth",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Artha Wealth — Finance Hub",
    description: "All-in-one Global Finance Hub for live global markets, mutual funds, portfolio analytics, and currency exchange.",
  },
  icons: {
    icon: "/icon?v=3",
    apple: "/apple-icon?v=3",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  interactiveWidget: "resizes-visual",
};

import { Prefetcher } from "@/components/prefetcher";
import { RootSplashDismiss } from "@/components/root-splash-dismiss";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-[#09090b] text-zinc-50`}>
        {/* Instant Frame-0 Root Splash Screen (HTML streamed instantly to browser) */}
        <div
          id="root-splash-screen"
          className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-[#09090b] text-white px-4 select-none pointer-events-auto transition-opacity duration-500 ease-out"
          style={{ willChange: "opacity" }}
        >
          {/* Ambient Glows */}
          <div className="absolute top-[-15%] left-[-15%] w-[320px] sm:w-[550px] h-[320px] sm:h-[550px] rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.30)_0%,rgba(6,182,212,0.1)_45%,transparent_70%)] pointer-events-none filter blur-[80px]" />
          <div className="absolute bottom-[-15%] right-[-15%] w-[320px] sm:w-[550px] h-[320px] sm:h-[550px] rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.25)_0%,rgba(20,184,166,0.08)_45%,transparent_70%)] pointer-events-none filter blur-[80px]" />

          <div className="relative z-10 flex flex-col items-center max-w-sm sm:max-w-md w-full px-4 text-center">
            {/* App Icon */}
            <div className="relative mb-5 sm:mb-6">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400 opacity-75 blur-xl animate-pulse" />
              <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-500 to-emerald-400 p-0.5 shadow-2xl shadow-blue-500/40">
                <div className="w-full h-full bg-[#09090b]/80 rounded-[14px] flex items-center justify-center backdrop-blur-md p-2">
                  <svg width="100%" height="100%" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 512 150 L 150 850 L 350 850 L 512 537 L 674 850 L 874 850 Z" fill="#60A5FA" />
                    <path d="M 180 650 Q 350 650 512 500 T 800 250" stroke="#3B82F6" strokeWidth="90" strokeLinecap="round" fill="none" />
                    <path d="M 600 250 L 800 250 L 800 450" stroke="#3B82F6" strokeWidth="90" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Brand Title */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-white">Artha</span>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-blue-500/20 to-emerald-500/20 border border-blue-400/30 text-blue-400 px-2.5 py-0.5 rounded-full shadow-inner">
                Wealth
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-zinc-400 uppercase flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Market & Portfolio Engine</span>
            </p>

            {/* Progress Bar Container */}
            <div className="w-full mt-6 p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800/90 shadow-2xl flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin inline-block" />
                  <span>Connecting to Quant Engine...</span>
                </span>
                <span className="text-blue-400 font-mono font-bold text-[11px]">LIVE</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                <div
                  id="root-splash-progress-bar"
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full w-2/3 animate-pulse"
                />
              </div>
            </div>
          </div>
        </div>

        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <RootSplashDismiss />
          <Prefetcher />
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
