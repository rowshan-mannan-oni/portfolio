import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="container-page grid min-h-dvh place-items-center py-20">
      <div className="max-w-md text-center">
        <p className="font-mono text-sm tracking-[0.2em] text-primary">404</p>
        <div aria-hidden="true" className="mx-auto my-6 h-px w-16 bg-primary/40" />
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">This page doesn&rsquo;t exist</h1>
        <p className="mt-4 leading-relaxed text-muted">
          The link may be outdated, or the page may have moved. Everything important lives on the
          homepage.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-primary">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to home
          </Link>
          <Link href="/blog" className="btn btn-secondary">
            Read the blog
          </Link>
        </div>
      </div>
    </main>
  );
}
