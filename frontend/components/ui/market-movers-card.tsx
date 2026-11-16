"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Layers } from "lucide-react";

export interface MoverStockItem {
  name: string;
  value: number; // Share Price
  change_pct?: number;
  change?: number;
  symbol?: string;
  subtext?: string;
}

interface MarketMoversCardProps {
  data: MoverStockItem[];
  currencySymbol?: string;
  className?: string;
}

export function MarketMoversCard({
  data,
  currencySymbol = "₹",
  className,
}: MarketMoversCardProps) {
  const [filter, setFilter] = useState<"all" | "gainers" | "losers">("all");
  const [activeHoverIdx, setActiveHoverIdx] = useState<number | null>(null);

  // Compute processed movers and market breadth
  const { filteredMovers, maxPct, gainersCount, losersCount, avgNetChange } = useMemo(() => {
    if (!data || data.length === 0) {
      return { filteredMovers: [], maxPct: 1, gainersCount: 0, losersCount: 0, avgNetChange: 0 };
    }

    const items = [...data];
    let max = 1.0;
    let net = 0;
    let gainers = 0;
    let losers = 0;

    items.forEach((item) => {
      const pct = Number(item.change_pct ?? item.change ?? 0);
      const abs = Math.abs(pct);
      if (abs > max) max = abs;
      net += pct;
      if (pct >= 0) gainers++;
      else losers++;
    });

    // Safe ceiling for bar scaling (e.g. 2.5%, 5%, etc.)
    const safeMax = Math.max(1.5, Math.ceil(max * 1.15 * 10) / 10);
    const avg = items.length > 0 ? net / items.length : 0;

    let filtered = items;
    if (filter === "gainers") {
      filtered = items.filter((i) => Number(i.change_pct ?? i.change ?? 0) >= 0);
    } else if (filter === "losers") {
      filtered = items.filter((i) => Number(i.change_pct ?? i.change ?? 0) < 0);
    }

    // Sort by absolute magnitude or rank
    const sorted = [...filtered]
      .sort((a, b) => Math.abs(Number(b.change_pct ?? b.change ?? 0)) - Math.abs(Number(a.change_pct ?? a.change ?? 0)))
      .slice(0, 5);

    return {
      filteredMovers: sorted,
      maxPct: safeMax,
      gainersCount: gainers,
      losersCount: losers,
      avgNetChange: avg,
    };
  }, [data, filter]);

  if (!data || data.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8 text-center text-xs text-zinc-500 font-sans", className)}>
        <Layers className="h-6 w-6 text-zinc-600 mb-2 stroke-[1.5]" />
        <span>No market movers data available</span>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col w-full space-y-3 font-sans select-none", className)}>
      {/* Sub-Header: Segmented Filter Pills & Breadth Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-white/[0.06]">
        {/* Emil Kowalski style Segmented Pill Switcher */}
        <div className="flex items-center p-0.5 rounded-lg bg-zinc-900/90 border border-white/[0.08] shadow-inner">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "px-2.5 py-1 text-[11px] font-medium rounded-md transition-all duration-150 cursor-pointer active:scale-95",
              filter === "all"
                ? "bg-zinc-800 text-white font-semibold shadow-xs"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            All Top 5
          </button>
          <button
            type="button"
            onClick={() => setFilter("gainers")}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md transition-all duration-150 cursor-pointer active:scale-95",
              filter === "gainers"
                ? "bg-emerald-950/80 text-emerald-300 font-semibold border border-emerald-500/20 shadow-xs"
                : "text-zinc-400 hover:text-emerald-400"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Gainers ({gainersCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("losers")}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md transition-all duration-150 cursor-pointer active:scale-95",
              filter === "losers"
                ? "bg-rose-950/80 text-rose-300 font-semibold border border-rose-500/20 shadow-xs"
                : "text-zinc-400 hover:text-rose-400"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Decliners ({losersCount})
          </button>
        </div>

        {/* Market Velocity & Scale Badge */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
          <span className="hidden sm:inline-block">Scale: ±{maxPct.toFixed(1)}%</span>
          <span className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border",
            avgNetChange >= 0
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
          )}>
            {avgNetChange >= 0 ? <TrendingUp className="h-3 w-3 stroke-[2]" /> : <TrendingDown className="h-3 w-3 stroke-[2]" />}
            <span>Net {avgNetChange >= 0 ? "+" : ""}{avgNetChange.toFixed(2)}%</span>
          </span>
        </div>
      </div>

      {/* Axis Scale Markers for Diverging Chart */}
      <div className="relative w-full hidden sm:flex items-center justify-between px-[120px] text-[9px] font-mono text-zinc-500 pt-0.5">
        <span className="text-rose-400/80">-{maxPct.toFixed(1)}%</span>
        <div className="flex items-center gap-1 text-zinc-400 font-medium">
          <span className="w-1 h-1 rounded-full bg-zinc-400" />
          <span>0.0% Axis</span>
        </div>
        <span className="text-emerald-400/80">+{maxPct.toFixed(1)}%</span>
      </div>

      {/* List of High-Precision Diverging Delta Rows */}
      <div className="divide-y divide-white/[0.04]">
        {filteredMovers.map((mover, idx) => {
          const pct = Number(mover.change_pct ?? mover.change ?? 0);
          const isPositive = pct >= 0;
          const absPct = Math.abs(pct);
          const barWidthPercent = Math.min(100, Math.max(8, (absPct / maxPct) * 100));
          const isHovered = activeHoverIdx === idx;

          return (
            <div
              key={mover.symbol || mover.name || idx}
              onMouseEnter={() => setActiveHoverIdx(idx)}
              onMouseLeave={() => setActiveHoverIdx(null)}
              className={cn(
                "group relative flex items-center justify-between py-2.5 px-2 rounded-xl transition-all duration-150 ease-out cursor-pointer",
                isHovered ? "bg-white/[0.04] shadow-xs" : "hover:bg-white/[0.02]"
              )}
            >
              {/* Left Column: Rank, Ticker & Name */}
              <div className="flex items-center gap-2.5 min-w-0 w-[38%] sm:w-[28%] shrink-0">
                <span className="text-[10px] font-mono font-medium text-zinc-500 w-4 text-center">
                  #{idx + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-semibold text-white tracking-tight truncate group-hover:text-blue-400 transition-colors">
                      {mover.name}
                    </span>
                    {mover.symbol && (
                      <span className="hidden md:inline-block text-[9px] font-mono text-zinc-400 bg-zinc-800/80 px-1.5 py-0.2 rounded border border-white/[0.05]">
                        {mover.symbol}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400 font-mono truncate">
                    {currencySymbol}{Number(mover.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Center Column: Professional Diverging Bi-Directional Delta Bar */}
              <div className="flex-1 mx-2 sm:mx-4 relative h-6 flex items-center">
                {/* Background Track with Center Zero Line */}
                <div className="absolute inset-x-0 h-1.5 bg-zinc-800/60 rounded-full overflow-hidden border border-white/[0.04]">
                  {/* Subtle center hairline at 50% */}
                  <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/20 z-10" />
                </div>

                {/* Diverging Bar extending from Center (50%) */}
                <div className="absolute inset-x-0 h-full flex items-center">
                  {isPositive ? (
                    // Gainers extend from 50% to the right
                    <div 
                      className="absolute left-1/2 h-2 rounded-r-full transition-all duration-300 ease-out"
                      style={{
                        width: `${barWidthPercent / 2}%`,
                        background: isHovered
                          ? "linear-gradient(90deg, #10b981 0%, #34d399 100%)"
                          : "linear-gradient(90deg, #059669 0%, #10b981 100%)",
                        boxShadow: isHovered ? "0 0 10px rgba(16, 185, 129, 0.4)" : "none",
                      }}
                    />
                  ) : (
                    // Decliners extend from 50% to the left
                    <div 
                      className="absolute right-1/2 h-2 rounded-l-full transition-all duration-300 ease-out"
                      style={{
                        width: `${barWidthPercent / 2}%`,
                        background: isHovered
                          ? "linear-gradient(270deg, #f43f5e 0%, #fb7185 100%)"
                          : "linear-gradient(270deg, #e11d48 0%, #f43f5e 100%)",
                        boxShadow: isHovered ? "0 0 10px rgba(244, 63, 94, 0.4)" : "none",
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Right Column: High-Precision Percentage Pill & Points */}
              <div className="flex items-center justify-end gap-1.5 shrink-0 w-[24%] sm:w-[20%] text-right">
                <div className={cn(
                  "flex items-center justify-center gap-0.5 px-2 py-1 rounded-md text-[11px] sm:text-xs font-mono font-bold border transition-colors min-w-[68px] sm:min-w-[76px]",
                  isPositive
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:bg-emerald-500/15"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20 group-hover:bg-rose-500/15"
                )}>
                  {isPositive ? (
                    <ArrowUpRight className="h-3 w-3 stroke-[2.2] shrink-0" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 stroke-[2.2] shrink-0" />
                  )}
                  <span>
                    {isPositive ? "+" : ""}{pct.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
