"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { Activity, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";

const STAGES = [
  { threshold: 0, message: "Initializing Finance & Quant Engine..." },
  { threshold: 25, message: "Connecting to Global Market Indices..." },
  { threshold: 50, message: "Fetching Live Exchange & Forex Rates..." },
  { threshold: 75, message: "Aggregating AMFI Mutual Funds & NAVs..." },
  { threshold: 92, message: "Synthesizing Asset Allocation Metrics..." },
  { threshold: 100, message: "Financial Intelligence Ready" },
];

export function GlobalSplashScreen() {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  const [progress, setProgress] = useState(15);
  const [statusMessage, setStatusMessage] = useState(STAGES[0].message);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const isDataReadyRef = useRef(false);

  useEffect(() => {
    // If user opens directly on an auth page, dismiss splash immediately
    if (isAuthPage) {
      setIsDismissed(true);
      return;
    }

    const handleDashboardReady = () => {
      isDataReadyRef.current = true;
    };

    window.addEventListener("artha:dashboard-ready", handleDashboardReady);

    const startTime = Date.now();
    const intervalMs = 40;
    const maxSafetyTimeoutMs = 4500;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;

      setProgress((prev) => {
        let next = prev;

        if (isDataReadyRef.current || elapsed > maxSafetyTimeoutMs) {
          // Data is ready or safety timeout exceeded: quickly jump to 100%
          next = Math.min(prev + 12, 100);
        } else {
          // Smooth progressive ramp-up while data loads
          if (prev < 35) {
            next = prev + 3;
          } else if (prev < 65) {
            next = prev + 1.8;
          } else if (prev < 88) {
            next = prev + 0.9;
          } else if (prev < 95) {
            next = prev + 0.3;
          }
        }

        // Update status text based on current progress
        const stage = [...STAGES].reverse().find((s) => next >= s.threshold);
        if (stage) {
          setStatusMessage(stage.message);
        }

        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(() => {
              setIsDismissed(true);
            }, 500);
          }, 200);
        }

        return Math.round(next * 10) / 10;
      });
    }, intervalMs);

    return () => {
      clearInterval(interval);
      window.removeEventListener("artha:dashboard-ready", handleDashboardReady);
    };
  }, [isAuthPage]);

  const handleSkip = () => {
    setProgress(100);
    setStatusMessage("Financial Intelligence Ready");
    setIsFadingOut(true);
    setTimeout(() => {
      setIsDismissed(true);
    }, 300);
  };

  if (isDismissed) return null;

  const displayProgress = Math.min(Math.round(progress), 100);

  return (
    <div
      id="root-splash-screen"
      className={`fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-[#09090b] text-white px-4 select-none transition-all duration-500 ease-out ${
        isFadingOut
          ? "opacity-0 pointer-events-none scale-98 blur-xs"
          : "opacity-100 pointer-events-auto scale-100"
      }`}
      style={{ willChange: "opacity, transform" }}
    >
      {/* Ambient Liquid Glows */}
      <div className="absolute top-[-15%] left-[-15%] w-[320px] sm:w-[550px] h-[320px] sm:h-[550px] rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.30)_0%,rgba(6,182,212,0.1)_45%,transparent_70%)] pointer-events-none filter blur-[80px] sm:blur-[90px] animate-pulse" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[320px] sm:w-[550px] h-[320px] sm:h-[550px] rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.25)_0%,rgba(20,184,166,0.08)_45%,transparent_70%)] pointer-events-none filter blur-[80px] sm:blur-[90px] animate-pulse" />

      {/* Main Center Content */}
      <div className="relative z-10 flex flex-col items-center max-w-sm sm:max-w-md w-full px-2 sm:px-4 text-center">
        {/* App Icon with Pulsing Halo */}
        <div className="relative mb-5 sm:mb-6">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400 opacity-75 blur-xl animate-pulse" />
          <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-500 to-emerald-400 p-0.5 shadow-2xl shadow-blue-500/40">
            <div className="w-full h-full bg-[#09090b]/85 rounded-[14px] flex items-center justify-center backdrop-blur-md p-2">
              <svg width="100%" height="100%" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M 512 150 L 150 850 L 350 850 L 512 537 L 674 850 L 874 850 Z" fill="#60A5FA" />
                <path d="M 180 650 Q 350 650 512 500 T 800 250" stroke="#3B82F6" strokeWidth="90" strokeLinecap="round" fill="none" />
                <path d="M 600 250 L 800 250 L 800 450" stroke="#3B82F6" strokeWidth="90" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl sm:text-3xl font-black tracking-tight text-white">Artha</span>
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-blue-500/20 to-emerald-500/20 border border-blue-400/30 text-blue-400 px-2.5 py-0.5 rounded-full shadow-inner">
            Wealth
          </span>
        </div>
        <p className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-zinc-400 uppercase flex items-center gap-1.5 mb-6">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Market & Portfolio Engine</span>
        </p>

        {/* Modern Glass Progress Card */}
        <div className="w-full p-4 sm:p-5 rounded-2xl bg-zinc-950/85 border border-zinc-800/90 shadow-2xl backdrop-blur-xl flex flex-col gap-3.5">
          {/* Status Message & Percentage */}
          <div className="flex items-center justify-between text-xs font-medium gap-2">
            <span className="text-zinc-300 truncate max-w-[220px] sm:max-w-[270px] flex items-center gap-2 text-[11px] sm:text-xs text-left">
              <Sparkles className="h-3.5 w-3.5 text-blue-400 shrink-0 animate-spin" style={{ animationDuration: "3s" }} />
              <span className="truncate">{statusMessage}</span>
            </span>
            <span className="font-mono font-bold text-blue-400 text-xs sm:text-sm shrink-0">
              {displayProgress}%
            </span>
          </div>

          {/* High-Performance Smooth Progress Bar */}
          <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800/80">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-200 ease-out"
              style={{ width: `${displayProgress}%` }}
            />
          </div>

          {/* Bottom Indicators & Skip */}
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-zinc-400 border-t border-zinc-900/90 pt-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span className="text-zinc-400 font-mono tracking-wider">QUANT SYNC</span>
            </div>

            <button
              type="button"
              onClick={handleSkip}
              className="text-zinc-400 hover:text-white flex items-center gap-1 text-[10px] sm:text-[11px] transition-colors py-0.5 px-2 rounded-md hover:bg-zinc-800/60 cursor-pointer"
            >
              <span>Skip</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Security / Engine Watermark */}
        <div className="mt-6 flex items-center gap-1.5 text-[9px] sm:text-[10px] text-zinc-500 font-mono">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500/80 shrink-0" />
          <span>INSTANT REAL-TIME QUANT ENGINE</span>
        </div>
      </div>
    </div>
  );
}
