export type DiscoverySource = {
  id: string;
  slug: string;
  name: string;
  homepageUrl: string;
  articlePathPattern?: string;
  listingUrls?: string[];
  officialApiUrl?: string;
  defaultTeamId?: string;
};

export const discoverySources: DiscoverySource[] = [
  { id: "30000000-0000-4000-8000-000000000001", slug: "premier-league-official", name: "Premier League Official", homepageUrl: "https://www.premierleague.com/", articlePathPattern: "^/en/news/[0-9]+/", listingUrls: ["https://www.premierleague.com/en/news", "https://www.premierleague.com/en/content-listing"], officialApiUrl: "https://api.premierleague.com/content/premierleague/news/en?offset=0&limit=20&detail=DETAILED" },
  { id: "30000000-0000-4000-8000-000000000002", slug: "la-liga-official", name: "LALIGA Official", homepageUrl: "https://www.laliga.com/" },
  { id: "30000000-0000-4000-8000-000000000003", slug: "bundesliga-official", name: "Bundesliga Official", homepageUrl: "https://www.bundesliga.com/" },
  { id: "30000000-0000-4000-8000-000000000004", slug: "serie-a-official", name: "Lega Serie A Official", homepageUrl: "https://www.legaseriea.it/" },
  { id: "30000000-0000-4000-8000-000000000005", slug: "ligue-1-official", name: "Ligue 1 Official", homepageUrl: "https://ligue1.com/" },
  { id: "30000000-0000-4000-8000-000000000006", slug: "manchester-united-official", name: "Manchester United Official", homepageUrl: "https://www.manutd.com/" },
  { id: "30000000-0000-4000-8000-000000000007", slug: "liverpool-official", name: "Liverpool FC Official", homepageUrl: "https://www.liverpoolfc.com/", articlePathPattern: "^/news/", listingUrls: ["https://www.liverpoolfc.com/news"], defaultTeamId: "20000000-0000-4000-8000-000000000002" },
  { id: "30000000-0000-4000-8000-000000000008", slug: "chelsea-official", name: "Chelsea FC Official", homepageUrl: "https://www.chelseafc.com/" },
  { id: "30000000-0000-4000-8000-000000000009", slug: "manchester-city-official", name: "Manchester City Official", homepageUrl: "https://www.mancity.com/", articlePathPattern: "^/news/", listingUrls: ["https://www.mancity.com/news"] },
  { id: "30000000-0000-4000-8000-000000000010", slug: "tottenham-hotspur-official", name: "Tottenham Hotspur Official", homepageUrl: "https://www.tottenhamhotspur.com/" },
  { id: "30000000-0000-4000-8000-000000000011", slug: "arsenal-official", name: "Arsenal Official", homepageUrl: "https://www.arsenal.com/", articlePathPattern: "^/news/", listingUrls: ["https://www.arsenal.com/news"], defaultTeamId: "20000000-0000-4000-8000-000000000006" },
  { id: "30000000-0000-4000-8000-000000000012", slug: "real-madrid-official", name: "Real Madrid Official", homepageUrl: "https://www.realmadrid.com/" },
  { id: "30000000-0000-4000-8000-000000000013", slug: "barcelona-official", name: "FC Barcelona Official", homepageUrl: "https://www.fcbarcelona.com/" },
  { id: "30000000-0000-4000-8000-000000000014", slug: "bayern-munich-official", name: "FC Bayern Official", homepageUrl: "https://fcbayern.com/" },
  { id: "30000000-0000-4000-8000-000000000015", slug: "borussia-dortmund-official", name: "Borussia Dortmund Official", homepageUrl: "https://www.bvb.de/" },
  { id: "30000000-0000-4000-8000-000000000016", slug: "juventus-official", name: "Juventus Official", homepageUrl: "https://www.juventus.com/" },
  { id: "30000000-0000-4000-8000-000000000017", slug: "inter-milan-official", name: "Inter Official", homepageUrl: "https://www.inter.it/" },
  { id: "30000000-0000-4000-8000-000000000018", slug: "paris-saint-germain-official", name: "Paris Saint-Germain Official", homepageUrl: "https://www.psg.fr/" },
  { id: "30000000-0000-4000-8000-000000000019", slug: "marseille-official", name: "Olympique de Marseille Official", homepageUrl: "https://www.om.fr/" },
];

export function getDiscoverySource(slug: string): DiscoverySource | null {
  return discoverySources.find((source) => source.slug === slug) ?? null;
}

export function getDiscoverySourceById(id: string): DiscoverySource | null {
  return discoverySources.find((source) => source.id === id) ?? null;
}
