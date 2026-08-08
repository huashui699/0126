export type League = {
  id: string;
  nameZh: string;
  nameEn: string;
  order: number;
};

export type Team = {
  id: string;
  leagueId: string;
  slug: string;
  nameZh: string;
  nameEn: string;
  shortNameZh: string;
  shortNameEn: string;
  aliases: string[];
};

export const leagues: League[] = [
  { id: "10000000-0000-4000-8000-000000000001", nameZh: "英超", nameEn: "Premier League", order: 1 },
  { id: "10000000-0000-4000-8000-000000000002", nameZh: "西甲", nameEn: "La Liga", order: 2 },
  { id: "10000000-0000-4000-8000-000000000003", nameZh: "德甲", nameEn: "Bundesliga", order: 3 },
  { id: "10000000-0000-4000-8000-000000000004", nameZh: "意甲", nameEn: "Serie A", order: 4 },
  { id: "10000000-0000-4000-8000-000000000005", nameZh: "法甲", nameEn: "Ligue 1", order: 5 },
];

export const teams: Team[] = [
  { id: "20000000-0000-4000-8000-000000000001", leagueId: leagues[0].id, slug: "manchester-united", nameZh: "曼彻斯特联", nameEn: "Manchester United", shortNameZh: "曼联", shortNameEn: "Man Utd", aliases: ["Manchester United FC", "United", "红魔"] },
  { id: "20000000-0000-4000-8000-000000000002", leagueId: leagues[0].id, slug: "liverpool", nameZh: "利物浦", nameEn: "Liverpool", shortNameZh: "利物浦", shortNameEn: "Liverpool", aliases: ["Liverpool FC", "Reds", "红军"] },
  { id: "20000000-0000-4000-8000-000000000003", leagueId: leagues[0].id, slug: "chelsea", nameZh: "切尔西", nameEn: "Chelsea", shortNameZh: "切尔西", shortNameEn: "Chelsea", aliases: ["Chelsea FC", "Blues", "蓝军"] },
  { id: "20000000-0000-4000-8000-000000000004", leagueId: leagues[0].id, slug: "manchester-city", nameZh: "曼彻斯特城", nameEn: "Manchester City", shortNameZh: "曼城", shortNameEn: "Man City", aliases: ["Manchester City FC", "City", "蓝月亮"] },
  { id: "20000000-0000-4000-8000-000000000005", leagueId: leagues[0].id, slug: "tottenham-hotspur", nameZh: "托特纳姆热刺", nameEn: "Tottenham Hotspur", shortNameZh: "热刺", shortNameEn: "Spurs", aliases: ["Tottenham", "Tottenham Hotspur FC"] },
  { id: "20000000-0000-4000-8000-000000000006", leagueId: leagues[0].id, slug: "arsenal", nameZh: "阿森纳", nameEn: "Arsenal", shortNameZh: "阿森纳", shortNameEn: "Arsenal", aliases: ["Arsenal FC", "Gunners", "枪手"] },
  { id: "20000000-0000-4000-8000-000000000007", leagueId: leagues[1].id, slug: "real-madrid", nameZh: "皇家马德里", nameEn: "Real Madrid", shortNameZh: "皇马", shortNameEn: "Real Madrid", aliases: ["Real Madrid CF", "Los Blancos"] },
  { id: "20000000-0000-4000-8000-000000000008", leagueId: leagues[1].id, slug: "barcelona", nameZh: "巴塞罗那", nameEn: "Barcelona", shortNameZh: "巴萨", shortNameEn: "Barça", aliases: ["FC Barcelona", "Barca", "Barça"] },
  { id: "20000000-0000-4000-8000-000000000009", leagueId: leagues[2].id, slug: "bayern-munich", nameZh: "拜仁慕尼黑", nameEn: "Bayern Munich", shortNameZh: "拜仁", shortNameEn: "Bayern", aliases: ["FC Bayern München", "Bayern München"] },
  { id: "20000000-0000-4000-8000-000000000010", leagueId: leagues[2].id, slug: "borussia-dortmund", nameZh: "多特蒙德", nameEn: "Borussia Dortmund", shortNameZh: "多特", shortNameEn: "Dortmund", aliases: ["BVB", "Dortmund"] },
  { id: "20000000-0000-4000-8000-000000000011", leagueId: leagues[3].id, slug: "juventus", nameZh: "尤文图斯", nameEn: "Juventus", shortNameZh: "尤文", shortNameEn: "Juve", aliases: ["Juventus FC", "Juve"] },
  { id: "20000000-0000-4000-8000-000000000012", leagueId: leagues[3].id, slug: "inter-milan", nameZh: "国际米兰", nameEn: "Inter Milan", shortNameZh: "国米", shortNameEn: "Inter", aliases: ["Internazionale", "Inter"] },
  { id: "20000000-0000-4000-8000-000000000013", leagueId: leagues[4].id, slug: "paris-saint-germain", nameZh: "巴黎圣日耳曼", nameEn: "Paris Saint-Germain", shortNameZh: "巴黎", shortNameEn: "PSG", aliases: ["PSG", "Paris SG"] },
  { id: "20000000-0000-4000-8000-000000000014", leagueId: leagues[4].id, slug: "marseille", nameZh: "马赛", nameEn: "Olympique de Marseille", shortNameZh: "马赛", shortNameEn: "Marseille", aliases: ["OM", "Olympique Marseille"] },
];

export function searchTeams(query: string): Team[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return teams;

  return teams.filter((team) =>
    [team.nameZh, team.nameEn, team.shortNameZh, team.shortNameEn, ...team.aliases]
      .some((name) => name.toLocaleLowerCase().includes(normalized)),
  );
}

