import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

// Only the admin area needs session handling; public pages stay static.
export const config = {
  matcher: ["/oni_the_boss", "/oni_the_boss/:path*"],
};
