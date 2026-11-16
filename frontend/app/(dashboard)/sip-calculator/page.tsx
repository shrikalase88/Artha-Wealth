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
    <div className="p-4 sm:p-6 lg:p-8 text-zinc-100 font-sans select-none">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Calculator className="h-6 w-6 stroke-[1.8]" />
            </div>
            <span>Investment Growth Engine</span>
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Plan your wealth building journey using our systematic investment plan growth calculator. Simulate compounding returns over custom horizons.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Calculator Sliders */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-white/[0.08] bg-zinc-900/60 backdrop-blur-xl rounded-2xl shadow-xl">
              <CardHeader className="p-4 sm:p-5 pb-3 border-b border-white/[0.06]">
                <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-blue-400 stroke-[1.8]" />
                  <span>Growth Variables</span>
                </CardTitle>
                <CardDescription className="text-zinc-400 text-xs">
                  Adjust metrics to recalculate maturity values in real-time
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-6">
                {/* Sliders */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-300 font-medium">Monthly Contribution</span>
                    <span className="font-bold text-white text-sm font-mono">
                      ₹{sipMonthly.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="100000"
                    step="500"
                    value={sipMonthly}
                    onChange={(e) => setSipMonthly(Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                    <span>₹500</span>
                    <span>₹1,00,000</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-300 font-medium">Expected Return Rate (p.a.)</span>
                    <span className="font-bold text-emerald-400 text-sm font-mono">
                      {sipReturn}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="0.5"
                    value={sipReturn}
                    onChange={(e) => setSipReturn(Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                    <span>1%</span>
                    <span>30%</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-300 font-medium">Investment Term</span>
                    <span className="font-bold text-white text-sm font-mono">
                      {sipYears} Years
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="40"
                    step="1"
                    value={sipYears}
                    onChange={(e) => setSipYears(Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                    <span>1 Year</span>
                    <span>40 Years</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Factoid Info Card */}
            <Card className="border-white/[0.08] bg-zinc-900/60 backdrop-blur-xl rounded-2xl shadow-xl">
              <CardContent className="p-4 flex gap-3.5 items-start text-zinc-300 text-xs leading-relaxed">
                <TrendingUp className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5 stroke-[1.8]" />
                <div>
                  <h4 className="font-semibold text-white mb-0.5 text-xs">The Compounding Edge</h4>
                  By investing <span className="font-semibold text-emerald-400">₹{sipMonthly.toLocaleString("en-IN")}</span> monthly for <span className="font-semibold text-white">{sipYears} years</span>, compounding generates <span className="font-semibold text-emerald-400">₹{currentResult.gained.toLocaleString("en-IN")}</span> in pure gains.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Outcomes & Amortization */}
          <div className="lg:col-span-7 space-y-6">
            {/* Rupee Valuation Tiles - 3 across */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Card className="border-white/[0.08] bg-zinc-900/60 backdrop-blur-xl rounded-2xl shadow-xl">
                <CardContent className="p-4">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">Invested Amount</p>
                  <p className="text-lg font-bold text-white font-mono mt-1">
                    ₹{currentResult.invested.toLocaleString("en-IN")}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-white/[0.08] bg-zinc-900/60 backdrop-blur-xl rounded-2xl shadow-xl">
                <CardContent className="p-4">
                  <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-semibold">Estimated Growth</p>
                  <p className="text-lg font-bold text-emerald-400 font-mono mt-1">
                    +₹{currentResult.gained.toLocaleString("en-IN")}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-white/[0.12] bg-zinc-900/80 backdrop-blur-xl rounded-2xl shadow-xl">
                <CardContent className="p-4">
                  <p className="text-[10px] text-zinc-300 uppercase tracking-widest font-semibold">Maturity Wealth</p>
                  <p className="text-xl font-bold text-white font-mono mt-1">
                    ₹{currentResult.maturity.toLocaleString("en-IN")}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Projection Schedule Table */}
            <Card className="border-white/[0.08] bg-zinc-900/60 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden">
              <CardHeader className="p-4 sm:p-5 pb-3 border-b border-white/[0.06]">
                <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-400 stroke-[1.8]" />
                  <span>Growth Schedule & Compounding Timeline</span>
                </CardTitle>
                <CardDescription className="text-zinc-400 text-xs">
                  Detailed timeline of capital contribution and compounding growth
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-zinc-400 bg-white/[0.02]">
                        <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-[10px]">Year</th>
                        <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-right text-[10px]">Invested Value</th>
                        <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-right text-[10px]">Wealth Gained</th>
                        <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-right text-[10px]">Maturity Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04] font-mono text-zinc-300">
                      {projections.map((row) => (
                        <tr key={row.year} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4 font-semibold text-white flex items-center gap-1 font-sans">
                            Year {row.year} <ArrowUpRight className="h-3 w-3 text-zinc-500 stroke-[1.8]" />
                          </td>
                          <td className="py-3 px-4 text-right">₹{row.invested.toLocaleString("en-IN")}</td>
                          <td className="py-3 px-4 text-right text-emerald-400 font-medium">+₹{row.gained.toLocaleString("en-IN")}</td>
                          <td className="py-3 px-4 text-right font-bold text-white">₹{row.maturity.toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
