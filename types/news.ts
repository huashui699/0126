export type News = {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  source: string | null;
  url: string | null;
  image: string | null;
  league: string | null;
  team: string | null;
  created_at: string;
};

export type InformationType =
  | "club_announcement"
  | "match"
  | "player"
  | "transfer"
  | "coaching"
  | "social"
  | "media";

export type TrustStatus = "confirmed" | "unverified" | "rumor";

export type CalendarNews = News & {
  published_at: string;
  event_at: string | null;
  info_type: InformationType;
  trust_status: TrustStatus;
  trust_reason: string;
  trust_updated_at: string;
  team_ids: string[];
};

