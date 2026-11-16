"use client";

import { useEffect, useState } from "react";

interface SplashScreenProps {
  isLoading?: boolean;
  onComplete?: () => void;
}

export function SplashScreen({
  isLoading = true,
  onComplete,
}: SplashScreenProps) {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setIsFadingOut(true);
      const timer = setTimeout(() => {
        setIsDismissed(true);
        if (onComplete) onComplete();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isLoading, onComplete]);

  if (isDismissed) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#09090b] text-white select-none transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isFadingOut
          ? "opacity-0 scale-[1.02] pointer-events-none blur-[2px]"
          : "opacity-100 scale-100 pointer-events-auto"
      }`}
      style={{ willChange: "opacity, transform" }}
    >
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full pointer-events-none opacity-30 blur-[90px]"
        style={{
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, rgba(16, 185, 129, 0.08) 50%, transparent 70%)"
        }}
      />

      <div className="relative z-10 flex flex-col items-center">
        <div className="relative mb-6">
          <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-zinc-900/90 border border-white/10 shadow-2xl shadow-black/80 backdrop-blur-xl">
            <svg 
              className="w-9 h-9 sm:w-11 sm:h-11 text-white" 
              viewBox="0 0 48 48" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M24 6L6 38H16L24 23.5L32 38H42L24 6Z"
                fill="url(#splash-silver-grad)"
              />
              <path
                d="M24 16.5L19 26H29L24 16.5Z"
                fill="#09090b"
                opacity="0.9"
              />
              <path
                d="M24 27L21 33H27L24 27Z"
                fill="url(#splash-accent-grad)"
              />
              <defs>
                <linearGradient id="splash-silver-grad" x1="6" y1="6" x2="42" y2="38" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FFFFFF" />
                  <stop offset="0.6" stopColor="#E4E4E7" />
                  <stop offset="1" stopColor="#A1A1AA" />
                </linearGradient>
                <linearGradient id="splash-accent-grad" x1="21" y1="27" x2="27" y2="33" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#3B82F6" />
                  <stop offset="1" stopColor="#10B981" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-[0.2em] text-white uppercase font-sans">
              Artha
            </span>
            <span className="text-[10px] font-semibold tracking-[0.25em] text-zinc-400 uppercase border border-zinc-700/60 bg-zinc-800/50 px-2 py-0.5 rounded-md">
              Wealth
            </span>
          </div>
          <span className="text-[10px] font-medium tracking-[0.22em] text-zinc-500 uppercase mt-1">
            Loading Real-Time Intelligence
          </span>
        </div>

        <div className="w-28 sm:w-36 h-[2px] bg-zinc-800/80 rounded-full mt-7 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400 rounded-full animate-splash-progress" />
        </div>
      </div>
    </div>
  );
}
