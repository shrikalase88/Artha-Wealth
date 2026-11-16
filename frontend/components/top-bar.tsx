"use client";

import { Clock, Globe, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

export function TopBar() {
  const [mounted, setMounted] = useState(false);
  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setDateStr(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="hidden lg:flex h-14 border-b border-zinc-200/90 dark:border-white/[0.08] bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-xl px-8 items-center justify-between sticky top-0 z-40 w-full select-none transition-colors duration-200">
      {/* Left side: Live Market Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
          <span>Live Market Feeds</span>
        </div>
        <span className="text-zinc-300 dark:text-zinc-600 text-xs">•</span>
        <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
          <Globe className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400 stroke-[1.8]" />
          <span>India • US • Europe • Asia</span>
        </div>
      </div>

      {/* Right side: Real-time Market Clock, Institutional Feed & Theme Toggle */}
      <div className="flex items-center gap-3.5">
        {mounted && (
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-600 dark:text-zinc-400">
            <Clock className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 stroke-[1.8]" />
            <span>{dateStr}</span>
            <span className="text-zinc-300 dark:text-zinc-600">•</span>
            <span className="text-zinc-900 dark:text-zinc-200 font-semibold">{timeStr}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/90 dark:border-white/[0.08] text-xs font-mono text-zinc-700 dark:text-zinc-300">
          <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 stroke-[1.8]" />
          <span>AMFI & NSE Verified</span>
        </div>
        
        {/* Apple Style Bright White / Dark Mode Toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
}
