"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

export interface DonutDataItem {
  name: string;
  value: number;
  change_pct?: number;
  subtext?: string;
}

interface CustomDonutChartProps {
  data: DonutDataItem[];
  currencySymbol?: string;
  className?: string;
}

const COLORS = [
  { start: "#3b82f6", end: "#1d4ed8" }, // Sapphire Blue
  { start: "#10b981", end: "#047857" }, // Emerald Green
  { start: "#06b6d4", end: "#0e7490" }, // Cyan
  { start: "#8b5cf6", end: "#6d28d9" }, // Electric Violet
  { start: "#f59e0b", end: "#b45309" }, // Amber Gold
];

// Converts polar coordinates to cartesian coordinates for SVG paths
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

// Generates smooth SVG arc paths with precise angle sweep and gap handling
function describeArc(
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  gapAngle = 2
) {
  const totalAngle = endAngle - startAngle;
  // Apply gap only if slice is smaller than full 360 circle
  const effectiveStart = totalAngle >= 359.9 ? startAngle : startAngle + gapAngle / 2;
  const effectiveEnd = totalAngle >= 359.9 ? endAngle : Math.max(effectiveStart, endAngle - gapAngle / 2);
  const angleDiff = effectiveEnd - effectiveStart;

  if (angleDiff <= 0) return "";

  const start = polarToCartesian(x, y, radius, effectiveStart);
  const end = polarToCartesian(x, y, radius, effectiveEnd);
  const largeArcFlag = angleDiff > 180 ? "1" : "0";

  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 1, end.x, end.y
  ].join(" ");
}

