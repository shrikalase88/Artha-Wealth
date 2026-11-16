"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calculator, TrendingUp, Sliders, Calendar, ArrowUpRight } from "lucide-react";

export default function SipCalculatorPage() {
  const [sipMonthly, setSipMonthly] = useState(5000);
  const [sipReturn, setSipReturn] = useState(12);
  const [sipYears, setSipYears] = useState(10);

  // SIP Growth Math
  const getSipResult = (years = sipYears) => {
    const P = sipMonthly;
    const i = (sipReturn / 100) / 12;
    const n = years * 12;
    const totalInvested = P * n;
    let maturityValue = 0;
    if (i > 0) {
      maturityValue = P * (((Math.pow(1 + i, n) - 1) / i) * (1 + i));
    } else {
      maturityValue = totalInvested;
    }
    const wealthGained = maturityValue - totalInvested;
    return {
      invested: totalInvested,
      maturity: Math.round(maturityValue),
      gained: Math.round(wealthGained)
    };
  };

  const currentResult = getSipResult();

  // Generate Year-by-Year compounding projections
  const projections = [];
  const step = sipYears <= 5 ? 1 : sipYears <= 15 ? 2 : 5;
  for (let y = 1; y <= sipYears; y++) {
    if (y === 1 || y === sipYears || y % step === 0) {
      projections.push({
        year: y,
        ...getSipResult(y)
      });
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 text-foreground font-sans select-none">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Calculator className="h-6 w-6 stroke-[1.8]" />
            </div>
            <span>Investment Growth Engine</span>
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Plan your wealth building journey using our systematic investment plan growth calculator. Simulate compounding returns over custom horizons.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Calculator Sliders */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-border bg-card backdrop-blur-xl rounded-2xl shadow-xs dark:shadow-xl">
              <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/80">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-blue-600 dark:text-blue-400 stroke-[1.8]" />
                  <span>Growth Variables</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Adjust metrics to recalculate maturity values in real-time
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-6">
                {/* Sliders */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium">Monthly Contribution</span>
                    <span className="font-bold text-foreground text-sm font-mono">
                      ₹{sipMonthly.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={500}
                    max={100000}
                    step={500}
                    value={sipMonthly}
                    onChange={(e) => setSipMonthly(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[1000, 2500, 5000, 10000, 25000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setSipMonthly(amt)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border font-mono transition-colors cursor-pointer ${
                          sipMonthly === amt
                            ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/40 font-bold"
                            : "bg-muted/60 text-muted-foreground hover:text-foreground border-border"
                        }`}
                      >
                        ₹{amt.toLocaleString("en-IN")}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium">Expected Annual Return</span>
                    <span className="font-bold text-foreground text-sm font-mono">
                      {sipReturn}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={30}
                    step={0.5}
                    value={sipReturn}
                    onChange={(e) => setSipReturn(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:accent-emerald-500"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[8, 12, 14, 16, 20].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setSipReturn(r)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border font-mono transition-colors cursor-pointer ${
                          sipReturn === r
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 font-bold"
                            : "bg-muted/60 text-muted-foreground hover:text-foreground border-border"
                        }`}
                      >
                        {r}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium">Duration (Years)</span>
                    <span className="font-bold text-foreground text-sm font-mono">
                      {sipYears} {sipYears === 1 ? "Year" : "Years"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={35}
                    step={1}
                    value={sipYears}
                    onChange={(e) => setSipYears(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-600 dark:accent-purple-500"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[3, 5, 10, 15, 20, 25].map((y) => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => setSipYears(y)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border font-mono transition-colors cursor-pointer ${
                          sipYears === y
                            ? "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/40 font-bold"
                            : "bg-muted/60 text-muted-foreground hover:text-foreground border-border"
                        }`}
                      >
                        {y}Y
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Outcomes & Breakdown */}
          <div className="lg:col-span-7 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-2xl bg-card border border-border shadow-xs dark:shadow-lg">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Invested</p>
                <p className="text-xl sm:text-2xl font-mono font-bold text-foreground mt-1">
                  ₹{currentResult.invested.toLocaleString("en-IN")}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">Total principal</p>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border shadow-xs dark:shadow-lg">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Est. Returns</p>
                <p className="text-xl sm:text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  +₹{currentResult.gained.toLocaleString("en-IN")}
                </p>
                <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-1">Compounded wealth</p>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border shadow-xs dark:shadow-lg">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Maturity Value</p>
                <p className="text-xl sm:text-2xl font-mono font-bold text-blue-600 dark:text-blue-400 mt-1">
                  ₹{currentResult.maturity.toLocaleString("en-IN")}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">Corpus after {sipYears}Y</p>
              </div>
            </div>

            {/* Projection Schedule Table */}
            <Card className="border-border bg-card backdrop-blur-xl rounded-2xl shadow-xs dark:shadow-xl overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-border/80 flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400 stroke-[1.8]" />
                  <span>Compounding Roadmap</span>
                </CardTitle>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {sipYears} Year Outlook
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground bg-muted/40 text-[11px] font-semibold">
                      <th className="py-2.5 px-4 text-left">Year</th>
                      <th className="py-2.5 px-4 text-right">Invested</th>
                      <th className="py-2.5 px-4 text-right">Wealth Gained</th>
                      <th className="py-2.5 px-4 text-right">Corpus Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {projections.map((p) => (
                      <tr key={p.year} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-4 text-foreground font-semibold">Year {p.year}</td>
                        <td className="py-2.5 px-4 text-right text-muted-foreground">₹{p.invested.toLocaleString("en-IN")}</td>
                        <td className="py-2.5 px-4 text-right text-emerald-600 dark:text-emerald-400 font-semibold">+₹{p.gained.toLocaleString("en-IN")}</td>
                        <td className="py-2.5 px-4 text-right text-foreground font-bold">₹{p.maturity.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
