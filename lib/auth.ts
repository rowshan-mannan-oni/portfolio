import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { ADMIN_LOGIN } from "@/lib/admin/routes";

export type AdminSession = {
  userId: string;
  email: string | null;
  supabase: Awaited<ReturnType<typeof createClient>>;
};

export type AuthState =
  | { status: "unconfigured" }
  | { status: "anonymous" }
  | { status: "forbidden"; email: string | null }
  | ({ status: "admin" } & AdminSession);

/**
 * Resolves the current visitor's admin status on the server.
 *
 * getClaims() verifies the JWT signature, so a forged cookie is rejected.
 * Being signed in is not sufficient: the user must also have a row in
 * public.admin_users.
 */
export const getAuthState = cache(async (): Promise<AuthState> => {
  if (!isSupabaseConfigured()) return { status: "unconfigured" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return { status: "anonymous" };

  const email = typeof claims.email === "string" ? claims.email : null;
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return { status: "forbidden", email };

  return { status: "admin", userId: claims.sub, email, supabase };
});

/** For admin pages: redirects anonymous visitors to the login page. */
export async function requireAdminPage(): Promise<AuthState> {
  const state = await getAuthState();
  if (state.status === "anonymous") redirect(ADMIN_LOGIN);
  return state;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("You are not authorized to perform this action.");
    this.name = "UnauthorizedError";
  }
}

/**
 * For Server Actions. Every privileged mutation calls this first; Server
 * Actions are public HTTP endpoints, so page-level checks are not enough.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const state = await getAuthState();
  if (state.status !== "admin") throw new UnauthorizedError();
  return { userId: state.userId, email: state.email, supabase: state.supabase };
}
