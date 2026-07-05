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
import { countries } from "@/lib/countries";
import { ArrowLeft, Lock, Award, PieChart, Sparkles } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, country, city },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created! Welcome to Artha.");
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
        <div className="absolute top-[20%] left-[-10%] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1)_0%,transparent_70%)] pointer-events-none" />

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
            Start tracking <br />
            your portfolios.
          </h2>
          <p className="text-slate-400 font-light leading-relaxed">
            Create your account today. Consolidate CAMS/KFintech CAS and CDSL/NSDL demat reports in one dashboard. Unlock instant asset allocation breakdowns and live fund tracking.
          </p>

          {/* Allocation metric card */}
          <div className="rounded-xl border border-white/5 bg-slate-900/30 p-4 backdrop-blur-sm space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <PieChart className="h-3.5 w-3.5 text-emerald-400" />
                Asset Distribution
              </span>
              <span className="text-blue-400 font-semibold flex items-center gap-0.5">
                <Sparkles className="h-3 w-3" /> Auto Balanced
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-xs text-slate-300 font-mono mb-1">
                  <span>Mutual Funds</span>
                  <span>75%</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full w-[75%]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 z-10 flex items-center gap-2">
          <Lock className="h-3.5 w-3.5" />
          Secure Supabase RLS row-level encryption.
        </div>
      </div>

      {/* Right side form */}
      <div className="flex-1 flex items-center justify-center p-6 relative overflow-y-auto pt-20">
        {/* Glow bubble for mobile */}
        <div className="absolute top-[10%] right-[10%] h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15)_0%,transparent_70%)] pointer-events-none lg:hidden" />

        <Card className="w-full max-w-md border-white/5 bg-slate-900/40 backdrop-blur-md glass-card py-6 px-4 my-8">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
              Create Account
            </CardTitle>
            <CardDescription className="text-slate-400 font-light">
              Join Artha Wealth to track your portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Country</Label>
                  <select
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                    className="flex h-10 w-full rounded-md border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-white shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                  >
                    <option value="" disabled className="bg-slate-950 text-slate-400">Select country</option>
                    {countries.map((c) => (
                      <option key={c} value={c} className="bg-slate-950 text-white">{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">City</Label>
                  <Input
                    id="city"
                    type="text"
                    placeholder="Your city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    className="bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-blue-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-blue-500"
                />
              </div>
              <Button type="submit" className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white border-none shadow-md shadow-blue-500/25 mt-4 transition-all duration-300" disabled={loading}>
                {loading ? "Creating account..." : "Create Free Account"}
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-400 font-light">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-4 decoration-blue-500/40 hover:decoration-blue-400 transition-colors">
                Sign In
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
