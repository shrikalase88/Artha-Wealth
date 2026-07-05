"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserMenu } from "@/components/user-menu";
import { Bell, Sparkles } from "lucide-react";

export function TopBar() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);

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

  if (!user) return null;

  return (
    <header className="hidden lg:flex h-16 border-b border-white/10 bg-[#070a13]/40 backdrop-blur-xl px-8 items-center justify-between sticky top-0 z-40 w-full">
      {/* Left side: Welcome tag */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-blue-400 animate-pulse" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Artha Premium Lounge
        </span>
      </div>

      {/* Right side: Action items and User Menu */}
      <div className="flex items-center gap-4">
        {/* Notification Icon */}
        <button className="relative p-1.5 rounded-full border border-white/5 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
        </button>

        {/* User Profile Menu */}
        <div className="border-l border-white/5 pl-4 flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-semibold text-white">
              {user.user_metadata?.full_name || user.email?.split("@")[0]}
            </p>
            <p className="text-[10px] text-slate-500 font-light truncate max-w-[150px]">{user.email}</p>
          </div>
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
