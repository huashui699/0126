import type { SupabaseClient } from "@supabase/supabase-js";

export type MergeResult = {
  mergedTeamIds: string[];
  addedCount: number;
  skippedCount: number;
};

export async function mergeGuestFollows(
  client: SupabaseClient,
  userId: string,
  guestTeamIds: string[],
): Promise<MergeResult> {
  const { data, error } = await client
    .from("user_team_follows")
    .select("team_id,sort_order")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);

  const existing = (data ?? []).map((row) => String(row.team_id));
  const additions = guestTeamIds.filter((id) => !existing.includes(id)).slice(0, Math.max(0, 5 - existing.length));

  if (additions.length) {
    const { error: insertError } = await client.from("user_team_follows").insert(
      additions.map((teamId, index) => ({
        user_id: userId,
        team_id: teamId,
        sort_order: existing.length + index,
      })),
    );
    if (insertError) throw new Error(insertError.message);
  }

  return {
    mergedTeamIds: [...existing, ...additions],
    addedCount: additions.length,
    skippedCount: Math.max(0, guestTeamIds.filter((id) => !existing.includes(id)).length - additions.length),
  };
}

export async function replaceAccountFollows(
  client: SupabaseClient,
  userId: string,
  teamIds: string[],
): Promise<void> {
  const normalized = Array.from(new Set(teamIds)).slice(0, 5);
  const { error: deleteError } = await client.from("user_team_follows").delete().eq("user_id", userId);
  if (deleteError) throw new Error(deleteError.message);

  if (!normalized.length) return;
  const { error: insertError } = await client.from("user_team_follows").insert(
    normalized.map((teamId, sortOrder) => ({ user_id: userId, team_id: teamId, sort_order: sortOrder })),
  );
  if (insertError) throw new Error(insertError.message);
}
