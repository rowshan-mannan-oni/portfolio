"use client";
import { useEffect, useState } from "react";

export function VisitorMetrics() {
  const [stats, setStats] = useState<{ total: number; active: number } | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    const refresh = async () => {
      if (document.visibilityState !== "visible" || pending) return;
      pending = true;
      try {
        const response = await fetch("/api/visitors/stats", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Unavailable");
        setStats(await response.json());
        setUnavailable(false);
      } catch {
        if (!controller.signal.aborted) setUnavailable(true);
      } finally { pending = false; }
    };
    void refresh();
    const interval = window.setInterval(refresh, 15_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      controller.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  return (
    <section aria-label="Visitor analytics" className="mt-4">
      <div className="grid grid-cols-2 gap-3">
        {[{ label: "Total distinct visitors", value: stats?.total }, { label: "Online now", value: stats?.active }].map(({ label, value }) => (
          <div key={label} className="card p-4">
            <p className="font-mono text-2xl font-medium">{unavailable ? "—" : value?.toLocaleString() ?? "…"}</p>
            <p className="mt-1 text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>
      <p role="status" className="mt-2 text-xs text-muted">
        {unavailable ? "Analytics unavailable. Check the visitor migration and server Supabase secret key." : "Unique browsers since tracking began. Online = active in the last 90 seconds. Refreshes every 15 seconds."}
      </p>
    </section>
  );
}
