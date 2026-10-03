import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicEnv, isSupabaseConfigured } from "@/lib/env";
import type { Database } from "@/types/database";
import { ADMIN_BASE, ADMIN_LOGIN } from "@/lib/admin/routes";

/**
 * Refreshes the Supabase session cookie and performs an *optimistic* redirect
 * for admin pages. This is a convenience only — real enforcement happens in
 * the admin layout (requireAdmin), in every Server Action, and in RLS.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) return response;

  const { url, publishableKey } = getSupabasePublicEnv();
  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers ?? {}).forEach(([key, value]) =>
          response.headers.set(key, value),
        );
      },
    },
  });

  // Keep this call directly after createServerClient: it validates the JWT
  // and refreshes the session when needed.
  const { data } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(data?.claims?.sub);

  const isLogin = request.nextUrl.pathname === ADMIN_LOGIN;
  const target = !isSignedIn && !isLogin ? ADMIN_LOGIN : isSignedIn && isLogin ? ADMIN_BASE : null;

  if (target) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = target;
    redirectUrl.search = "";
    const redirect = NextResponse.redirect(redirectUrl);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  return response;
}
