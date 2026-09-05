"use client";

import { Activity, Clock } from "lucide-react";
import { useEffect, useState } from "react";

export function TopBar() {
  const [mounted, setMounted] = useState(false);
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      setDateStr(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      );
    };
    updateTime();
  }, []);

  return (
    <header className="hidden lg:flex h-14 border-b border-[#27272a] bg-[#09090b]/80 backdrop-blur-xl px-8 items-center justify-between sticky top-0 z-40 w-full select-none">
      {/* Left side: Live Engine Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Quant Engine</span>
        </div>
        <span className="text-zinc-500 text-xs font-mono">•</span>
        <span className="text-xs text-zinc-400 font-medium">Global Markets, Funds & Forex</span>
      </div>

      {/* Right side: Current Date & System Status */}
      <div className="flex items-center gap-4">
        {mounted && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
            <Clock className="h-3.5 w-3.5 text-zinc-400" />
            <span>{dateStr}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs text-blue-400 font-mono bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg">
          <Activity className="h-3.5 w-3.5" />
          <span>AMFI & NSE FEED</span>
        </div>
      </div>
    </header>
  );
}
