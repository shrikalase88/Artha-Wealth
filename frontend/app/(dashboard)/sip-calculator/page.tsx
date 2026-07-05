"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calculator, TrendingUp, Coins, Calendar, ArrowUpRight } from "lucide-react";

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
    <div className="p-4 sm:p-6 lg:p-10 text-slate-100 pb-24">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Calculator className="h-8 w-8 text-emerald-400" /> Investment Growth Engine
          </h1>
          <p className="mt-1 text-sm text-slate-200 font-light max-w-2xl leading-relaxed">
            Plan your wealth building journey using our systematic investment plan growth calculator. Simulate compounding returns over custom horizons.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Calculator Sliders */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-white/10 bg-slate-900/40 backdrop-blur-2xl saturate-150 py-3 shadow-2xl shadow-black/40">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Coins className="h-5 w-5 text-emerald-400" /> Slider Controls
                </CardTitle>
                <CardDescription className="text-slate-300 text-xs font-light">
                  Adjust metrics to recalculate maturity values in real-time
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Sliders */}
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-200 font-medium">Monthly Contribution</span>
                    <span className="font-extrabold text-emerald-400 text-base font-mono">
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
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium font-mono">
                    <span>₹500</span>
                    <span>₹1,00,000</span>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-200 font-medium">Expected Growth Rate (p.a.)</span>
                    <span className="font-extrabold text-emerald-400 text-base font-mono">
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
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium font-mono">
                    <span>1%</span>
                    <span>30%</span>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-200 font-medium">Investment Term</span>
                    <span className="font-extrabold text-emerald-400 text-base font-mono">
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
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium font-mono">
                    <span>1 Year</span>
                    <span>40 Years</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Factoid Info Card */}
            <Card className="border-white/10 bg-slate-900/40 backdrop-blur-2xl py-2">
              <CardContent className="p-4 flex gap-4 items-start text-slate-200 text-xs leading-relaxed font-light font-medium">
                <TrendingUp className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white mb-0.5 text-sm">The Compounding Edge</h4>
                  By investing <span className="font-bold text-emerald-400">₹{sipMonthly.toLocaleString("en-IN")}</span> monthly for <span className="font-bold text-white">{sipYears} years</span>, compounding generates <span className="font-bold text-emerald-400">₹{currentResult.gained.toLocaleString("en-IN")}</span> in pure gains. Consistently re-investing dividends maximizes this wealth multiplier.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Outcomes & Amortization */}
          <div className="lg:col-span-7 space-y-6">
            {/* Rupee Valuation Tiles - always 3 across */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <Card className="border-white/10 bg-slate-900/40 backdrop-blur-2xl py-3 text-center">
                <CardContent className="p-4">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Invested Amount</p>
                  <p className="text-lg font-black text-white font-mono mt-1.5">
                    ₹{currentResult.invested.toLocaleString("en-IN")}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-slate-900/40 backdrop-blur-2xl py-3 text-center">
                <CardContent className="p-4">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Estimated Growth</p>
                  <p className="text-lg font-black text-emerald-400 font-mono mt-1.5">
                    +₹{currentResult.gained.toLocaleString("en-IN")}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-slate-900/40 backdrop-blur-2xl py-3 text-center ring-1 ring-emerald-500/20 shadow-emerald-500/5 shadow-lg">
                <CardContent className="p-4">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Maturity Wealth</p>
                  <p className="text-xl font-black text-white font-mono mt-1">
                    ₹{currentResult.maturity.toLocaleString("en-IN")}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Projection Schedule Table */}
            <Card className="border-white/10 bg-slate-900/40 backdrop-blur-2xl py-3 shadow-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-emerald-400" /> Year-by-Year Growth Schedule
                </CardTitle>
                <CardDescription className="text-slate-300 text-xs font-light">
                  A detailed view of capital growth and interest compounding over time
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 px-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400">
                        <th className="py-2.5 font-bold uppercase tracking-wider">Year</th>
                        <th className="py-2.5 font-bold uppercase tracking-wider text-right">Invested Value</th>
                        <th className="py-2.5 font-bold uppercase tracking-wider text-right">Wealth Gained</th>
                        <th className="py-2.5 font-bold uppercase tracking-wider text-right">Maturity Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-slate-200">
                      {projections.map((row) => (
                        <tr key={row.year} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 font-bold text-white flex items-center gap-1">
                            Year {row.year} <ArrowUpRight className="h-3 w-3 text-slate-500" />
                          </td>
                          <td className="py-3 text-right">₹{row.invested.toLocaleString("en-IN")}</td>
                          <td className="py-3 text-right text-emerald-400">+₹{row.gained.toLocaleString("en-IN")}</td>
                          <td className="py-3 text-right font-bold text-white">₹{row.maturity.toLocaleString("en-IN")}</td>
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
