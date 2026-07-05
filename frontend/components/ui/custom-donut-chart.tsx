"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface DonutDataItem {
  name: string;
  value: number;
}

interface CustomDonutChartProps {
  data: DonutDataItem[];
  className?: string;
}

const COLORS = [
  { start: "#3b82f6", end: "#2563eb" }, // Blue
  { start: "#10b981", end: "#059669" }, // Emerald
  { start: "#8b5cf6", end: "#7c3aed" }, // Violet
  { start: "#f59e0b", end: "#d97706" }, // Amber
  { start: "#ec4899", end: "#db2777" }, // Pink
];

// Helper to convert polar coordinates to cartesian for SVG path
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  
  // A rx ry x-axis-rotation large-arc-flag sweep-flag x y
  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ");
}

export function CustomDonutChart({ data, className }: CustomDonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const totalValue = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);

  const slices = useMemo(() => {
    let currentAngle = 0;
    return data.map((item, i) => {
      // If total is 0, give equal slices or return empty. But usually total > 0.
      const sliceAngle = totalValue === 0 ? 0 : (item.value / totalValue) * 360;
      
      // If a slice is exactly 360, SVG arcs fail, so we cap at 359.99
      const endAngle = currentAngle + (sliceAngle === 360 ? 359.99 : sliceAngle);
      
      const slice = {
        ...item,
        startAngle: currentAngle,
        endAngle,
        color: COLORS[i % COLORS.length],
      };
      
      currentAngle = endAngle;
      return slice;
    });
  }, [data, totalValue]);

  const size = 200;
  const strokeWidth = 36;
  const center = size / 2;
  const radius = center - strokeWidth; // Padding for stroke

  const handleMouseMove = (e: React.MouseEvent, index: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const container = e.currentTarget.closest(".donut-container");
    if (container) {
      const containerRect = container.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - containerRect.left,
        y: e.clientY - containerRect.top - 40, // offset above cursor
      });
    }
    setHoveredIndex(index);
  };

  if (!data || data.length === 0 || totalValue === 0) {
    return (
      <div className={cn("flex h-full w-full items-center justify-center text-xs text-slate-500 font-light", className)}>
        No allocation data available.
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full flex flex-col items-center justify-center donut-container", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
          <defs>
            {slices.map((slice, i) => (
              <linearGradient key={`grad-${i}`} id={`grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={slice.color.start} />
                <stop offset="100%" stopColor={slice.color.end} />
              </linearGradient>
            ))}
            {/* Glow filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track */}
          <circle 
            cx={center} 
            cy={center} 
            r={radius} 
            fill="none" 
            stroke="rgba(255,255,255,0.03)" 
            strokeWidth={strokeWidth} 
          />

          {/* Slices */}
          {slices.map((slice, i) => {
            // Gap between slices (simulate stroke gap by slightly reducing arc angle)
            // But doing it via path is easier if we just draw normal arcs and rely on stroke-dasharray if we wanted gaps.
            // For now, seamless arcs with slight opacity shifts on hover.
            
            const isHovered = hoveredIndex === i;
            const isAnyHovered = hoveredIndex !== null;
            const opacity = isAnyHovered ? (isHovered ? 1 : 0.4) : 0.9;
            const currentStrokeWidth = isHovered ? strokeWidth + 6 : strokeWidth;

            // If a single slice takes up 100%, draw a circle instead of an arc
            if (slice.endAngle - slice.startAngle >= 359.9) {
              return (
                <circle
                  key={i}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={`url(#grad-${i})`}
                  strokeWidth={currentStrokeWidth}
                  className="transition-all duration-300 cursor-pointer"
                  opacity={opacity}
                  onMouseMove={(e) => handleMouseMove(e, i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  filter={isHovered ? "url(#glow)" : ""}
                />
              );
            }

            const pathData = describeArc(center, center, radius, slice.startAngle, slice.endAngle);

            return (
              <path
                key={i}
                d={pathData}
                fill="none"
                stroke={`url(#grad-${i})`}
                strokeWidth={currentStrokeWidth}
                strokeLinecap="butt"
                className="transition-all duration-300 cursor-pointer"
                opacity={opacity}
                onMouseMove={(e) => handleMouseMove(e, i)}
                onMouseLeave={() => setHoveredIndex(null)}
                filter={isHovered ? "url(#glow)" : ""}
              />
            );
          })}
        </svg>

        {/* Center Label (Total) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total</span>
          <span className="text-sm font-bold text-white tracking-tight mt-0.5">
            ₹{totalValue >= 10000000 ? (totalValue / 10000000).toFixed(2) + 'Cr' : 
               totalValue >= 100000 ? (totalValue / 100000).toFixed(2) + 'L' : 
               totalValue.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 w-full flex flex-wrap justify-center gap-x-4 gap-y-2 text-[10px] text-slate-400 font-medium">
        {slices.map((slice, i) => (
          <div key={i} className="flex items-center gap-1.5 cursor-pointer"
               onMouseEnter={() => setHoveredIndex(i)}
               onMouseLeave={() => setHoveredIndex(null)}>
            <div 
              className="w-2.5 h-2.5 rounded-full shadow-sm"
              style={{ background: `linear-gradient(to bottom, ${slice.color.start}, ${slice.color.end})` }} 
            />
            <span className={hoveredIndex === i ? "text-white" : "text-slate-400"}>
              {slice.name} ({((slice.value / totalValue) * 100).toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>

      {/* Custom HTML Tooltip */}
      {hoveredIndex !== null && (
        <div
          className="absolute z-30 pointer-events-none transition-all duration-100 ease-out"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="glass-panel text-[11px] font-medium text-white px-3 py-1.5 rounded-lg shadow-xl border border-white/10 whitespace-nowrap bg-slate-900/90 backdrop-blur-md">
            <span className="text-slate-400 block mb-0.5 text-[10px] font-semibold tracking-wider uppercase">
              {slices[hoveredIndex].name}
            </span>
            <span className="font-bold text-white">
              ₹{slices[hoveredIndex].value.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
