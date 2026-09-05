import { Suspense } from "react";
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

  let portfolios = [];
  let assets = [];

  if (user) {
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
    portfolios = portfoliosResult.data ?? [];
    assets = assetsResult.data ?? [];
  }

  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#09090b] text-white px-4 select-none">
          {/* Background Liquid Ambient Glows */}
          <div className="absolute top-[-15%] left-[-15%] w-[320px] sm:w-[550px] h-[320px] sm:h-[550px] rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.30)_0%,rgba(6,182,212,0.1)_45%,transparent_70%)] pointer-events-none filter blur-[80px] sm:blur-[90px] animate-pulse" />
          <div className="absolute bottom-[-15%] right-[-15%] w-[320px] sm:w-[550px] h-[320px] sm:h-[550px] rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.25)_0%,rgba(20,184,166,0.08)_45%,transparent_70%)] pointer-events-none filter blur-[80px] sm:blur-[90px] animate-pulse" />

          <div className="relative z-10 flex flex-col items-center max-w-sm sm:max-w-md w-full px-2 sm:px-4">
            {/* App Icon with Halo */}
            <div className="relative mb-5 sm:mb-6">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400 opacity-75 blur-xl animate-pulse" />
              <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-500 to-emerald-400 p-0.5 shadow-2xl shadow-blue-500/40">
                <div className="w-full h-full bg-[#09090b]/80 rounded-[14px] flex items-center justify-center backdrop-blur-md p-2">
                  <svg width="100%" height="100%" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 512 150 L 150 850 L 350 850 L 512 537 L 674 850 L 874 850 Z" fill="#60A5FA" />
                    <path d="M 180 650 Q 350 650 512 500 T 800 250" stroke="#3B82F6" strokeWidth="90" strokeLinecap="round" fill="none" />
                    <path d="M 600 250 L 800 250 L 800 450" stroke="#3B82F6" strokeWidth="90" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Brand Title */}
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-white">Artha</span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-blue-500/20 to-emerald-500/20 border border-blue-400/30 text-blue-400 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-inner">
                  Wealth
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-zinc-400 uppercase mt-2">
                Live Market & Portfolio Engine
              </p>
            </div>

            {/* Progress Box Placeholder */}
            <div className="w-full mt-6 sm:mt-8 p-4 sm:p-5 rounded-2xl bg-zinc-950/85 border border-zinc-800/90 shadow-2xl backdrop-blur-xl flex flex-col gap-3.5 sm:gap-4">
              <div className="flex items-center justify-between text-xs font-medium text-zinc-400">
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin inline-block" />
                  <span>Connecting to Artha Engine...</span>
                </span>
                <span className="font-mono font-bold text-blue-400">10%</span>
              </div>
              <div className="w-full h-2 sm:h-2.5 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full w-[15%] animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <DashboardView
        user={user ?? null}
        portfolios={portfolios}
        assets={assets}
      />
    </Suspense>
  );
}


