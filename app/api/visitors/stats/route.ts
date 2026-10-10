import { getAuthState } from "@/lib/auth";

export async function GET() {
  const state = await getAuthState();
  if (state.status !== "admin") return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await state.supabase.rpc("visitor_stats");
  if (error || !data?.[0]) return Response.json({ error: "Visitor analytics unavailable" }, { status: 503 });
  return Response.json(data[0], { headers: { "Cache-Control": "private, no-store" } });
}
