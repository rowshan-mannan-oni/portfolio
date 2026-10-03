"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { THEME_STORAGE_KEY, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

const getTheme = (): Theme =>
  document.documentElement.classList.contains("dark") ? "dark" : "light";

export function applyTheme(next: Theme) {
  const root = document.documentElement;
  root.classList.add("theme-transition");
  root.classList.toggle("dark", next === "dark");
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // Storage may be unavailable (private mode); the choice simply won't persist.
  }
  window.setTimeout(() => root.classList.remove("theme-transition"), 300);
}

export function ThemeToggle({ className, withLabel = false }: { className?: string; withLabel?: boolean }) {
  // Server snapshot is null so the first client render matches the HTML.
  const theme = useSyncExternalStore<Theme | null>(subscribe, getTheme, () => null);
  const isDark = theme === "dark";
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      onClick={() => applyTheme(isDark ? "light" : "dark")}
      aria-label={withLabel ? undefined : label}
      title={label}
      className={cn("btn btn-ghost", withLabel ? "btn-sm justify-start" : "btn-icon", className)}
    >
      <span className="relative inline-flex size-[18px] items-center justify-center" aria-hidden="true">
        <Sun
          className={cn(
            "absolute size-[18px] transition-all duration-300",
            isDark ? "scale-50 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100",
          )}
        />
        <Moon
          className={cn(
            "absolute size-[17px] transition-all duration-300",
            isDark ? "scale-100 rotate-0 opacity-100" : "scale-50 -rotate-90 opacity-0",
          )}
        />
      </span>
      {withLabel ? <span>{isDark ? "Light theme" : "Dark theme"}</span> : null}
    </button>
  );
}
