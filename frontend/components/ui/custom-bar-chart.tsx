"use client";

import React, { useState } from "react";

interface CustomBarChartProps {
  data: Array<{
    Category: string;
    "Invested Capital": number;
    "Current Value": number;
  }>;
}

export function CustomBarChart({ data }: CustomBarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredBar, setHoveredBar] = useState<"invested" | "current" | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  if (!data || data.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-xs text-slate-500 font-light">
        No asset data available to plot chart.
      </div>
    );
  }

  // Find max value to scale the chart
  const maxVal = Math.max(
    ...data.flatMap((d) => [d["Invested Capital"], d["Current Value"]]),
    10000 // avoid division by zero
  );

  // Pad the max value for rendering margins
  const yMax = Math.ceil(maxVal * 1.15);

  const chartHeight = 220;
  const chartWidth = 500;
  
  // Larger paddingLeft to prevent currency overflow
  const paddingLeft = 75;
  const paddingRight = 20;
  const paddingTop = 15;
  const paddingBottom = 30;

  const graphWidth = chartWidth - paddingLeft - paddingRight;
  const graphHeight = chartHeight - paddingTop - paddingBottom;

  // Generate Y-axis grid lines (5 ticks)
  const yTicks = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax];

  const handleMouseMove = (e: React.MouseEvent, index: number, type: "invested" | "current") => {
    const rect = e.currentTarget.getBoundingClientRect();
    const container = e.currentTarget.closest(".chart-container");
    if (container) {
      const containerRect = container.getBoundingClientRect();
      setTooltipPos({
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top - 48,
      });
    }
    setHoveredIndex(index);
    setHoveredBar(type);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setHoveredBar(null);
  };

  // Human-readable compact format for values on Y-axis
  const formatYAxisLabel = (value: number) => {
    if (value === 0) return "₹0";
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
    return `₹${value}`;
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between chart-container">
      {/* Legend */}
      <div className="flex justify-end items-center gap-5 mb-3 text-[11px] font-medium">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-gradient-to-b from-slate-400 to-slate-600 border border-slate-500/25 shadow" />
          <span className="text-slate-400">Invested Capital</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-gradient-to-b from-blue-400 to-blue-600 border border-blue-500/25 shadow" />
          <span className="text-slate-400">Current Value</span>
        </div>
      </div>

      <div className="relative flex-1">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full select-none overflow-visible">
          {/* Gradients defs */}
          <defs>
            <linearGradient id="barInvested" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
            <linearGradient id="barCurrent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
            <linearGradient id="barCurrentGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y-axis Labels */}
          {yTicks.map((tick, i) => {
            const y = chartHeight - paddingBottom - (tick / yMax) * graphHeight;
            return (
              <g key={i} className="opacity-70">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  fill="#94a3b8"
                  fontSize="10"
                  textAnchor="end"
                  className="font-light tracking-wide font-sans"
                >
                  {formatYAxisLabel(tick)}
                </text>
              </g>
            );
          })}

          {/* X Axis Line */}
          <line
            x1={paddingLeft}
            y1={chartHeight - paddingBottom}
            x2={chartWidth - paddingRight}
            y2={chartHeight - paddingBottom}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />

          {/* Bars */}
          {data.map((item, idx) => {
            const numCategories = data.length;
            const sectionWidth = graphWidth / numCategories;
            const xOffset = paddingLeft + idx * sectionWidth;

            // Bar dimensions
            const barWidth = Math.max(14, sectionWidth * 0.28);
            const gap = 5;

            const investedVal = item["Invested Capital"];
            const currentVal = item["Current Value"];

            const investedHeight = (investedVal / yMax) * graphHeight;
            const currentHeight = (currentVal / yMax) * graphHeight;

            // Positioning
            const investedX = xOffset + (sectionWidth - barWidth * 2 - gap) / 2;
            const currentX = investedX + barWidth + gap;

            const investedY = chartHeight - paddingBottom - investedHeight;
            const currentY = chartHeight - paddingBottom - currentHeight;

            return (
              <g key={idx}>
                {/* Invested Capital Bar */}
                <rect
                  x={investedX}
                  y={investedY}
                  width={barWidth}
                  height={Math.max(1, investedHeight)}
                  fill="url(#barInvested)"
                  rx="2"
                  className="cursor-pointer transition-all duration-300"
                  opacity={hoveredIndex === idx && hoveredBar !== "invested" ? 0.4 : 0.95}
                  onMouseMove={(e) => handleMouseMove(e, idx, "invested")}
                  onMouseLeave={handleMouseLeave}
                />

                {/* Current Value Bar */}
                <rect
                  x={currentX}
                  y={currentY}
                  width={barWidth}
                  height={Math.max(1, currentHeight)}
                  fill="url(#barCurrent)"
                  rx="2"
                  className="cursor-pointer transition-all duration-300"
                  opacity={hoveredIndex === idx && hoveredBar !== "current" ? 0.4 : 0.95}
                  onMouseMove={(e) => handleMouseMove(e, idx, "current")}
                  onMouseLeave={handleMouseLeave}
                />

                {/* Hover Glow Highlight */}
                {hoveredIndex === idx && (
                  <rect
                    x={xOffset + 4}
                    y={paddingTop}
                    width={sectionWidth - 8}
                    height={graphHeight}
                    fill="rgba(59, 130, 246, 0.03)"
                    stroke="rgba(59, 130, 246, 0.1)"
                    strokeDasharray="2 2"
                    className="pointer-events-none"
                    rx="4"
                  />
                )}

                {/* X-axis label */}
                <text
                  x={xOffset + sectionWidth / 2}
                  y={chartHeight - 10}
                  fill="#cbd5e1"
                  fontSize="10"
                  textAnchor="middle"
                  className="font-medium tracking-wide font-sans"
                >
                  {item.Category}
                </text>
              </g>
            );
          })}
        </svg>

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
            <div className="glass-panel text-[11px] font-medium text-white px-3 py-1.5 rounded-lg shadow-xl border border-white/10 whitespace-nowrap bg-slate-900/90">
              <span className="text-slate-400 block mb-0.5 text-[10px] font-semibold tracking-wider uppercase">
                {data[hoveredIndex].Category}
              </span>
              <span className="font-semibold text-white">
                {hoveredBar === "invested" ? "Invested: " : "Current Value: "}
                ₹
                {Math.round(
                  hoveredBar === "invested"
                    ? data[hoveredIndex]["Invested Capital"]
                    : data[hoveredIndex]["Current Value"]
                ).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
