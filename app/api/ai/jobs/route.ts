import { isAuthorizedAdminRequest } from "@/lib/admin-auth";
import { PROCESSING_PROMPT_VERSION, PROCESSING_SCHEMA_VERSION } from "@/lib/intelligence/structured-output";
import { createServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAuthorizedAdminRequest(request)) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const client = createServiceClient();
  if (!client) return Response.json({ ok: false, error: "service_database_not_configured" }, { status: 503 });
  const { data, error } = await client.from("ai_processing_jobs").select("id,news_id,status,attempt,model_provider,model_id,estimated_cost_usd,error_code,created_at,finished_at").order("created_at", { ascending: false }).limit(50);
  if (error) return Response.json({ ok: false, error: "job_list_failed" }, { status: 500 });
  return Response.json({ ok: true, jobs: data });
}

export async function POST(request: Request) {
  if (!isAuthorizedAdminRequest(request)) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const client = createServiceClient();
  if (!client) return Response.json({ ok: false, error: "service_database_not_configured" }, { status: 503 });
  const body = await request.json().catch(() => null) as { action?: string; newsId?: string; jobId?: string } | null;
  if (body?.action === "retry" && body.jobId) {
    const { data: job, error: readError } = await client.from("ai_processing_jobs").select("id,attempt").eq("id", body.jobId).eq("status", "failed").maybeSingle();
    if (readError || !job) return Response.json({ ok: false, error: "failed_job_not_found" }, { status: 404 });
    if (job.attempt >= 5) return Response.json({ ok: false, error: "retry_limit_reached" }, { status: 409 });
    const { error } = await client.from("ai_processing_jobs").update({ status: "queued", attempt: job.attempt + 1, task_type: "retry_translate_extract", error_code: null, error_message: null, finished_at: null }).eq("id", job.id);
    return error ? Response.json({ ok: false, error: "retry_failed" }, { status: 500 }) : Response.json({ ok: true, jobId: job.id, status: "queued" });
  }
  if (!body?.newsId) return Response.json({ ok: false, error: "news_id_required" }, { status: 400 });
  const { data: news, error: newsError } = await client.from("news").select("id,raw_item_id,title,content,summary").eq("id", body.newsId).maybeSingle();
  if (newsError || !news?.raw_item_id) return Response.json({ ok: false, error: "processable_news_not_found" }, { status: 404 });
  const key = `${news.raw_item_id}:${PROCESSING_PROMPT_VERSION}:${PROCESSING_SCHEMA_VERSION}`;
  const { data, error } = await client.from("ai_processing_jobs").insert({
    raw_item_id: news.raw_item_id,
    news_id: news.id,
    idempotency_key: key,
    prompt_version: PROCESSING_PROMPT_VERSION,
    schema_version: PROCESSING_SCHEMA_VERSION,
    input_snapshot: { title: news.title, content: news.content ?? news.summary ?? "" },
  }).select("id,status").single();
  if (error?.code === "23505") return Response.json({ ok: true, status: "duplicate", idempotencyKey: key });
  if (error) return Response.json({ ok: false, error: "enqueue_failed" }, { status: 500 });
  return Response.json({ ok: true, job: data }, { status: 201 });
}
