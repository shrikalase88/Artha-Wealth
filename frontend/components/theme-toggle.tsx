"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div 
        className={`h-8 w-8 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-zinc-900 animate-pulse ${className}`} 
        aria-hidden="true" 
      />
    );
  }

  const isDark = resolvedTheme === "dark" || theme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`group relative flex items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-100/90 dark:bg-zinc-900/90 hover:bg-zinc-200/90 dark:hover:bg-zinc-800/90 text-zinc-700 dark:text-zinc-300 transition-all duration-150 ease-out active:scale-90 cursor-pointer select-none touch-manipulation ${
        showLabel ? "px-3 py-1.5 h-8 text-xs font-medium" : "h-8 w-8 min-h-[32px] min-w-[32px]"
      } ${className}`}
      aria-label={isDark ? "Switch to Bright White mode" : "Switch to Dark mode"}
      title={isDark ? "Switch to Bright White mode" : "Switch to Dark mode"}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300 stroke-[2]" />
      ) : (
        <Moon className="h-4 w-4 text-zinc-700 dark:text-zinc-300 group-hover:-rotate-12 transition-transform duration-300 stroke-[2]" />
      )}
      {showLabel && (
        <span className="font-sans text-[11px] tracking-tight font-medium text-zinc-700 dark:text-zinc-300">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
}
