"use client";

import { useEffect } from "react";

export function RootSplashDismiss() {
  useEffect(() => {
    const splash = document.getElementById("root-splash-screen");
    if (!splash) return;

    // Fast-track progress bar to 100% on hydration
    const bar = document.getElementById("root-splash-progress-bar");
    if (bar) {
      bar.style.width = "100%";
      bar.style.transition = "width 0.4s ease-out";
    }

    // Smoothly fade out splash screen
    const timer = setTimeout(() => {
      splash.style.opacity = "0";
      splash.style.pointerEvents = "none";
      setTimeout(() => {
        splash.remove();
      }, 500);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
