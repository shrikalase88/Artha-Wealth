import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Artha Wealth — Portfolio Tracker",
  description: "Track your mutual funds and stock portfolio with precision. Real-time Indian market data, CAS PDF parsing, and Gemini AI screenshot extraction.",
  keywords: "portfolio tracker, mutual funds, indian stocks, CAS statement, SIP calculator",
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
    { media: "(prefers-color-scheme: dark)", color: "#070a13" },
  ],
  interactiveWidget: "resizes-visual",
};

import { Prefetcher } from "@/components/prefetcher";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-[#070a13] text-slate-100`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Prefetcher />
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
