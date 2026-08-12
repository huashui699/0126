import { isAuthorizedIngestionRequest } from "@/lib/ingestion/request-auth";
import { createServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAuthorizedIngestionRequest(request)) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const client = createServiceClient();
  if (!client) return Response.json({ ok: false, error: "service_database_not_configured" }, { status: 503 });
  const { data, error } = await client.from("source_health_status").select("*").order("name");
  if (error) return Response.json({ ok: false, error: "health_query_failed" }, { status: 500 });
  return Response.json({ ok: true, sources: data });
}
