"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";

export default function PublicError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // The error itself is intentionally not shown to visitors.
  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-20">
      <div className="max-w-md text-center">
        <p className="eyebrow">Something went wrong</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">This page could not be loaded</h1>
        <p className="mt-4 text-muted">Please try again in a moment.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="btn btn-primary">
            <RotateCcw className="size-4" aria-hidden="true" />
            Try again
          </button>
          <Link href="/" className="btn btn-secondary">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
