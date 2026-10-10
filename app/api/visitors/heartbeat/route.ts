import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSecretClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
const COOKIE = "portfolio_visitor";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return new NextResponse(null, { status: 403 });
  if (/bot|crawler|spider|headless/i.test(request.headers.get("user-agent") ?? "")) return new NextResponse(null, { status: 204 });
  const db = createSecretClient();
  const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!db || !secret) return new NextResponse(null, { status: 503 });
  const sign = (id: string) => createHmac("sha256", secret).update(`visitor:${id}`).digest("hex");
  const [candidate, signature] = (request.cookies.get(COOKIE)?.value ?? "").split(".");
  const valid = candidate && UUID.test(candidate) && signature && /^[0-9a-f]{64}$/.test(signature)
    && timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(sign(candidate), "hex"));
  const id = valid ? candidate : randomUUID();
  const { error } = await db.rpc("record_site_visit", { visitor_id: id });
  if (error) return new NextResponse(null, { status: 503 });
  const response = new NextResponse(null, { status: 204 });
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set(COOKIE, `${id}.${sign(id)}`, {
    httpOnly: true, secure: request.nextUrl.protocol === "https:",
    sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
