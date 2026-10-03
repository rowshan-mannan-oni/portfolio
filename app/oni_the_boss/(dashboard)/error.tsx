"use client";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card max-w-lg p-7">
      <h1 className="text-lg font-semibold">This page could not be loaded</h1>
      <p className="mt-2 text-sm text-muted">
        The database may be unreachable (a paused Supabase project is a common cause) or your session may have expired.
        Details are in the server logs.
      </p>
      <button type="button" onClick={reset} className="btn btn-primary btn-sm mt-5">
        Try again
      </button>
    </div>
  );
}
