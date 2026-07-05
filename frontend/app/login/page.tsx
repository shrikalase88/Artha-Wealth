"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Lock, ArrowRight, Activity, TrendingUp, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen bg-[#0b0f19] text-slate-100">
      {/* Back button */}
      <Link href="/" className="absolute top-6 left-6 z-50 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      {/* Split screen Left Banner */}
      <div className="hidden lg:flex w-[45%] bg-slate-950 border-r border-white/5 flex-col justify-between p-12 relative overflow-hidden">
        {/* Radial glow background */}
        <div className="absolute top-[20%] left-[-10%] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15)_0%,transparent_70%)] pointer-events-none" />

        <div className="flex items-center gap-2 z-10">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-emerald-500 p-0.5 shadow-lg">
            <span className="text-base font-bold text-white">A</span>
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Artha <span className="text-blue-500 font-medium text-xs tracking-wider uppercase ml-1">Wealth</span>
          </span>
        </div>

        <div className="space-y-6 z-10">
          <h2 className="text-4xl font-extrabold text-white leading-tight">
            Analyze your portfolios <br />
            with <span className="text-blue-400">precision</span>.
          </h2>
          <p className="text-slate-400 font-light leading-relaxed">
            Log in to manage your uploaded statements, track index moves in real time, and explore top performing funds with direct AMFI code syncing.
          </p>

          {/* Sparkline element */}
          <div className="rounded-xl border border-white/5 bg-slate-900/30 p-4 backdrop-blur-sm space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-blue-400" />
                Indian Stock Market Index
              </span>
              <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" /> +1.25%
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-lg font-bold text-white">NIFTY 50</span>
              <span className="text-sm font-mono text-slate-300">24,310.85</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 z-10 flex items-center gap-2">
          <Lock className="h-3.5 w-3.5" />
          Secure Supabase RLS row-level encryption.
        </div>
      </div>

      {/* Right side form */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        {/* Glow bubble for mobile */}
        <div className="absolute top-[10%] right-[10%] h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1)_0%,transparent_70%)] pointer-events-none lg:hidden" />

        <Card className="w-full max-w-md border-white/5 bg-slate-900/40 backdrop-blur-md glass-card py-6 px-4">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
              Sign In
            </CardTitle>
            <CardDescription className="text-slate-400 font-light">
              Enter your credentials to enter your finance dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-blue-500"
                />
              </div>
              <Button type="submit" className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white border-none shadow-md shadow-blue-500/25 mt-4 transition-all duration-300" disabled={loading}>
                {loading ? "Signing in..." : "Sign In to Dashboard"}
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-400 font-light">
              Don&apos;t have an account yet?{" "}
              <Link href="/signup" className="font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-4 decoration-blue-500/40 hover:decoration-blue-400 transition-colors">
                Create Free Account
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
