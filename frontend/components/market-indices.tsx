"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type Index = {
  name: string;
  short: string;
  price: number;
  change: number | null;
  change_pct: number | null;
};

export function MarketIndices() {
  const [indices, setIndices] = useState<Index[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchIndices() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/v1/market/indices`,
        );
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setIndices(data);
        setError(false);
      } catch {
        setError(true);
      }
    }
    fetchIndices();
    const interval = setInterval(fetchIndices, 30000);
    return () => clearInterval(interval);
  }, []);

  if (error || indices.length === 0) return null;

  return (
    <div className="flex items-center gap-6 overflow-x-auto py-2">
      {indices.map((idx) => {
        const change = idx.change ?? 0;
        const cls = change > 0 ? "text-green-500" : change < 0 ? "text-red-500" : "text-muted-foreground";
        const Icon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;
        return (
          <div key={idx.short} className="flex shrink-0 items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              {idx.short}
            </span>
            <span className="text-sm font-semibold tabular-nums">
              {idx.price?.toLocaleString("en-IN") ?? "—"}
            </span>
            <span className={`flex items-center gap-0.5 text-sm tabular-nums ${cls}`}>
              <Icon className="h-3.5 w-3.5" />
              {change > 0 ? "+" : ""}
              {change?.toFixed(2) ?? "0.00"}
              {idx.change_pct ? ` (${idx.change_pct >= 0 ? "+" : ""}${idx.change_pct.toFixed(2)}%)` : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}
