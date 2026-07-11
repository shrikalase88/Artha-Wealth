"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Info, ShieldCheck, Cpu, Heart, Code } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-10 text-slate-100 pb-24">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Info className="h-8 w-8 text-blue-400" /> About Artha Wealth
          </h1>
          <p className="mt-1.5 text-sm text-slate-300 font-light max-w-2xl leading-relaxed">
            Discover the technology and vision behind your proactive wealth intelligence cockpit.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Mission Card */}
          <Card className="border-white/5 bg-slate-900/40 backdrop-blur-md glass-card py-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-400" /> Our Mission
              </CardTitle>
              <CardDescription className="text-slate-300 text-xs font-light">
                Empowering investors with crystal clear financial clarity
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-200 font-light leading-relaxed space-y-3">
              <p>
                Artha Wealth was founded on a simple principle: **your financial data should work for you, not against you.**
              </p>
              <p>
                By consolidating complex brokerage accounts, mutual fund statements, and direct stock holdings into a single dashboard, we remove the friction of tracking wealth. We focus on direct mutual plan defaults and real-time live market value synchronization.
              </p>
            </CardContent>
          </Card>

          {/* Privacy & Compliance */}
          <Card className="border-white/5 bg-slate-900/40 backdrop-blur-md glass-card py-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" /> Secure & Compliant
              </CardTitle>
              <CardDescription className="text-slate-300 text-xs font-light">
                Privacy-first architecture built to protect your data
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-200 font-light leading-relaxed space-y-3">
              <p>
                We adhere strictly to W3C security compliances, restricting cross-origin requests to trusted secure gateways (CORS/CSRF protection) and parsing statement records cleanly.
              </p>
              <p>
                Your financial holdings data belongs exclusively to you. No raw statements are sold, and credentials are kept securely isolated.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* The Tech Stack */}
        <Card className="border-white/5 bg-slate-900/40 backdrop-blur-md glass-card py-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu className="h-5 w-5 text-violet-400" /> Smart Engineering Stack
            </CardTitle>
            <CardDescription className="text-slate-300 text-xs font-light">
              High performance technologies driving sub-100ms updates
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Frontend Engine</h4>
              <p className="text-xs text-slate-300 font-light leading-relaxed">
                Next.js 16 (Turbopack) with custom dynamic segmented controls and liquid glass animations.
              </p>
            </div>
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Backend Gateway</h4>
              <p className="text-xs text-slate-300 font-light leading-relaxed">
                FastAPI framework running Stale-While-Revalidate (SWR) cache handlers on top-tier Python 3.12.
              </p>
            </div>
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Financial Resolvers</h4>
              <p className="text-xs text-slate-300 font-light leading-relaxed">
                Parallel-processed thread integrations mapping holdings to yfinance stock tickers and AMFI scheme NAVs.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Web 4.0 Note */}
        <div className="rounded-xl border border-blue-500/10 bg-blue-500/5 p-4 flex gap-3 items-start glass-panel">
          <Code className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Autonomous Web 4.0 Paradigm</h4>
            <p className="text-xs text-slate-300 font-light leading-relaxed">
              Artha Wealth acts proactively. Instead of forcing manual refreshes, the cockpit auto-detects stale market valuations, aligns scheme plans, and recommends portfolio rebalancing strategies autonomously.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
