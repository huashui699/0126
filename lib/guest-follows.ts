const STORAGE_KEY = "0126football:guest-follows";
const VERSION = 1;
const MAX_FOLLOWS = 5;

type StoredFollows = {
  version: number;
  teamIds: string[];
};

export type GuestFollowsResult = {
  teamIds: string[];
  recovered: boolean;
};

export function readGuestFollows(validIds: ReadonlySet<string>): GuestFollowsResult {
  if (typeof window === "undefined") return { teamIds: [], recovered: false };

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return { teamIds: [], recovered: false };

  try {
    const parsed = JSON.parse(raw) as Partial<StoredFollows>;
    if (parsed.version !== VERSION || !Array.isArray(parsed.teamIds)) throw new Error("Invalid follow data");

    const teamIds = Array.from(new Set(parsed.teamIds.filter((id): id is string => typeof id === "string" && validIds.has(id)))).slice(0, MAX_FOLLOWS);
    const recovered = teamIds.length !== parsed.teamIds.length;
    if (recovered) writeGuestFollows(teamIds);
    return { teamIds, recovered };
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return { teamIds: [], recovered: true };
  }
}

export function writeGuestFollows(teamIds: string[]): void {
  if (typeof window === "undefined") return;
  const value: StoredFollows = { version: VERSION, teamIds: Array.from(new Set(teamIds)).slice(0, MAX_FOLLOWS) };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function clearGuestFollows(): void {
  if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
}
