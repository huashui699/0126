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
