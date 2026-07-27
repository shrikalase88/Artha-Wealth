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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-[#09090b] text-zinc-50`}>
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
