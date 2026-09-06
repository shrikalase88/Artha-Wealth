"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Activity, Sparkles } from "lucide-react";

export interface MoverDataItem {
  name: string;
  value: number; // Current Share Price
  change_pct?: number; // % change
  change?: number; // Points change
  symbol?: string;
  subtext?: string;
}

interface RadialVelocityGaugeProps {
  data: MoverDataItem[];
  currencySymbol?: string;
  className?: string;
}

// Convert polar angle to cartesian coordinates (12 o'clock = -90 deg)
function polarToCartesian(cx: number, cy: number, r: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(angleInRadians),
    y: cy + r * Math.sin(angleInRadians),
  };
}

// Generate SVG arc string
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  if (Math.abs(endAngle - startAngle) < 0.5) return "";
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;

  return ["M", start.x, start.y, "A", r, r, 0, largeArcFlag, 1, end.x, end.y].join(" ");
}

export function RadialVelocityGauge({
  data,
  currencySymbol = "₹",
  className,
}: RadialVelocityGaugeProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Compute market breadth and bounds
  const { maxPct, moversWithMeta, netChange, gainersCount, losersCount } = useMemo(() => {
    if (!data || data.length === 0) {
      return { maxPct: 1, moversWithMeta: [], netChange: 0, gainersCount: 0, losersCount: 0 };
    }

    const items = data.slice(0, 5);
    let max = 0.8;
    let net = 0;
    let gainers = 0;
    let losers = 0;

    items.forEach((item) => {
      const pct = Number(item.change_pct ?? 0);
      const absPct = Math.abs(pct);
      if (absPct > max) max = absPct;
      net += pct;
      if (pct >= 0) gainers++;
      else losers++;
    });

    // Ensure nice rounded scale boundary (at least 1.5%)
    const safeMax = Math.max(1.5, Math.ceil(max * 1.2 * 10) / 10);
    const avgNet = items.length > 0 ? net / items.length : 0;

    // Rings radii: outer ring (0) to innermost ring (4)
    const baseRadii = [88, 75, 62, 49, 36];

    const moversWithMeta = items.map((item, idx) => {
      const pct = Number(item.change_pct ?? 0);
      const isPositive = pct >= 0;
      const magnitude = Math.abs(pct);
      // Sweeps between 6° (minimum visibility) up to 80° (maximum deflection)
      const sweepAngle = Math.max(6, Math.min(80, (magnitude / safeMax) * 80));
      const radius = baseRadii[idx] ?? 36;

      let startAngle = -90;
      let endAngle = -90;

      if (isPositive) {
        // Gainers sweep clockwise (Right)
        startAngle = -90;
        endAngle = -90 + sweepAngle;
      } else {
        // Losers sweep counter-clockwise (Left)
        startAngle = -90 - sweepAngle;
        endAngle = -90;
      }

      return {
        ...item,
        pct,
        isPositive,
        magnitude,
        radius,
        startAngle,
        endAngle,
        idx,
      };
    });

    return {
      maxPct: safeMax,
      moversWithMeta,
      netChange: avgNet,
      gainersCount: gainers,
      losersCount: losers,
    };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className={cn("flex h-full w-full items-center justify-center text-xs text-slate-400 font-light", className)}>
        No market mover data available.
      </div>
    );
  }

  const cx = 140;
  const cy = 135;
  const activeStock = hoveredIndex !== null ? moversWithMeta[hoveredIndex] : null;

  return (
    <div className={cn("relative w-full flex flex-col items-center select-none py-1", className)}>
      {/* Top Dial Scale Header */}
      <div className="w-full flex items-center justify-between px-3 text-[10px] font-mono text-zinc-500 font-medium mb-1">
        <span className="flex items-center gap-1 text-rose-400 font-bold">
          <TrendingDown className="h-3 w-3" />
          <span>-{maxPct.toFixed(1)}%</span>
        </span>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800/60 border border-slate-700/60 text-zinc-400 text-[9px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span>0.0% Neutral Axis</span>
        </div>
        <span className="flex items-center gap-1 text-emerald-400 font-bold">
          <span>+{maxPct.toFixed(1)}%</span>
          <TrendingUp className="h-3 w-3" />
        </span>
      </div>

      {/* SVG Dual-Arc Gauge */}
      <div className="relative w-full max-w-[280px] h-[165px] flex items-center justify-center">
        <svg
          viewBox="0 0 280 165"
          className="w-full h-full overflow-visible"
          style={{ transform: "translateZ(0)" }}
        >
          <defs>
            {/* Emerald Gainers Gradient */}
            <linearGradient id="gauge-green-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>

            {/* Ruby Losers Gradient */}
            <linearGradient id="gauge-red-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>

            {/* High-Luminance Glow Filter */}
            <filter id="arc-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Guide Tracks for all 5 concentric rings */}
          {moversWithMeta.map((mover) => (
            <path
              key={`track-${mover.idx}`}
              d={describeArc(cx, cy, mover.radius, -172, -8)}
              fill="none"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth={hoveredIndex === mover.idx ? 8 : 6}
              strokeLinecap="round"
              className="transition-all duration-200"
            />
          ))}

          {/* Central 0% Neutral Axis Guideline */}
          <line
            x1={cx}
            y1={cy - 96}
            x2={cx}
            y2={cy - 26}
            stroke="rgba(96, 165, 250, 0.45)"
            strokeWidth="1.5"
            strokeDasharray="2 3"
          />

          {/* Active Radial Velocity Arcs */}
          {moversWithMeta.map((mover) => {
            const isHovered = hoveredIndex === mover.idx;
            const isAnyHovered = hoveredIndex !== null;
            const opacity = isAnyHovered ? (isHovered ? 1 : 0.25) : 0.95;
            const strokeWidth = isHovered ? 8.5 : 6;
            const strokeColor = mover.isPositive ? "url(#gauge-green-grad)" : "url(#gauge-red-grad)";
            const arcPath = describeArc(cx, cy, mover.radius, mover.startAngle, mover.endAngle);

            if (!arcPath) return null;

            return (
              <g key={`arc-group-${mover.idx}`}>
                <path
                  d={arcPath}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  opacity={opacity}
                  filter={isHovered ? "url(#arc-glow)" : undefined}
                  className="cursor-pointer transition-all duration-200 will-change-[stroke-width,opacity]"
                  onMouseEnter={() => setHoveredIndex(mover.idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
                {/* Glowing Endpoint Bead */}
                {(() => {
                  const beadAngle = mover.isPositive ? mover.endAngle : mover.startAngle;
                  const pt = polarToCartesian(cx, cy, mover.radius, beadAngle);
                  return (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 3.5 : 2.5}
                      fill={mover.isPositive ? "#6ee7b7" : "#fda4af"}
                      opacity={opacity}
                      className="pointer-events-none transition-all duration-200"
                    />
                  );
                })()}
              </g>
            );
          })}
        </svg>

        {/* Dynamic Center HUD Readout */}
        <div className="absolute inset-x-0 bottom-2 flex flex-col items-center justify-center text-center pointer-events-none">
          {activeStock ? (
            <div className="animate-fade-in-scale flex flex-col items-center">
              <span className="text-[11px] font-bold text-white tracking-wide flex items-center gap-1 font-sans">
                {activeStock.name}
              </span>
              <span
                className={cn(
                  "text-base font-extrabold font-mono tracking-tight",
                  activeStock.isPositive ? "text-emerald-400" : "text-rose-400"
                )}
              >
                {activeStock.isPositive ? "+" : ""}
                {activeStock.pct.toFixed(2)}%
              </span>
              <span className="text-[10px] font-mono text-zinc-400 font-semibold">
                {currencySymbol}
                {activeStock.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center animate-fade-in-up">
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    netChange >= 0 ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-rose-400 shadow-[0_0_8px_#f43f5e]"
                  )}
                />
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">
                  {netChange >= 0 ? "Bullish Velocity" : "Bearish Velocity"}
                </span>
              </div>
              <span
                className={cn(
                  "text-sm font-extrabold font-mono tracking-tight mt-0.5",
                  netChange >= 0 ? "text-emerald-400" : "text-rose-400"
                )}
              >
                {netChange >= 0 ? "+" : ""}
                {netChange.toFixed(2)}% <span className="text-[10px] font-medium text-zinc-500 font-sans">Avg</span>
              </span>
              <span className="text-[9px] font-mono text-zinc-400 mt-0.5">
                {gainersCount} Gainers · {losersCount} Losers
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Quick-Glance Stock Pills (120Hz Tap / Hover) */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 mt-2 px-1">
        {moversWithMeta.map((mover) => {
          const isHovered = hoveredIndex === mover.idx;
          return (
            <div
              key={`pill-${mover.idx}`}
              onMouseEnter={() => setHoveredIndex(mover.idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={cn(
                "flex flex-col p-1.5 rounded-lg border transition-all duration-150 cursor-pointer select-none touch-manipulation will-change-transform active:scale-95",
                isHovered
                  ? mover.isPositive
                    ? "bg-emerald-500/15 border-emerald-500/50 shadow-md shadow-emerald-500/10 scale-105"
                    : "bg-rose-500/15 border-rose-500/50 shadow-md shadow-rose-500/10 scale-105"
                  : "bg-slate-900/60 border-white/5 hover:bg-slate-800/70 hover:border-white/10"
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold text-zinc-200 truncate">{mover.name}</span>
                <span
                  className={cn(
                    "text-[9px] font-mono font-bold px-1 py-0.2 rounded",
                    mover.isPositive ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"
                  )}
                >
                  {mover.isPositive ? "+" : ""}
                  {mover.pct.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400 mt-0.5">
                <span>{currencySymbol}{mover.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                <span className="text-[8px] text-zinc-500">R{mover.idx + 1}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
