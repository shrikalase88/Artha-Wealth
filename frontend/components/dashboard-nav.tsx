"use client";

import { useEffect, useState, Suspense } from "react";
import useSWR from "swr";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  Activity, 
  Compass, 
  Briefcase, 
  Coins, 
  Upload, 
  Calculator, 
  Settings, 
  LogOut, 
  Info, 
  Phone, 
  Menu, 
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

function DashboardNavContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const currentTab = searchParams ? searchParams.get("tab") : null;

  const navItems = [
    { 
      name: "Markets", 
      href: "/dashboard?tab=market", 
      icon: Activity,
      isActive: pathname === "/dashboard" && (currentTab === "market" || !currentTab)
    },
    { 
      name: "Funds", 
      href: "/dashboard?tab=funds", 
      icon: Compass,
      isActive: pathname === "/dashboard" && currentTab === "funds"
    },
    { 
      name: "Portfolio", 
      href: "/dashboard?tab=portfolio", 
      icon: Briefcase,
      isActive: pathname === "/dashboard" && currentTab === "portfolio"
    },
    { 
      name: "Currency", 
      href: "/dashboard?tab=currency", 
      icon: Coins,
      isActive: pathname === "/dashboard" && currentTab === "currency"
    },
    { 
      name: "Upload Statement", 
      href: "/portfolio/upload", 
      icon: Upload,
      isActive: pathname === "/portfolio/upload" 
    },
    { 
      name: "SIP Calculator", 
      href: "/sip-calculator", 
      icon: Calculator,
      isActive: pathname === "/sip-calculator" 
    },
    { 
      name: "Settings", 
      href: "/settings", 
      icon: Settings,
      isActive: pathname === "/settings" 
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

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
                  Wealth OS
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

          {/* Desktop Footer profile */}
          <div className="border-t border-[#27272a] pt-4 flex items-center justify-between">
            {user ? (
              <>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-xs font-bold text-white shadow-inner">
                    {user.email?.[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate max-w-[110px]">
                      {user.user_metadata?.full_name || user.email?.split("@")[0]}
                    </p>
                    <p className="text-[10px] text-zinc-400 truncate max-w-[110px]">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Log out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <Link href="/login" className="w-full">
                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-[#27272a] bg-[#09090b]/95 backdrop-blur-xl px-4">
        <Link href="/dashboard?tab=market" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-emerald-400 p-0.5 shadow-md shadow-blue-500/20">
            <span className="text-xs font-bold text-white">A</span>
          </div>
          <span className="text-base font-bold tracking-tight text-white">
            Artha <span className="text-blue-400 font-medium text-xs">Wealth</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Shadcn Sheet Drawer Trigger */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger
              className="p-2 rounded-lg border border-[#27272a] bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="h-4 w-4" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px] bg-[#09090b] border-l border-[#27272a] text-white p-0 flex flex-col justify-between">
              <div>
                <SheetHeader className="p-5 border-b border-[#27272a] text-left">
                  <SheetTitle className="text-white flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-emerald-400 p-0.5">
                      <span className="text-xs font-bold text-white">A</span>
                    </div>
                    <span className="font-bold text-base">Navigation</span>
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

              {/* Drawer User Info */}
              <div className="p-5 border-t border-[#27272a] bg-zinc-950 space-y-3">
                {user ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 font-bold text-white">
                        {user.email?.[0].toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white truncate">
                          {user.user_metadata?.full_name || "User"}
                        </p>
                        <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSheetOpen(false);
                        handleSignOut();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link href="/login" onClick={() => setSheetOpen(false)} className="w-full">
                    <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl">
                      Sign In
                    </Button>
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Mobile Bottom Navigation Capsule with High Z-Index Guarantee */}
      <nav className="lg:hidden fixed bottom-3 left-3 right-3 z-[999] rounded-2xl border border-[#27272a] bg-[#09090b]/95 backdrop-blur-2xl shadow-2xl shadow-black/95 p-1.5">
        <div className="grid grid-cols-5 gap-1">
          {/* 1. Market */}
          <Link
            href="/dashboard?tab=market"
            className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 ${
              pathname === "/dashboard" && (currentTab === "market" || !currentTab)
                ? "bg-zinc-800 text-white font-extrabold border border-zinc-700 shadow-md scale-[1.02]"
                : "text-zinc-400 hover:text-zinc-200 border border-transparent"
            }`}
          >
            {pathname === "/dashboard" && (currentTab === "market" || !currentTab) && (
              <span className="absolute -top-1 w-6 h-1 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]" />
            )}
            <Activity className={`h-4 w-4 ${pathname === "/dashboard" && (currentTab === "market" || !currentTab) ? "text-blue-400 stroke-[2.5]" : "text-zinc-400"}`} />
            <span className={`text-[10px] tracking-tight mt-1 ${pathname === "/dashboard" && (currentTab === "market" || !currentTab) ? "font-bold text-white" : "font-medium text-zinc-400"}`}>Markets</span>
          </Link>

          {/* 2. Funds */}
          <Link
            href="/dashboard?tab=funds"
            className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 ${
              pathname === "/dashboard" && currentTab === "funds"
                ? "bg-zinc-800 text-white font-extrabold border border-zinc-700 shadow-md scale-[1.02]"
                : "text-zinc-400 hover:text-zinc-200 border border-transparent"
            }`}
          >
            {pathname === "/dashboard" && currentTab === "funds" && (
              <span className="absolute -top-1 w-6 h-1 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]" />
            )}
            <Compass className={`h-4 w-4 ${pathname === "/dashboard" && currentTab === "funds" ? "text-blue-400 stroke-[2.5]" : "text-zinc-400"}`} />
            <span className={`text-[10px] tracking-tight mt-1 ${pathname === "/dashboard" && currentTab === "funds" ? "font-bold text-white" : "font-medium text-zinc-400"}`}>Funds</span>
          </Link>

          {/* 3. Portfolio */}
          <Link
            href="/dashboard?tab=portfolio"
            className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 ${
              pathname === "/dashboard" && currentTab === "portfolio"
                ? "bg-zinc-800 text-white font-extrabold border border-zinc-700 shadow-md scale-[1.02]"
                : "text-zinc-400 hover:text-zinc-200 border border-transparent"
            }`}
          >
            {pathname === "/dashboard" && currentTab === "portfolio" && (
              <span className="absolute -top-1 w-6 h-1 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]" />
            )}
            <Briefcase className={`h-4 w-4 ${pathname === "/dashboard" && currentTab === "portfolio" ? "text-blue-400 stroke-[2.5]" : "text-zinc-400"}`} />
            <span className={`text-[10px] tracking-tight mt-1 ${pathname === "/dashboard" && currentTab === "portfolio" ? "font-bold text-white" : "font-medium text-zinc-400"}`}>Portfolio</span>
          </Link>

          {/* 4. Currency */}
          <Link
            href="/dashboard?tab=currency"
            className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 ${
              pathname === "/dashboard" && currentTab === "currency"
                ? "bg-zinc-800 text-white font-extrabold border border-zinc-700 shadow-md scale-[1.02]"
                : "text-zinc-400 hover:text-zinc-200 border border-transparent"
            }`}
          >
            {pathname === "/dashboard" && currentTab === "currency" && (
              <span className="absolute -top-1 w-6 h-1 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]" />
            )}
            <Coins className={`h-4 w-4 ${pathname === "/dashboard" && currentTab === "currency" ? "text-blue-400 stroke-[2.5]" : "text-zinc-400"}`} />
            <span className={`text-[10px] tracking-tight mt-1 ${pathname === "/dashboard" && currentTab === "currency" ? "font-bold text-white" : "font-medium text-zinc-400"}`}>Currency</span>
          </Link>

          {/* 5. More */}
          <button
            onClick={() => setSheetOpen(true)}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-xl text-zinc-400 hover:text-zinc-200 transition-all duration-200 border border-transparent"
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
