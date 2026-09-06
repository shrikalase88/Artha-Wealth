"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { 
  Activity, 
  Compass, 
  Coins, 
  Calculator, 
  Info, 
  Phone, 
  Menu, 
  ChevronRight
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

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
      icon: Activity,
      isActive: pathname === "/dashboard" && (currentTab === "market" || !currentTab)
    },
    { 
      name: "Funds", 
      href: "/dashboard?tab=funds", 
      tabId: "funds",
      icon: Compass,
      isActive: pathname === "/dashboard" && currentTab === "funds"
    },
    { 
      name: "Currency", 
      href: "/dashboard?tab=currency", 
      tabId: "currency",
      icon: Coins,
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
      icon: Info,
      isActive: pathname === "/about" 
    },
    { 
      name: "Contact", 
      href: "/contact", 
      icon: Phone,
      isActive: pathname === "/contact" 
    },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-[#27272a] bg-[#09090b]/95 backdrop-blur-2xl h-screen sticky top-0 z-30">
        <div className="flex h-full flex-col justify-between p-6">
          <div className="space-y-8">
            {/* Logo */}
            <Link href="/dashboard?tab=market" className="flex items-center gap-3 px-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-400 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                <span className="text-base font-extrabold text-white">A</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-white leading-none">
                  Artha
                </span>
                <span className="text-[10px] font-semibold text-blue-400 tracking-wider uppercase mt-0.5">
                  Wealth
                </span>
              </div>
            </Link>

            {/* Nav Items */}
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} href={item.href}>
                    <span
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        item.isActive
                          ? "bg-zinc-800 text-white font-bold border border-zinc-700 shadow-sm"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-800/50 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 ${item.isActive ? "text-blue-400 stroke-[2.5]" : "text-zinc-400"}`} />
                        <span>{item.name}</span>
                      </div>
                      {item.isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]" />
                      )}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="pt-6 border-t border-[#27272a] space-y-3">
            <div className="p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-800/60 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white tracking-tight">Finance Engine</p>
                <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </p>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">v1.2</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-[#27272a] bg-[#09090b]/90 backdrop-blur-xl sticky top-0 z-40">
        <Link href="/dashboard?tab=market" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-emerald-400 p-0.5 shadow-md shadow-blue-500/20">
            <span className="text-xs font-bold text-white">A</span>
          </div>
          <span className="text-base font-bold tracking-tight text-white">
            Artha <span className="text-blue-400 text-xs font-semibold uppercase tracking-wider ml-0.5">Wealth</span>
          </span>
        </Link>

        <button 
          onClick={() => setSheetOpen(true)}
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/60 border border-zinc-800"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="right" className="bg-[#09090b] border-[#27272a] p-0 w-80 flex flex-col justify-between">
            <div>
              <SheetHeader className="p-5 border-b border-[#27272a]">
                <SheetTitle className="text-white flex items-center gap-2 text-left">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs">
                    A
                  </div>
                  Artha Wealth
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
                      className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                        item.isActive
                          ? "bg-zinc-800 text-white border border-zinc-700 font-semibold"
                          : "text-zinc-300 hover:bg-zinc-800/50 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 ${item.isActive ? "text-blue-400" : "text-zinc-400"}`} />
                        <span>{item.name}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-zinc-600" />
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="p-5 border-t border-[#27272a] bg-zinc-950">
              <p className="text-xs font-semibold text-white">Artha Wealth Platform</p>
              <p className="text-[11px] text-zinc-500 mt-1">
                Global Stock Markets, Mutual Funds Aggregator, Forex & SIP Engine.
              </p>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Mobile Bottom Navigation Capsule with High Z-Index Guarantee & Safe Area Inset Support (120Hz GPU Composited) */}
      <nav className="lg:hidden fixed bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))] left-2.5 right-2.5 sm:left-4 sm:right-4 z-[999] rounded-2xl border border-[#27272a] bg-[#09090b]/95 backdrop-blur-2xl shadow-2xl shadow-black/95 p-1.5 touch-manipulation select-none transform-gpu will-change-transform">
        <div className="grid grid-cols-5 gap-1">
          {/* 1. Market */}
          <Link
            href="/dashboard?tab=market"
            onClick={(e) => handleBottomTabClick(e, "market")}
            className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-150 ease-out active:scale-95 touch-manipulation cursor-pointer ${
              pathname === "/dashboard" && activeNavTab === "market"
                ? "bg-zinc-800 text-white font-extrabold border border-zinc-700 shadow-md"
                : "text-zinc-400 hover:text-zinc-200 border border-transparent"
            }`}
          >
            {pathname === "/dashboard" && activeNavTab === "market" && (
              <span className="absolute -top-1 w-6 h-1 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]" />
            )}
            <Activity className={`h-4 w-4 ${pathname === "/dashboard" && activeNavTab === "market" ? "text-blue-400 stroke-[2.5]" : "text-zinc-400"}`} />
            <span className={`text-[10px] tracking-tight mt-1 ${pathname === "/dashboard" && activeNavTab === "market" ? "font-bold text-white" : "font-medium text-zinc-400"}`}>Markets</span>
          </Link>

          {/* 2. Funds */}
          <Link
            href="/dashboard?tab=funds"
            onClick={(e) => handleBottomTabClick(e, "funds")}
            className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-150 ease-out active:scale-95 touch-manipulation cursor-pointer ${
              pathname === "/dashboard" && activeNavTab === "funds"
                ? "bg-zinc-800 text-white font-extrabold border border-zinc-700 shadow-md"
                : "text-zinc-400 hover:text-zinc-200 border border-transparent"
            }`}
          >
            {pathname === "/dashboard" && activeNavTab === "funds" && (
              <span className="absolute -top-1 w-6 h-1 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]" />
            )}
            <Compass className={`h-4 w-4 ${pathname === "/dashboard" && activeNavTab === "funds" ? "text-blue-400 stroke-[2.5]" : "text-zinc-400"}`} />
            <span className={`text-[10px] tracking-tight mt-1 ${pathname === "/dashboard" && activeNavTab === "funds" ? "font-bold text-white" : "font-medium text-zinc-400"}`}>Funds</span>
          </Link>

          {/* 3. Currency */}
          <Link
            href="/dashboard?tab=currency"
            onClick={(e) => handleBottomTabClick(e, "currency")}
            className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-150 ease-out active:scale-95 touch-manipulation cursor-pointer ${
              pathname === "/dashboard" && activeNavTab === "currency"
                ? "bg-zinc-800 text-white font-extrabold border border-zinc-700 shadow-md"
                : "text-zinc-400 hover:text-zinc-200 border border-transparent"
            }`}
          >
            {pathname === "/dashboard" && activeNavTab === "currency" && (
              <span className="absolute -top-1 w-6 h-1 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]" />
            )}
            <Coins className={`h-4 w-4 ${pathname === "/dashboard" && activeNavTab === "currency" ? "text-blue-400 stroke-[2.5]" : "text-zinc-400"}`} />
            <span className={`text-[10px] tracking-tight mt-1 ${pathname === "/dashboard" && activeNavTab === "currency" ? "font-bold text-white" : "font-medium text-zinc-400"}`}>Currency</span>
          </Link>

          {/* 4. SIP Calculator */}
          <Link
            href="/dashboard?tab=sip"
            onClick={(e) => handleBottomTabClick(e, "sip")}
            className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-150 ease-out active:scale-95 touch-manipulation cursor-pointer ${
              (pathname === "/dashboard" && activeNavTab === "sip") || pathname === "/sip-calculator"
                ? "bg-zinc-800 text-white font-extrabold border border-zinc-700 shadow-md"
                : "text-zinc-400 hover:text-zinc-200 border border-transparent"
            }`}
          >
            {((pathname === "/dashboard" && activeNavTab === "sip") || pathname === "/sip-calculator") && (
              <span className="absolute -top-1 w-6 h-1 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]" />
            )}
            <Calculator className={`h-4 w-4 ${(pathname === "/dashboard" && activeNavTab === "sip") || pathname === "/sip-calculator" ? "text-blue-400 stroke-[2.5]" : "text-zinc-400"}`} />
            <span className={`text-[10px] tracking-tight mt-1 ${(pathname === "/dashboard" && activeNavTab === "sip") || pathname === "/sip-calculator" ? "font-bold text-white" : "font-medium text-zinc-400"}`}>SIP Calc</span>
          </Link>

          {/* 5. More */}
          <button
            onClick={() => setSheetOpen(true)}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-xl text-zinc-400 hover:text-zinc-200 active:scale-95 transition-all duration-150 ease-out border border-transparent touch-manipulation cursor-pointer"
          >
            <Menu className="h-4 w-4 text-zinc-400" />
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
