"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function GlobalSplashScreen() {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (isAuthPage) {
      setIsDismissed(true);
      return;
    }

    let isDone = false;
    const dismiss = () => {
      if (isDone) return;
      isDone = true;
      setIsFadingOut(true);
      setTimeout(() => {
        setIsDismissed(true);
      }, 350);
    };

    // Listen for dashboard-ready event from dashboard view
    const handleDashboardReady = () => {
      // Small graceful buffer for silky smooth visual stability
      setTimeout(dismiss, 120);
    };

    window.addEventListener("artha:dashboard-ready", handleDashboardReady);

    // Fallback safety timeout: never block user for more than 1.2s even on slow connections
    const timer = setTimeout(dismiss, 1200);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("artha:dashboard-ready", handleDashboardReady);
    };
  }, [isAuthPage]);

  if (isDismissed || !mounted) return null;

  return (
    <div
      id="root-splash-screen"
      aria-hidden="true"
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#09090b] text-white select-none transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isFadingOut
          ? "opacity-0 scale-[1.02] pointer-events-none blur-[2px]"
          : "opacity-100 scale-100 pointer-events-auto"
      }`}
      style={{ willChange: "opacity, transform, filter" }}
    >
      {/* Subtle, restrained ambient radial light - Apple/Google style */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full pointer-events-none opacity-30 blur-[90px]"
        style={{
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, rgba(16, 185, 129, 0.08) 50%, transparent 70%)"
        }}
      />

      {/* Main Center Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Minimalist Titanium / Obsidian Icon Mark */}
        <div className="relative mb-6">
          <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-zinc-900/90 border border-white/10 shadow-2xl shadow-black/80 backdrop-blur-xl">
            <svg 
              className="w-9 h-9 sm:w-11 sm:h-11 text-white" 
              viewBox="0 0 48 48" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer Precision Hex-Chevron / Ascending A */}
              <path
                d="M24 6L6 38H16L24 23.5L32 38H42L24 6Z"
                fill="url(#artha-silver-grad)"
              />
              {/* Inner Focus Diamond / Growth Needle */}
              <path
                d="M24 16.5L19 26H29L24 16.5Z"
                fill="#09090b"
                opacity="0.9"
              />
              <path
                d="M24 27L21 33H27L24 27Z"
                fill="url(#artha-accent-grad)"
              />
              <defs>
                <linearGradient id="artha-silver-grad" x1="6" y1="6" x2="42" y2="38" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FFFFFF" />
                  <stop offset="0.6" stopColor="#E4E4E7" />
                  <stop offset="1" stopColor="#A1A1AA" />
                </linearGradient>
                <linearGradient id="artha-accent-grad" x1="21" y1="27" x2="27" y2="33" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#3B82F6" />
                  <stop offset="1" stopColor="#10B981" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Brand Typographic Lockup */}
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
            Global Market Intelligence
          </span>
        </div>

        {/* Minimal Precision Hairline Progress Bar */}
        <div className="w-28 sm:w-36 h-[2px] bg-zinc-800/80 rounded-full mt-7 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400 rounded-full animate-splash-progress" />
        </div>
      </div>
    </div>
  );
}
