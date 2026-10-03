"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { signIn, type LoginState } from "@/lib/admin/actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, null);

  return (
    <form action={action} className="card space-y-5 p-6">
      <div>
        <label htmlFor="email" className="field-label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state?.email ?? ""}
          className="input"
        />
      </div>
      <div>
        <label htmlFor="password" className="field-label">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      {state?.error ? (
        <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
