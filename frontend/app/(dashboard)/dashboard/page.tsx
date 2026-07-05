import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Shield,
  BarChart3,
  ArrowRight,
  Lock,
} from "lucide-react";
import { DashboardView } from "./dashboard-view";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <PublicDashboard />;
  }

  const [portfoliosResult, assetsResult] = await Promise.all([
    supabase
      .from("portfolios")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("assets")
      .select("*")
      .eq("user_id", user.id)
      .order("name"),
  ]);

  const portfolios = portfoliosResult.data;
  const assets = assetsResult.data;

  return (
    <DashboardView
      user={user}
      portfolios={portfolios ?? []}
      assets={assets ?? []}
    />
  );
}

/* ---------- Public landing ---------- */

function PublicDashboard() {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex items-center justify-center p-4">
      {/* Glow effect */}
      <div className="absolute top-[20%] left-[20%] h-[350px] w-[350px] rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15)_0%,transparent_70%)] pointer-events-none" />

      <div className="mx-auto max-w-5xl px-6 py-16 text-center space-y-12">
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
            Track your <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">portfolio</span> in real time
          </h1>
          <p className="mx-auto max-w-xl text-slate-400 font-light leading-relaxed">
            Upload your CAS or brokerage statement PDF. Get instant P&L metrics, asset allocation breakdowns, and visual investment charts.
          </p>
          <div className="pt-4 flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-500 border-none shadow-md shadow-blue-500/20 hover:from-blue-500 hover:to-blue-400">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="border-white/10 hover:bg-white/5 hover:text-white">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Upload,
              title: "PDF Auto-Extraction",
              desc: "Drop your RTA statement PDF. We extract every holding, NAV, and unit balance automatically.",
            },
            {
              icon: BarChart3,
              title: "Portfolio Analytics",
              desc: "Visual charts representing asset allocations and compounding growth progression.",
            },
            {
              icon: Shield,
              title: "Secure Encryption",
              desc: "Your data is secured using Supabase RLS row-level encryption guidelines.",
            },
          ].map((f) => (
            <Card key={f.title} className="border-white/5 bg-slate-900/30 glass-card">
              <CardContent className="flex flex-col items-start gap-4 p-6 text-left">
                <div className="rounded-xl bg-blue-500/10 p-3">
                  <f.icon className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white">{f.title}</h3>
                <p className="text-sm text-slate-400 font-light leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-white/5 bg-slate-900/20 glass-card max-w-xl mx-auto">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="rounded-full bg-slate-950/60 p-4 border border-white/5">
              <Lock className="h-8 w-8 text-slate-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                Sign in to see your portfolio
              </h3>
              <p className="mt-1 text-sm text-slate-400 font-light leading-relaxed">
                Upload statements, track P&L values, and check index details.
              </p>
            </div>
            <Link href="/signup">
              <Button className="mt-2 bg-blue-600 hover:bg-blue-500">
                Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
