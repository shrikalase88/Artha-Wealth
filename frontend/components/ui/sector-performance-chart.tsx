"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Layers, ArrowUpRight, ArrowDownRight } from "lucide-react";

export interface SectorItem {
  name: string;
  short?: string;
  change_pct?: number;
  change?: number;
  price?: number;
  market_cap?: string;
}

interface SectorPerformanceChartProps {
  data: SectorItem[];
  className?: string;
}

export function SectorPerformanceChart({
  data,
  className,
}: SectorPerformanceChartProps) {
  const [filter, setFilter] = useState<"all" | "gainers" | "losers">("all");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Compute metrics and bounds
  const {
    filteredData,
    gainersCount,
    losersCount,
    rangeMax,
    rangeMin,
    yTicks,
  } = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        filteredData: [],
        gainersCount: 0,
        losersCount: 0,
        rangeMax: 1.5,
        rangeMin: -1.0,
        yTicks: [-1.0, -0.5, 0, 0.5, 1.0, 1.5],
      };
    }

    let gainers = 0;
    let losers = 0;
    let maxPos = 0.5;
    let minNeg = -0.5;

    data.forEach((s) => {
      const pct = Number(s.change_pct ?? s.change ?? 0);
      if (pct >= 0) {
        gainers++;
        if (pct > maxPos) maxPos = pct;
      } else {
        losers++;
        if (pct < minNeg) minNeg = pct;
      }
    });

    // Dynamic clean step intervals (0.5% or 1.0% steps)
    const upper = Math.max(1.0, Math.ceil(maxPos * 1.25 * 2) / 2);
    const lower = Math.min(-0.5, Math.floor(minNeg * 1.25 * 2) / 2);
    const step = (upper - lower) > 4 ? 1.0 : 0.5;

    const ticks: number[] = [];
    for (let t = lower; t <= upper + 0.01; t += step) {
      ticks.push(Math.round(t * 10) / 10);
    }

    let filtered = data;
    if (filter === "gainers") {
      filtered = data.filter((s) => Number(s.change_pct ?? s.change ?? 0) >= 0);
    } else if (filter === "losers") {
      filtered = data.filter((s) => Number(s.change_pct ?? s.change ?? 0) < 0);
    }

    return {
      filteredData: filtered,
      gainersCount: gainers,
      losersCount: losers,
      rangeMax: upper,
      rangeMin: lower,
      yTicks: ticks,
    };
  }, [data, filter]);

  if (!data || data.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8 text-center text-xs text-zinc-500 font-sans", className)}>
        <Layers className="h-6 w-6 text-zinc-400 dark:text-zinc-600 mb-2 stroke-[1.5]" />
        <span>No sector performance data available</span>
      </div>
    );
  }

  // Chart coordinate space
  const chartWidth = 620;
  const chartHeight = 220;
  const paddingLeft = 48;
  const paddingRight = 18;
  const paddingTop = 26;
  const paddingBottom = 34;

  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;
  const totalRange = rangeMax - rangeMin || 1;

  const yForVal = (val: number) => {
    return paddingTop + ((rangeMax - val) / totalRange) * plotHeight;
  };

  const zeroY = yForVal(0);
  const count = filteredData.length || 1;
  const colWidth = plotWidth / count;
  const barWidth = Math.min(38, Math.max(22, colWidth * 0.54));

  const hoveredItem = hoveredIdx !== null ? filteredData[hoveredIdx] : null;

  return (
    <div className={cn("flex flex-col w-full space-y-3 font-sans select-none", className)}>
      {/* Header controls: Segmented breadcrumbs & Breadth */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-zinc-200/90 dark:border-white/[0.06]">
        {/* Apple style Segmented Pill Switcher */}
        <div className="flex items-center p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-white/[0.08] shadow-inner">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "px-2.5 py-1 text-[11px] font-medium rounded-md transition-all duration-150 cursor-pointer active:scale-95",
              filter === "all"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            )}
          >
            All Sectors ({data.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("gainers")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md transition-all duration-150 cursor-pointer active:scale-95",
              filter === "gainers"
                ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-500/20 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            Advancing ({gainersCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("losers")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md transition-all duration-150 cursor-pointer active:scale-95",
              filter === "losers"
                ? "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-semibold border border-rose-300 dark:border-rose-500/20 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400" />
            Declining ({losersCount})
          </button>
        </div>

        {/* Hover / Active Indicator */}
        <div className="text-[11px] font-mono font-medium flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
          {hoveredItem ? (
            <span className="flex items-center gap-1">
              <span className="font-semibold text-zinc-900 dark:text-white">
                {hoveredItem.name || hoveredItem.short}:
              </span>
              <span
                className={cn(
                  "font-bold",
                  (hoveredItem.change_pct ?? hoveredItem.change ?? 0) >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                )}
              >
                {(hoveredItem.change_pct ?? hoveredItem.change ?? 0) >= 0 ? "+" : ""}
                {Number(hoveredItem.change_pct ?? hoveredItem.change ?? 0).toFixed(2)}%
              </span>
            </span>
          ) : (
            <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Directional Momentum
            </span>
          )}
        </div>
      </div>

      {/* SVG Canvas with Horizontal Scroll on Narrow Viewports */}
      <div className="relative w-full overflow-x-auto scrollbar-none">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-[230px] min-w-[500px] overflow-visible select-none"
        >
          <defs>
            {/* Emerald Gradient (Good Trend) */}
            <linearGradient id="sectorGainGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            {/* Emerald Dark Mode Gradient */}
            <linearGradient id="sectorGainGradDark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>

            {/* Rose/Red Gradient (Losing Trend) */}
            <linearGradient id="sectorLossGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F43F5E" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>

            {/* Rose Dark Mode Gradient */}
            <linearGradient id="sectorLossGradDark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FB7185" />
              <stop offset="100%" stopColor="#E11D48" />
            </linearGradient>

            {/* Filter glow shadow */}
            <filter id="gainGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#10B981" floodOpacity="0.25" />
            </filter>
            <filter id="lossGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#F43F5E" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Gridlines and Y-axis Ticks */}
          {yTicks.map((tickVal) => {
            const y = yForVal(tickVal);
            const isZero = Math.abs(tickVal) < 0.001;
            return (
              <g key={tickVal}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  className={cn(
                    isZero
                      ? "stroke-zinc-300 dark:stroke-zinc-600 stroke-[1.5]"
                      : "stroke-zinc-100 dark:stroke-zinc-800/80 stroke-[1]"
                  )}
                  strokeDasharray={isZero ? undefined : "3 3"}
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className={cn(
                    "text-[10px] font-mono",
                    isZero
                      ? "fill-zinc-700 dark:fill-zinc-300 font-bold"
                      : "fill-zinc-600 dark:fill-zinc-400"
                  )}
                >
                  {tickVal > 0 ? `+${tickVal.toFixed(1)}%` : `${tickVal.toFixed(1)}%`}
                </text>
              </g>
            );
          })}

          {/* Bars & Column Labels */}
          {filteredData.map((item, idx) => {
            const pct = Number(item.change_pct ?? item.change ?? 0);
            const isPositive = pct >= 0;
            const isHovered = hoveredIdx === idx;

            const colX = paddingLeft + idx * colWidth;
            const barX = colX + (colWidth - barWidth) / 2;

            let barY: number;
            let barH: number;

            if (isPositive) {
              const targetY = yForVal(pct);
              barY = targetY;
              barH = Math.max(3, zeroY - targetY);
            } else {
              barY = zeroY;
              barH = Math.max(3, yForVal(pct) - zeroY);
            }

            const labelX = barX + barWidth / 2;
            const valueLabelY = isPositive ? barY - 7 : barY + barH + 13;

            return (
              <g
                key={item.short || item.name || idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer transition-transform duration-150"
              >
                {/* Column Highlight on Hover */}
                {isHovered && (
                  <rect
                    x={colX + 2}
                    y={paddingTop}
                    width={colWidth - 4}
                    height={plotHeight}
                    rx={6}
                    className="fill-zinc-100/80 dark:fill-white/[0.04] transition-all duration-150"
                  />
                )}

                {/* The Bar */}
                <rect
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={barH}
                  rx={4}
                  ry={4}
                  className={cn(
                    "transition-all duration-200",
                    isHovered && "opacity-95 stroke-2",
                    isPositive
                      ? "fill-[url(#sectorGainGrad)] dark:fill-[url(#sectorGainGradDark)] stroke-emerald-600/40 dark:stroke-emerald-300/40"
                      : "fill-[url(#sectorLossGrad)] dark:fill-[url(#sectorLossGradDark)] stroke-rose-600/40 dark:stroke-rose-300/40"
                  )}
                  style={{
                    filter: isHovered
                      ? isPositive
                        ? "url(#gainGlow)"
                        : "url(#lossGlow)"
                      : undefined,
                  }}
                />

                {/* Top/Bottom % Value Pill */}
                <text
                  x={labelX}
                  y={valueLabelY}
                  textAnchor="middle"
                  className={cn(
                    "text-[10px] font-mono font-bold transition-all duration-150",
                    isPositive
                      ? "fill-emerald-700 dark:fill-emerald-400"
                      : "fill-rose-700 dark:fill-rose-400",
                    isHovered && "scale-105"
                  )}
                >
                  {isPositive ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`}
                </text>

                {/* X-Axis Sector Short Name */}
                <text
                  x={labelX}
                  y={chartHeight - 10}
                  textAnchor="middle"
                  className={cn(
                    "text-[11px] font-medium tracking-tight font-sans transition-colors duration-150",
                    isHovered
                      ? "fill-zinc-900 dark:fill-white font-bold"
                      : "fill-zinc-700 dark:fill-zinc-300"
                  )}
                >
                  {item.short || item.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Footer Meta: Legend & Quick Analysis */}
      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-zinc-100 dark:border-white/[0.04]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-xs" />
            <span className="text-zinc-600 dark:text-zinc-400 font-medium">Advancing Trend</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-rose-600 to-rose-400 shadow-xs" />
            <span className="text-zinc-600 dark:text-zinc-400 font-medium">Declining Trend</span>
          </div>
        </div>

        <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400">
          Refreshed Real-Time
        </span>
      </div>
    </div>
  );
}
