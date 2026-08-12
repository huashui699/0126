import { isAuthorizedAdminRequest } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

const reviewActions = new Set(["set_trust", "hide", "unhide", "merge_cluster", "revert"]);
const trustStatuses = new Set(["confirmed", "unverified", "rumor"]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function isBoundedText(value: string | undefined, minimum: number, maximum: number): value is string {
  const length = value?.trim().length ?? 0;
  return length >= minimum && length <= maximum;
}

function isUuid(value: string | undefined): value is string {
  return Boolean(value && uuidPattern.test(value));
}

export async function GET(request: Request) {
  if (!isAuthorizedAdminRequest(request)) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const client = createServiceClient();
  if (!client) return Response.json({ ok: false, error: "service_database_not_configured" }, { status: 503 });
  const [queue, actions] = await Promise.all([
    client.from("news").select("id,title,trust_status,trust_reason,review_state,hidden_at,published_at").eq("review_state", "pending").order("published_at", { ascending: false }).limit(50),
    client.from("review_actions").select("id,action_type,action_status,news_id,cluster_id,merge_into_cluster_id,reason,actor_ref,created_at,reverted_at").order("created_at", { ascending: false }).limit(50),
  ]);
  if (queue.error || actions.error) return Response.json({ ok: false, error: "review_data_failed" }, { status: 500 });
  return Response.json({ ok: true, queue: queue.data, actions: actions.data });
}

export async function POST(request: Request) {
  if (!isAuthorizedAdminRequest(request)) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const client = createServiceClient();
  if (!client) return Response.json({ ok: false, error: "service_database_not_configured" }, { status: 503 });
  const body = await request.json().catch(() => null) as {
    action?: "set_trust" | "hide" | "unhide" | "merge_cluster" | "revert";
    reason?: string;
    actorRef?: string;
    newsId?: string;
    newTrust?: string;
    clusterId?: string;
    mergeIntoClusterId?: string;
    actionId?: string;
  } | null;
  if (!body?.action || !reviewActions.has(body.action)) return Response.json({ ok: false, error: "invalid_action" }, { status: 400 });
  if (!isBoundedText(body.reason, 3, 500) || !isBoundedText(body.actorRef, 3, 200)) {
    return Response.json({ ok: false, error: "invalid_reason_or_actor" }, { status: 400 });
  }

  if (body.action === "revert") {
    if (!isUuid(body.actionId)) return Response.json({ ok: false, error: "invalid_action_id" }, { status: 400 });
    const { data, error } = await client.rpc("revert_review_action", { p_action_id: body.actionId, p_reason: body.reason, p_actor_ref: body.actorRef });
    return error ? Response.json({ ok: false, error: "revert_failed" }, { status: 400 }) : Response.json({ ok: true, actionId: data });
  }

  if (["set_trust", "hide", "unhide"].includes(body.action) && !isUuid(body.newsId)) {
    return Response.json({ ok: false, error: "invalid_news_id" }, { status: 400 });
  }
  if (body.action === "set_trust" && (!body.newTrust || !trustStatuses.has(body.newTrust))) {
    return Response.json({ ok: false, error: "invalid_trust_status" }, { status: 400 });
  }
  if (body.action === "merge_cluster" && (!isUuid(body.clusterId) || !isUuid(body.mergeIntoClusterId) || body.clusterId === body.mergeIntoClusterId)) {
    return Response.json({ ok: false, error: "invalid_cluster_ids" }, { status: 400 });
  }

  const { data, error } = await client.rpc("apply_review_action", {
    p_action_type: body.action,
    p_reason: body.reason,
    p_actor_ref: body.actorRef,
    p_news_id: body.newsId ?? null,
    p_new_trust: body.newTrust ?? null,
    p_cluster_id: body.clusterId ?? null,
    p_merge_into_cluster_id: body.mergeIntoClusterId ?? null,
  });
  return error ? Response.json({ ok: false, error: "review_action_failed" }, { status: 400 }) : Response.json({ ok: true, actionId: data });
}
