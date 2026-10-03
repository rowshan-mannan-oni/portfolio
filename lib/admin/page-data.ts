import "server-only";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth";

/**
 * Supabase client for dashboard pages, acting as the signed-in admin.
 * The dashboard layout already blocks non-admins; this is defense in depth.
 */
export async function adminDb() {
  const state = await requireAdminPage();
  if (state.status !== "admin") notFound();
  return state.supabase;
}
