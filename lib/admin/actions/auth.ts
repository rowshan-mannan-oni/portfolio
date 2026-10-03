"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { ADMIN_BASE, ADMIN_LOGIN } from "@/lib/admin/routes";

export type LoginState = { error?: string; email?: string } | null;

const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(256),
});

/**
 * Password sign-in through Supabase Auth. There is deliberately no sign-up
 * action anywhere in the app; the admin account is created in the Supabase
 * dashboard. Supabase applies its own auth rate limits.
 */
export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured. Add the environment variables first.", email };
  }
  const parsed = loginSchema.safeParse({ email, password: formData.get("password") });
  if (!parsed.success) return { error: "Enter your email and password.", email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // Same message for every failure so accounts can't be enumerated.
    return { error: "Invalid email or password.", email };
  }
  redirect(ADMIN_BASE);
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect(ADMIN_LOGIN);
}
