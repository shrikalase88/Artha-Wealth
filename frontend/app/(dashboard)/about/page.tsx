"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, Heart, Sparkles, Terminal } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 text-foreground font-sans select-none">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Sparkles className="h-6 w-6 stroke-[1.8]" />
            </div>
            <span>About Artha Wealth</span>
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Institutional-grade financial intelligence, global market analytics, and systematic wealth architecture.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Mission Card */}
          <Card className="border-border bg-card backdrop-blur-xl rounded-2xl shadow-xs dark:shadow-xl">
            <CardHeader className="p-5 pb-3 border-b border-border/80">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500 stroke-[1.8]" />
                <span>Our Mission</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Empowering investors with crystal clear financial clarity
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-3">
              <p>
                Artha Wealth was founded on a simple principle: your financial intelligence should be transparent, instantaneous, and delightfully crafted.
              </p>
              <p>
                By consolidating global equity markets, direct mutual funds, foreign exchange cross-rates, and systematic compounding simulation into a single high-performance cockpit, we eliminate noise and provide actionable market visibility.
              </p>
            </CardContent>
          </Card>

          {/* Privacy & Compliance */}
          <Card className="border-border bg-card backdrop-blur-xl rounded-2xl shadow-xs dark:shadow-xl">
            <CardHeader className="p-5 pb-3 border-b border-border/80">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500 stroke-[1.8]" />
                <span>Privacy & Resilience</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Client-first architecture built to protect your sovereignty
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-3">
              <p>
                We adhere strictly to secure web standards, restricting cross-origin requests to trusted secure gateways with zero tracking telemetry.
              </p>
              <p>
                Your financial inquiries belong exclusively to you. No personal financial data is retained or monetized, and all computations run client-side with maximum efficiency.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Engineering Philosophy Banner */}
        <div className="p-5 sm:p-6 rounded-2xl bg-muted/60 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
              <Terminal className="h-5 w-5 stroke-[1.8]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Zero Latency Global Feeds</p>
              <p className="text-xs text-muted-foreground mt-0.5">Built on Next.js 16 with native 120Hz display optimization.</p>
            </div>
          </div>
          <span className="text-xs font-mono text-muted-foreground px-3 py-1 rounded-lg bg-card border border-border self-start sm:self-auto">
            v2.1 Precision Engine
          </span>
        </div>
      </div>
    </div>
  );
}