export function CustomDonutChart({ data, currencySymbol = "₹", className }: CustomDonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const totalValue = useMemo(
    () => data.reduce((sum, item) => sum + (Number(item.value) || 0), 0),
    [data]
  );

  const slices = useMemo(() => {
    let currentAngle = 0;
    return data.map((item, i) => {
      const val = Number(item.value) || 0;
      const sliceAngle = totalValue === 0 ? 0 : (val / totalValue) * 360;
      const endAngle = currentAngle + sliceAngle;
      const percentage = totalValue === 0 ? 0 : (val / totalValue) * 100;

      const slice = {
        ...item,
        value: val,
        percentage,
        startAngle: currentAngle,
        endAngle,
        color: COLORS[i % COLORS.length],
      };

      currentAngle = endAngle;
      return slice;
    });
  }, [data, totalValue]);

  const size = 180;
  const strokeWidth = 26;
  const center = size / 2;
  const radius = center - strokeWidth / 2 - 4;

  const handleMouseMove = (e: React.MouseEvent, index: number) => {
    const container = e.currentTarget.closest(".donut-container");
    if (container) {
      const containerRect = container.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - containerRect.left,
        y: e.clientY - containerRect.top - 45,
      });
    }
    setHoveredIndex(index);
  };

  const formatCenterTotal = (val: number) => {
    if (currencySymbol === "₹") {
      if (val >= 10000000) return `${currencySymbol}${(val / 10000000).toFixed(2)}Cr`;
      if (val >= 100000) return `${currencySymbol}${(val / 100000).toFixed(2)}L`;
    }
    if (val >= 1000000) return `${currencySymbol}${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `${currencySymbol}${(val / 1000).toFixed(1)}k`;
    return `${currencySymbol}${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  if (!data || data.length === 0 || totalValue === 0) {
    return (
      <div className={cn("flex h-full w-full items-center justify-center text-xs text-slate-400 font-light", className)}>
        No market mover data available.
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full flex flex-col items-center justify-center donut-container py-2", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
          <defs>
            {slices.map((slice, i) => (
              <linearGradient key={`grad-${i}`} id={`donut-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={slice.color.start} />
                <stop offset="100%" stopColor={slice.color.end} />
              </linearGradient>
            ))}
            <filter id="donut-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Ring Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth={strokeWidth}
          />

          {/* Render Slices */}
          {slices.map((slice, i) => {
            const isHovered = hoveredIndex === i;
            const isAnyHovered = hoveredIndex !== null;
            const opacity = isAnyHovered ? (isHovered ? 1 : 0.35) : 0.95;
            const currentStrokeWidth = isHovered ? strokeWidth + 6 : strokeWidth;

            // Full circle fallback if 100% single slice
            if (slice.endAngle - slice.startAngle >= 359.9) {
              return (
                <circle
                  key={i}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={`url(#donut-grad-${i})`}
                  strokeWidth={currentStrokeWidth}
                  className="transition-all duration-300 cursor-pointer"
                  opacity={opacity}
                  onMouseMove={(e) => handleMouseMove(e, i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  filter={isHovered ? "url(#donut-glow)" : undefined}
                />
              );
            }

            const pathData = describeArc(center, center, radius, slice.startAngle, slice.endAngle, slices.length > 1 ? 2.5 : 0);
            if (!pathData) return null;

            return (
              <path
                key={i}
                d={pathData}
                fill="none"
                stroke={`url(#donut-grad-${i})`}
                strokeWidth={currentStrokeWidth}
                strokeLinecap="round"
                className="transition-all duration-300 cursor-pointer"
                opacity={opacity}
                onMouseMove={(e) => handleMouseMove(e, i)}
                onMouseLeave={() => setHoveredIndex(null)}
                filter={isHovered ? "url(#donut-glow)" : undefined}
              />
            );
          })}
        </svg>

        {/* Donut Center Total Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Top 5 Weight</span>
          <span className="text-sm font-extrabold text-white tracking-tight mt-0.5 font-mono">
            {formatCenterTotal(totalValue)}
          </span>
        </div>
      </div>

      {/* Legend with Splitting Percentages & Price Change */}
      <div className="mt-4 w-full flex flex-wrap justify-center gap-x-3 gap-y-1.5 text-[10px] font-medium max-w-full px-2">
        {slices.map((slice, i) => {
          const isHovered = hoveredIndex === i;
          const hasChange = slice.change_pct !== undefined;
          const isPositive = (slice.change_pct ?? 0) >= 0;

          return (
            <div
              key={i}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all duration-200 cursor-pointer select-none",
                isHovered 
                  ? "bg-blue-500/20 border-blue-500/40 text-white shadow-lg shadow-blue-500/10 scale-105" 
                  : "bg-slate-900/60 border-slate-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-slate-800/80"
              )}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                style={{ background: `linear-gradient(to bottom right, ${slice.color.start}, ${slice.color.end})` }}
              />
              <span className="font-semibold text-zinc-200">{slice.name}</span>
              <span className="font-mono text-zinc-300 font-bold">
                {slice.percentage.toFixed(1)}%
              </span>
              {hasChange && (
                <span className={cn("font-mono text-[9px] font-bold", isPositive ? "text-emerald-400" : "text-red-400")}>
                  {isPositive ? "+" : ""}{slice.change_pct?.toFixed(1)}%
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredIndex !== null && (
        <div
          className="absolute z-30 pointer-events-none transition-all duration-100 ease-out"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="text-[11px] font-medium text-white px-3.5 py-2.5 rounded-xl shadow-2xl border border-white/10 bg-[#090e1d]/95 backdrop-blur-xl flex flex-col gap-1 min-w-[140px]">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1">
              <span className="font-bold text-white tracking-wide">
                {slices[hoveredIndex].name}
              </span>
              <span className="font-mono text-xs font-bold text-blue-400">
                {slices[hoveredIndex].percentage.toFixed(1)}%
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-0.5">
              <span className="text-[10px] text-zinc-400">Price:</span>
              <span className="font-mono font-bold text-white">
                {currencySymbol}{slices[hoveredIndex].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {slices[hoveredIndex].change_pct !== undefined && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-zinc-400">Today:</span>
                <span className={cn("font-mono text-[10px] font-bold", (slices[hoveredIndex].change_pct ?? 0) >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {(slices[hoveredIndex].change_pct ?? 0) >= 0 ? "+" : ""}
                  {slices[hoveredIndex].change_pct?.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
