"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User, Settings, LogOut } from "lucide-react";

export function UserMenu({ user }: { user: { email?: string | null } }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border hover:bg-muted focus:outline-none"
      >
        <User className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/10 bg-[#0f172a]/95 backdrop-blur-md p-1.5 shadow-2xl z-50">
          <div className="px-2.5 py-2">
            <p className="text-sm font-semibold text-white">
              {user.email?.split("@")[0] ?? "User"}
            </p>
            <p className="text-[10px] text-slate-400 font-light truncate mt-0.5">{user.email}</p>
          </div>
          <div className="h-px bg-white/5 my-1" />
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-150"
          >
            <Settings className="h-4 w-4 text-slate-400" />
            Settings
          </Link>
          <div className="h-px bg-white/5 my-1" />
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-150"
          >
            <LogOut className="h-4 w-4 text-red-400" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
