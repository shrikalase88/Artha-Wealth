"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserMenu } from "@/components/user-menu";

interface TopBarProps {
  user?: any;
}

export function TopBar({ user: initialUser }: TopBarProps) {
  const supabase = createClient();
  const [user, setUser] = useState<any>(initialUser || null);

  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
      return;
    }

    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [initialUser, supabase]);

  if (!user) return null;

  return (
    <header className="hidden lg:flex h-16 border-b border-[#27272a] bg-[#09090b]/95 backdrop-blur-xl px-8 items-center justify-between sticky top-0 z-40 w-full">
      {/* Left side: Empty placeholder for flex-between layout */}
      <div className="flex items-center gap-2"></div>

      {/* Right side: User Menu */}
      <div className="flex items-center gap-4">
        {/* User Profile Menu */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-semibold text-white">
              {user.user_metadata?.full_name || user.email?.split("@")[0]}
            </p>
            <p className="text-[10px] text-zinc-400 font-light truncate max-w-[150px]">{user.email}</p>
          </div>
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
