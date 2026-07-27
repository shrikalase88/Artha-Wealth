"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Activity, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";

interface SplashScreenProps {
  /** If provided, when false, progress will quickly jump to 100% */
  isLoading?: boolean;
  /** Duration in ms for the splash animation */
  duration?: number;
  /** Callback when splash animation completes */
  onComplete?: () => void;
}

const LOADING_STEPS = [
  { threshold: 0, message: "Initializing Artha Wealth Engine..." },
  { threshold: 25, message: "Establishing real-time market data feed..." },
  { threshold: 50, message: "Fetching live NIFTY 50 & SENSEX indexes..." },
  { threshold: 75, message: "Synthesizing sector heatmaps & top gainers..." },
  { threshold: 95, message: "Finalizing market intelligence cockpit..." },
  { threshold: 100, message: "Market Overview Ready" }
];

export function SplashScreen({
  isLoading = true,
  duration = 1800,
  onComplete
}: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState(LOADING_STEPS[0].message);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const intervalMs = 40;
    const maxSafetyTimeoutMs = 8000;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;

      setProgress((prev) => {
        let next = prev;

        if (isLoading) {
          // While APIs are fetching, cap automatic progress growth at 90%
          if (elapsed > maxSafetyTimeoutMs) {
            // Safety timeout: auto force 100% after 8 seconds
            next = 100;
          } else if (prev < 30) {
            next = prev + 3;
          } else if (prev < 60) {
            next = prev + 2;
          } else if (prev < 88) {
            next = prev + 1;
          }
        } else {
          // When all APIs finish fetching, rapidly complete progress to 100%
          if (prev < 100) {
            next = Math.min(prev + 12, 100);
          }
        }

        // Update status message based on calculated progress
        const currentStep = [...LOADING_STEPS]
          .reverse()
          .find((step) => next >= step.threshold);
        if (currentStep) {
          setStatusMessage(currentStep.message);
        }

        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(() => {
              setIsDismissed(true);
              if (onComplete) onComplete();
            }, 600);
          }, 200);
        }

        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isLoading, onComplete]);

  const handleSkip = () => {
    setProgress(100);
    setIsFadingOut(true);
    setTimeout(() => {
      setIsDismissed(true);
      if (onComplete) onComplete();
    }, 300);
  };

  if (isDismissed) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#09090b] text-white overflow-hidden transition-all duration-700 ease-in-out px-4 select-none ${
        isFadingOut
          ? "opacity-0 scale-95 pointer-events-none filter blur-sm"
          : "opacity-100 scale-100"
      }`}
    >
      {/* Background Liquid Ambient Glows (Responsive Sizing) */}
      <div className="absolute top-[-15%] left-[-15%] w-[320px] sm:w-[550px] h-[320px] sm:h-[550px] rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.30)_0%,rgba(6,182,212,0.1)_45%,transparent_70%)] pointer-events-none filter blur-[80px] sm:blur-[90px] animate-pulse" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[320px] sm:w-[550px] h-[320px] sm:h-[550px] rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.25)_0%,rgba(20,184,166,0.08)_45%,transparent_70%)] pointer-events-none filter blur-[80px] sm:blur-[90px] animate-pulse" />

      {/* Main Responsive Content Container */}
      <div className="relative z-10 flex flex-col items-center max-w-sm sm:max-w-md w-full px-2 sm:px-4">
        {/* App Icon with Pulsing Halo */}
        <div className="relative group cursor-pointer mb-5 sm:mb-6">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400 opacity-75 blur-xl group-hover:opacity-100 transition duration-500 animate-pulse" />
          <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-500 to-emerald-400 p-0.5 shadow-2xl shadow-blue-500/40">
            <div className="w-full h-full bg-[#09090b]/80 rounded-[14px] flex items-center justify-center backdrop-blur-md p-2">
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 1024 1024"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="transform transition-transform duration-300 group-hover:scale-105"
              >
                <path
                  d="M 512 150 L 150 850 L 350 850 L 512 537 L 674 850 L 874 850 Z"
                  fill="url(#splash-icon-grad-1)"
                />
                <path
                  d="M 180 650 Q 350 650 512 500 T 800 250"
                  stroke="url(#splash-icon-grad-2)"
                  strokeWidth="90"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 600 250 L 800 250 L 800 450"
                  stroke="url(#splash-icon-grad-2)"
                  strokeWidth="90"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <defs>
                  <linearGradient id="splash-icon-grad-1" x1="150" y1="150" x2="874" y2="850" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#60A5FA" />
                    <stop offset="1" stopColor="#34D399" />
                  </linearGradient>
                  <linearGradient id="splash-icon-grad-2" x1="180" y1="250" x2="800" y2="650" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3B82F6" />
                    <stop offset="1" stopColor="#10B981" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Artha
            </span>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-blue-500/20 to-emerald-500/20 border border-blue-400/30 text-blue-400 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-inner">
              Wealth
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-zinc-400 uppercase mt-2 flex items-center gap-1.5">
            <Activity className="h-3 w-3 text-emerald-400 animate-pulse shrink-0" />
            <span>Live Market & Portfolio Engine</span>
          </p>
        </div>

        {/* Responsive Progress Card Container */}
        <div className="w-full mt-6 sm:mt-8 p-4 sm:p-5 rounded-2xl bg-zinc-950/85 border border-zinc-800/90 shadow-2xl backdrop-blur-xl flex flex-col gap-3.5 sm:gap-4">
          {/* Status Message & Percentage */}
          <div className="flex items-center justify-between text-xs font-medium gap-2">
            <span className="text-zinc-300 truncate max-w-[170px] xs:max-w-[220px] sm:max-w-[260px] flex items-center gap-2 text-[11px] sm:text-xs">
              <Sparkles className="h-3.5 w-3.5 text-blue-400 shrink-0 animate-spin" style={{ animationDuration: "4s" }} />
              <span className="truncate">{statusMessage}</span>
            </span>
            <span className="font-mono font-bold text-blue-400 text-xs sm:text-sm shrink-0">
              {progress}%
            </span>
          </div>

          {/* Modern Animated Loading Bar */}
          <Progress value={progress} className="h-2 sm:h-2.5 bg-zinc-900 border border-zinc-800" />

          {/* Bottom Live Feed Badges & Skip */}
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-zinc-400 border-t border-zinc-900 pt-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span className="text-zinc-400 font-mono tracking-wider">LIVE FEED SYNC</span>
            </div>

            <button
              onClick={handleSkip}
              className="text-zinc-400 hover:text-white flex items-center gap-1 text-[10px] sm:text-[11px] transition-colors py-0.5 px-2 rounded-md hover:bg-zinc-800/60 cursor-pointer"
            >
              <span>Skip</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Security Watermark */}
        <div className="mt-6 sm:mt-8 flex items-center gap-1.5 text-[9px] sm:text-[10px] text-zinc-400 font-mono">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          <span>INSTANT REAL-TIME QUANT ENGINE</span>
        </div>
      </div>
    </div>
  );
}
