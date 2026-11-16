import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "./globals.css";

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
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Artha Wealth",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  interactiveWidget: "resizes-visual",
};

import { GlobalSplashScreen } from "@/components/global-splash-screen";
import { Prefetcher } from "@/components/prefetcher";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground min-h-screen transition-colors duration-200">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <GlobalSplashScreen />
          <Prefetcher />
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
