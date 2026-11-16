"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Info, ShieldCheck, Cpu, Heart, Code, Sparkles, Terminal } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 text-zinc-100 font-sans select-none">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Sparkles className="h-6 w-6 stroke-[1.8]" />
            </div>
            <span>About Artha Wealth</span>
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Institutional-grade financial intelligence, global market analytics, and systematic wealth architecture.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Mission Card */}
          <Card className="border-white/[0.08] bg-zinc-900/60 backdrop-blur-xl rounded-2xl shadow-xl">
            <CardHeader className="p-5 pb-3 border-b border-white/[0.06]">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-400 stroke-[1.8]" />
                <span>Our Mission</span>
              </CardTitle>
              <CardDescription className="text-zinc-400 text-xs">
                Empowering investors with crystal clear financial clarity
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 text-xs sm:text-sm text-zinc-300 leading-relaxed space-y-3">
              <p>
                Artha Wealth was founded on a simple principle: your financial intelligence should be transparent, instantaneous, and delightfully crafted.
              </p>
              <p>
                By consolidating global equity markets, direct mutual funds, foreign exchange cross-rates, and systematic compounding simulation into a single high-performance cockpit, we eliminate noise and provide actionable market visibility.
              </p>
            </CardContent>
          </Card>

          {/* Privacy & Compliance */}
          <Card className="border-white/[0.08] bg-zinc-900/60 backdrop-blur-xl rounded-2xl shadow-xl">
            <CardHeader className="p-5 pb-3 border-b border-white/[0.06]">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400 stroke-[1.8]" />
                <span>Privacy & Resilience</span>
              </CardTitle>
              <CardDescription className="text-zinc-400 text-xs">
                Client-first architecture built to protect your sovereignty
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 text-xs sm:text-sm text-zinc-300 leading-relaxed space-y-3">
              <p>
                We adhere strictly to secure web standards, restricting cross-origin requests to trusted secure gateways (CORS/CSRF protection) with zero tracking telemetry.
              </p>
              <p>
                Your financial inquiries belong exclusively to you. No personal financial data is retained or monetized, and all computations run client-side with maximum efficiency.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* The Tech Stack */}
        <Card className="border-white/[0.08] bg-zinc-900/60 backdrop-blur-xl rounded-2xl shadow-xl">
          <CardHeader className="p-5 pb-3 border-b border-white/[0.06]">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <Cpu className="h-4 w-4 text-blue-400 stroke-[1.8]" />
              <span>Engineering Architecture</span>
            </CardTitle>
            <CardDescription className="text-zinc-400 text-xs">
              Modern frontend and distributed financial feed pipeline
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 grid gap-6 sm:grid-cols-3">
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Frontend Cockpit</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Next.js 16 with React 19, Tailwind CSS v4, hardware-composited 120Hz micro-interactions, and Apple HIG ergonomics.
              </p>
            </div>
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Data Ingestion</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Stale-While-Revalidate caching layer with instant offline fallback ensuring 100% uptime and resilience.
              </p>
            </div>
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Quant Engine</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Parallel ticker aggregation, AMFI scheme NAV resolution, and real-time cross-currency foreign exchange matrix.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Autonomous Paradigm */}
        <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/60 backdrop-blur-xl p-5 flex gap-3.5 items-start shadow-xl">
          <Terminal className="h-5 w-5 text-blue-400 shrink-0 mt-0.5 stroke-[1.8]" />
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Proactive Wealth Intelligence</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Artha Wealth delivers continuous real-time market synchronization across India, US, Europe, and Asia, adapting to your locale and device seamlessly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
