"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { 
  TrendingUp, 
  PieChart, 
  ArrowLeftRight, 
  Calculator, 
  Sparkles, 
  Mail, 
  Menu, 
  ChevronRight
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

function BrandMonogram({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center rounded-xl bg-zinc-900 border border-white/10 shadow-sm shrink-0 ${className}`}>
      <svg 
        className="w-5 h-5 text-white" 
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M24 6L6 38H16L24 23.5L32 38H42L24 6Z"
          fill="url(#nav-silver-grad)"
        />
        <path
          d="M24 16.5L19 26H29L24 16.5Z"
          fill="#09090b"
          opacity="0.9"
        />
        <path
          d="M24 27L21 33H27L24 27Z"
          fill="url(#nav-accent-grad)"
        />
        <defs>
          <linearGradient id="nav-silver-grad" x1="6" y1="6" x2="42" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" />
            <stop offset="0.6" stopColor="#E4E4E7" />
            <stop offset="1" stopColor="#A1A1AA" />
          </linearGradient>
          <linearGradient id="nav-accent-grad" x1="21" y1="27" x2="27" y2="33" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3B82F6" />
            <stop offset="1" stopColor="#10B981" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function DashboardNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);

  const currentTab = searchParams ? searchParams.get("tab") : null;
  const [activeNavTab, setActiveNavTab] = useState<string>(() => {
    return currentTab || "market";
  });

  useEffect(() => {
    if (currentTab) {
      setActiveNavTab(currentTab);
    }
  }, [currentTab]);

  useEffect(() => {
    const handleSwitchTab = (e: any) => {
      if (e.detail) setActiveNavTab(e.detail);
    };
    window.addEventListener("artha:switch-tab", handleSwitchTab);
    return () => window.removeEventListener("artha:switch-tab", handleSwitchTab);
  }, []);

  const handleBottomTabClick = (e: React.MouseEvent, tabId: string) => {
    if (pathname === "/dashboard") {
      e.preventDefault();
      setActiveNavTab(tabId);
      window.dispatchEvent(new CustomEvent("artha:switch-tab", { detail: tabId }));
      window.history.replaceState(null, "", `/dashboard?tab=${tabId}`);
    }
  };

  const navItems = [
    { 
      name: "Markets", 
      href: "/dashboard?tab=market", 
      tabId: "market",
      icon: TrendingUp,
      isActive: pathname === "/dashboard" && (currentTab === "market" || !currentTab)
    },
    { 
      name: "Funds", 
      href: "/dashboard?tab=funds", 
      tabId: "funds",
      icon: PieChart,
      isActive: pathname === "/dashboard" && currentTab === "funds"
    },
    { 
      name: "Currency", 
      href: "/dashboard?tab=currency", 
      tabId: "currency",
      icon: ArrowLeftRight,
      isActive: pathname === "/dashboard" && currentTab === "currency"
    },
    { 
      name: "SIP Calculator", 
      href: "/dashboard?tab=sip", 
      tabId: "sip",
      icon: Calculator,
      isActive: (pathname === "/dashboard" && currentTab === "sip") || pathname === "/sip-calculator"
    },
    { 
      name: "About", 
      href: "/about", 
      icon: Sparkles,
      isActive: pathname === "/about" 
    },
    { 
      name: "Contact", 
      href: "/contact", 
      icon: Mail,
      isActive: pathname === "/contact" 
    },
  ];

  return (
    <>
      {/* Desktop Sidebar - Apple/Google Minimalist obsidian styling */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-white/[0.08] bg-[#09090b]/85 backdrop-blur-2xl h-screen sticky top-0 z-30 select-none">
        <div className="flex h-full flex-col justify-between p-6">
          <div className="space-y-8">
            {/* Logo */}
            <Link href="/dashboard?tab=market" className="flex items-center gap-3 px-1 group cursor-pointer">
              <BrandMonogram className="h-9 w-9 group-hover:scale-105 transition-transform duration-200" />
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-[0.1em] text-white uppercase leading-none">
                  Artha
                </span>
                <span className="text-[10px] font-semibold text-zinc-400 tracking-[0.2em] uppercase mt-1">
                  Wealth Hub
                </span>
              </div>
            </Link>

            {/* Nav Items */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} href={item.href}>
                    <span
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 active:scale-[0.98] ${
                        item.isActive
                          ? "bg-white/[0.08] text-white font-semibold border border-white/[0.1] shadow-xs"
                          : "text-zinc-400 hover:text-white hover:bg-white/[0.03] border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4.5 w-4.5 shrink-0 ${item.isActive ? "text-white stroke-[2.2]" : "text-zinc-400 stroke-[1.8]"}`} />
                        <span>{item.name}</span>
                      </div>
                      {item.isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      )}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="pt-6 border-t border-white/[0.06] space-y-2">
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/[0.06] flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-200 tracking-tight">Market Feeds</p>
                <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </p>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">v2.0</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-[#09090b]/90 backdrop-blur-xl sticky top-0 z-40 select-none">
        <Link href="/dashboard?tab=market" className="flex items-center gap-2.5 active:scale-95 transition-transform duration-150">
          <BrandMonogram className="h-8 w-8" />
          <span className="text-sm font-bold tracking-[0.1em] text-white uppercase">
            Artha <span className="text-zinc-400 text-xs font-medium tracking-normal ml-0.5">Wealth</span>
          </span>
        </Link>

        <button 
          type="button"
          onClick={() => setSheetOpen(true)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.05] border border-white/[0.08] active:scale-95 transition-all duration-150 cursor-pointer"
          aria-label="Open Navigation Menu"
        >
          <Menu className="h-5 w-5 stroke-[1.8]" />
        </button>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="right" className="bg-[#09090b] border-white/[0.08] p-0 w-80 flex flex-col justify-between">
            <div>
              <SheetHeader className="p-5 border-b border-white/[0.08]">
                <SheetTitle className="text-white flex items-center gap-2.5 text-left font-sans">
                  <BrandMonogram className="h-7 w-7" />
                  <span className="text-sm font-bold tracking-wider uppercase">Artha Wealth</span>
                </SheetTitle>
              </SheetHeader>

              <div className="p-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSheetOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98] ${
                        item.isActive
                          ? "bg-white/[0.08] text-white border border-white/[0.1] font-semibold"
                          : "text-zinc-300 hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4.5 w-4.5 shrink-0 ${item.isActive ? "text-white stroke-[2.2]" : "text-zinc-400 stroke-[1.8]"}`} />
                        <span>{item.name}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-zinc-600 stroke-[1.8]" />
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="p-5 border-t border-white/[0.08] bg-zinc-950/60">
              <p className="text-xs font-semibold text-zinc-200">Artha Wealth Intelligence</p>
              <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                Global Stock Markets, Mutual Funds Aggregator, Multi-Currency Forex & Systematic Compounding Engine.
              </p>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Mobile Bottom Navigation Bar - Emil Kowalski style tactile micro-interactions */}
      <nav className="lg:hidden fixed bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))] left-2.5 right-2.5 sm:left-4 sm:right-4 z-[999] rounded-2xl border border-white/[0.1] bg-[#09090b]/92 backdrop-blur-2xl shadow-2xl shadow-black/95 p-1 touch-manipulation select-none transform-gpu will-change-transform">
        <div className="grid grid-cols-5 gap-1">
          {/* 1. Market */}
          <Link
            href="/dashboard?tab=market"
            onClick={(e) => handleBottomTabClick(e, "market")}
            className={`relative min-h-[48px] flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-150 ease-out active:scale-[0.92] touch-manipulation cursor-pointer ${
              pathname === "/dashboard" && activeNavTab === "market"
                ? "bg-white/[0.08] text-white font-bold border border-white/10 shadow-xs"
                : "text-zinc-400 hover:text-zinc-200 border border-transparent"
            }`}
          >
            {pathname === "/dashboard" && activeNavTab === "market" && (
              <span className="absolute -top-1 w-5 h-0.5 rounded-full bg-blue-400" />
            )}
            <TrendingUp className={`h-4.5 w-4.5 shrink-0 ${pathname === "/dashboard" && activeNavTab === "market" ? "text-white stroke-[2.2]" : "text-zinc-400 stroke-[1.8]"}`} />
            <span className={`text-[10px] tracking-tight mt-1 ${pathname === "/dashboard" && activeNavTab === "market" ? "font-bold text-white" : "font-medium text-zinc-400"}`}>Markets</span>
          </Link>

          {/* 2. Funds */}
          <Link
            href="/dashboard?tab=funds"
            onClick={(e) => handleBottomTabClick(e, "funds")}
            className={`relative min-h-[48px] flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-150 ease-out active:scale-[0.92] touch-manipulation cursor-pointer ${
              pathname === "/dashboard" && activeNavTab === "funds"
                ? "bg-white/[0.08] text-white font-bold border border-white/10 shadow-xs"
                : "text-zinc-400 hover:text-zinc-200 border border-transparent"
            }`}
          >
            {pathname === "/dashboard" && activeNavTab === "funds" && (
              <span className="absolute -top-1 w-5 h-0.5 rounded-full bg-blue-400" />
            )}
            <PieChart className={`h-4.5 w-4.5 shrink-0 ${pathname === "/dashboard" && activeNavTab === "funds" ? "text-white stroke-[2.2]" : "text-zinc-400 stroke-[1.8]"}`} />
            <span className={`text-[10px] tracking-tight mt-1 ${pathname === "/dashboard" && activeNavTab === "funds" ? "font-bold text-white" : "font-medium text-zinc-400"}`}>Funds</span>
          </Link>

          {/* 3. Currency */}
          <Link
            href="/dashboard?tab=currency"
            onClick={(e) => handleBottomTabClick(e, "currency")}
            className={`relative min-h-[48px] flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-150 ease-out active:scale-[0.92] touch-manipulation cursor-pointer ${
              pathname === "/dashboard" && activeNavTab === "currency"
                ? "bg-white/[0.08] text-white font-bold border border-white/10 shadow-xs"
                : "text-zinc-400 hover:text-zinc-200 border border-transparent"
            }`}
          >
            {pathname === "/dashboard" && activeNavTab === "currency" && (
              <span className="absolute -top-1 w-5 h-0.5 rounded-full bg-blue-400" />
            )}
            <ArrowLeftRight className={`h-4.5 w-4.5 shrink-0 ${pathname === "/dashboard" && activeNavTab === "currency" ? "text-white stroke-[2.2]" : "text-zinc-400 stroke-[1.8]"}`} />
            <span className={`text-[10px] tracking-tight mt-1 ${pathname === "/dashboard" && activeNavTab === "currency" ? "font-bold text-white" : "font-medium text-zinc-400"}`}>Currency</span>
          </Link>

          {/* 4. SIP Calculator */}
          <Link
            href="/dashboard?tab=sip"
            onClick={(e) => handleBottomTabClick(e, "sip")}
            className={`relative min-h-[48px] flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-150 ease-out active:scale-[0.92] touch-manipulation cursor-pointer ${
              (pathname === "/dashboard" && activeNavTab === "sip") || pathname === "/sip-calculator"
                ? "bg-white/[0.08] text-white font-bold border border-white/10 shadow-xs"
                : "text-zinc-400 hover:text-zinc-200 border border-transparent"
            }`}
          >
            {((pathname === "/dashboard" && activeNavTab === "sip") || pathname === "/sip-calculator") && (
              <span className="absolute -top-1 w-5 h-0.5 rounded-full bg-blue-400" />
            )}
            <Calculator className={`h-4.5 w-4.5 shrink-0 ${(pathname === "/dashboard" && activeNavTab === "sip") || pathname === "/sip-calculator" ? "text-white stroke-[2.2]" : "text-zinc-400 stroke-[1.8]"}`} />
            <span className={`text-[10px] tracking-tight mt-1 ${(pathname === "/dashboard" && activeNavTab === "sip") || pathname === "/sip-calculator" ? "font-bold text-white" : "font-medium text-zinc-400"}`}>SIP Calc</span>
          </Link>

          {/* 5. More */}
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="min-h-[48px] flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-zinc-400 hover:text-zinc-200 active:scale-[0.92] transition-all duration-150 ease-out border border-transparent touch-manipulation cursor-pointer"
            aria-label="More Options"
          >
            <Menu className="h-4.5 w-4.5 text-zinc-400 stroke-[1.8] shrink-0" />
            <span className="text-[10px] tracking-tight mt-1 font-medium text-zinc-400">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}

export function DashboardNav() {
  return (
    <Suspense fallback={null}>
      <DashboardNavContent />
    </Suspense>
  );
}
