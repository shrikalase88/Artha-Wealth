"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { LayoutDashboard, Upload, Settings, Menu, X, Wallet, Calculator, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  if (loading || !user) return null;

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Upload Statement", href: "/portfolio/upload", icon: Upload },
    { name: "SIP Calculator", href: "/sip-calculator", icon: Calculator },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-6 bg-slate-950/60 lg:bg-transparent">
      <div className="space-y-8">
        {/* Logo */}
        <div className="flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-emerald-500 p-0.5">
            <span className="text-sm font-bold text-white">A</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Artha <span className="text-blue-500 font-medium text-xs tracking-wider uppercase ml-0.5">Wealth</span>
          </span>
        </div>

        {/* Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} onClick={() => setOpen(false)}>
                <span className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/15"
                    : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}>
                  <item.icon className={`h-4 w-4 ${active ? "text-blue-400" : "text-slate-400"}`} />
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User menu (mobile only) */}
      <div className="lg:hidden border-t border-white/5 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 border border-white/10 text-xs font-semibold text-slate-300">
            {user.email?.[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-white truncate max-w-[120px]">{user.user_metadata?.full_name || "User"}</p>
            <p className="text-[10px] text-slate-500 truncate max-w-[120px]">{user.email}</p>
          </div>
        </div>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/");
            router.refresh();
          }}
          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          title="Log out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-white/5 bg-[#070a13] h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Header (Top) */}
      <header className="lg:hidden sticky top-0 z-40 border-b border-white/10 bg-[#070a13]/85 backdrop-blur-xl w-full">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-white/5 hover:text-white h-10 w-10 text-slate-300 -ml-2">
                <Menu className="h-6 w-6" />
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0 border-r border-white/10 bg-[#070a13]">
                {sidebarContent}
              </SheetContent>
            </Sheet>
          </div>

        </div>
      </header>
    </>
  );
}
