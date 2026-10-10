"use client";
import { useEffect } from "react";

export function VisitorTracker() {
  useEffect(() => {
    let pending = false;
    const heartbeat = async () => {
      if (document.visibilityState !== "visible" || pending) return;
      pending = true;
      try {
        await fetch("/api/visitors/heartbeat", { method: "POST", credentials: "same-origin", cache: "no-store" });
      } catch { /* Analytics must never interrupt browsing. */ }
      finally { pending = false; }
    };
    void heartbeat();
    const interval = window.setInterval(heartbeat, 30_000);
    document.addEventListener("visibilitychange", heartbeat);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", heartbeat);
    };
  }, []);
  return null;
}
