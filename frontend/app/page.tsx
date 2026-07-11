import Link from "next/link";
import { ArrowRight, TrendingUp, Shield, BarChart3, ChevronRight, Activity, PieChart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: BarChart3,
    title: "Portfolio Analytics",
    description: "Real-time P&L tracking, asset class allocation, and consolidated performance charts.",
  },
  {
    icon: TrendingUp,
    title: "Live Markets",
    description: "Real-time feeds of major Indian indices and active stock tickers directly inside your cockpit.",
  },
  {
    icon: Shield,
    title: "PDF Parsing Engine",
    description: "Drop your CAMS/KFintech CAS or demat statement PDF. We extract every asset code automatically.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0b0f19] text-slate-100 selection:bg-blue-500/30">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.25)_0%,rgba(6,182,212,0.08)_40%,transparent_70%)] pointer-events-none filter blur-[80px] animate-glow-1" />
      <div className="absolute top-[20%] right-1/4 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.22)_0%,rgba(20,184,166,0.08)_45%,transparent_70%)] pointer-events-none filter blur-[80px] animate-glow-2" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0b0f19]/60 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-emerald-500 p-0.5 shadow-lg shadow-blue-500/20">
              <span className="text-base font-bold text-white">A</span>
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Artha <span className="text-blue-500 font-medium text-xs tracking-wider uppercase ml-1">Wealth</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/5">
                Sign In
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-blue-500 text-white border-none shadow-md shadow-blue-500/25 hover:from-blue-500 hover:to-blue-400 transition-all duration-300">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Section */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative mx-auto max-w-6xl px-6 pt-24 pb-16 text-center">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-medium text-blue-400 mb-8 glow-card">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Now with CDSL & NSDL Demat Parsing support</span>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl leading-tight bg-gradient-to-b from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Your wealth, <br />
            <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">crystal clear</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-400 font-light leading-relaxed">
            Consolidate your mutual fund and stock portfolio statements in seconds. Get instant P&L analytics, asset allocation charts, and live Indian market feeds.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="h-12 px-8 bg-gradient-to-r from-blue-600 to-blue-500 text-white border-none shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-blue-400 transition-all duration-300">
                Launch Interactive Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Dashboard Mockup Showcase */}
        <section className="mx-auto max-w-5xl px-6 pb-24">
          <div className="relative rounded-2xl border border-white/10 bg-slate-900/30 p-4 backdrop-blur-md shadow-2xl shadow-black/80">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent rounded-2xl pointer-events-none" />
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4 text-xs text-slate-500">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/30" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/30" />
                <span className="w-3 h-3 rounded-full bg-green-500/30" />
              </div>
              <div className="px-4 py-1 rounded bg-[#0b0f19]/80 border border-white/5 text-[10px] tracking-wide font-mono">
                artha-wealth-dashboard.local
              </div>
              <div className="w-12" />
            </div>

            {/* Dashboard Mock Design inside Landing Page */}
            <div className="grid gap-4 md:grid-cols-3 text-left">
              <div className="col-span-2 space-y-4">
                <div className="rounded-xl border border-white/5 bg-slate-950/40 p-5 glass-card">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Net Worth Valuation</p>
                      <h3 className="text-3xl font-extrabold text-white mt-1 tabular-nums">₹18,45,200.75</h3>
                      <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1 font-medium">
                        <TrendingUp className="h-3.5 w-3.5" /> +₹2,45,100 (15.3%) All Time
                      </p>
                    </div>
                    <div className="h-10 w-24 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xs font-semibold text-blue-400 font-mono tracking-wider">
                      LIVE FEED
                    </div>
                  </div>
                  {/* Decorative Simulated Wave Graph */}
                  <div className="h-20 w-full mt-6 flex items-end gap-1.5 opacity-60">
                    {[35, 45, 40, 50, 48, 60, 55, 75, 70, 85, 80, 95, 90, 110, 100].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-2">
                  <div className="rounded-xl border border-white/5 bg-slate-950/40 p-4 glass-card">
                    <p className="text-xs text-slate-500 font-medium">Mutual Funds Allocation</p>
                    <p className="text-xl font-bold mt-1 text-white">72.4%</p>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div className="bg-emerald-400 h-full w-[72%]" />
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-slate-950/40 p-4 glass-card">
                    <p className="text-xs text-slate-500 font-medium">Direct Equity & Stocks</p>
                    <p className="text-xl font-bold mt-1 text-white">27.6%</p>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div className="bg-blue-400 h-full w-[28%]" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/5 bg-slate-950/40 p-5 space-y-4 glass-card">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Live Sharemarket</p>
                <div className="space-y-3">
                  {[
                    { name: "NIFTY 50", price: "24,310.85", change: "+1.25%", up: true },
                    { name: "SENSEX", price: "79,832.40", change: "+1.18%", up: true },
                    { name: "BANK NIFTY", price: "52,405.10", change: "-0.45%", up: false },
                  ].map((idx) => (
                    <div key={idx.name} className="flex justify-between items-center border-b border-white/5 pb-2.5 last:border-0 last:pb-0">
                      <div>
                        <p className="text-xs font-bold text-white">{idx.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{idx.price}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${idx.up ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                        {idx.change}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="bg-[#0b0f19]/80 border border-white/5 rounded-lg p-3 text-center">
                  <p className="text-[11px] text-slate-400 font-light leading-relaxed">
                    Explore fund category returns and calculate SIP growths instantly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="border-white/5 bg-slate-950/20 backdrop-blur-sm shadow-md glass-card">
                <CardContent className="flex flex-col items-start gap-4 p-6">
                  <div className="rounded-xl bg-blue-500/10 p-3">
                    <feature.icon className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{feature.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed font-light">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-500">
        <p>© 2026 Artha Wealth. All rights reserved. RLS protected row security.</p>
      </footer>
    </div>
  );
}
