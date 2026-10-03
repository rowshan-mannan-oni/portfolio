import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg-alt px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span
            aria-hidden="true"
            className="mx-auto grid size-11 place-items-center rounded-xl bg-primary font-serif text-lg font-semibold text-primary-fg"
          >
            RO
          </span>
          <h1 className="mt-5 text-xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1.5 text-sm text-muted">Content management for the portfolio.</p>
        </div>
        {isSupabaseConfigured() ? (
          <LoginForm />
        ) : (
          <p className="card p-5 text-sm text-muted">
            Supabase environment variables are missing. Follow the setup steps in README.md, then restart the server.
          </p>
        )}
      </div>
    </main>
  );
}
