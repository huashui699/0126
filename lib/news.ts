import { createPublicClient } from "@/lib/supabase";
import type { News } from "@/types/news";

type NewsResult = {
  news: News[];
  mode: "live" | "preview" | "fallback";
};

const previewNews: News[] = [
  {
    id: "preview-1",
    title: "新赛季焦点战即将打响，各队进入最后备战阶段",
    summary: "豪门球队陆续完成季前调整，教练组正围绕核心阵容、年轻球员与新援磨合进行最后部署。",
    content: null,
    source: "0126 Football",
    url: null,
    image: null,
    league: "焦点",
    team: "欧洲足坛",
    created_at: "2026-08-06T08:30:00+08:00",
  },
  {
    id: "preview-2",
    title: "英超球队加快阵容调整，转会窗口进入关键阶段",
    summary: "多支球队继续补强中后场，部分年轻球员有望在新赛季获得更稳定的出场时间。",
    content: null,
    source: "0126 Football",
    url: null,
    image: null,
    league: "英超",
    team: "联赛动态",
    created_at: "2026-08-06T07:15:00+08:00",
  },
  {
    id: "preview-3",
    title: "西甲劲旅公布训练安排，新援融入进展顺利",
    summary: "球队在体能储备之外加强了攻防转换训练，主教练表示阵容竞争将保持开放。",
    content: null,
    source: "0126 Football",
    url: null,
    image: null,
    league: "西甲",
    team: "联赛动态",
    created_at: "2026-08-05T22:40:00+08:00",
  },
  {
    id: "preview-4",
    title: "欧冠新赛季前瞻：赛制与阵容深度仍是主要看点",
    summary: "密集赛程将再次考验各队轮换能力，关键球员的健康状况可能左右小组阶段走势。",
    content: null,
    source: "0126 Football",
    url: null,
    image: null,
    league: "欧冠",
    team: "赛事观察",
    created_at: "2026-08-05T19:20:00+08:00",
  },
  {
    id: "preview-5",
    title: "多名青年球员季前赛表现亮眼，争夺一线队席位",
    summary: "青年梯队球员凭借积极跑动和快速决策赢得关注，部分人将随队参加接下来的正式比赛。",
    content: null,
    source: "0126 Football",
    url: null,
    image: null,
    league: "青训",
    team: "新星观察",
    created_at: "2026-08-05T16:05:00+08:00",
  },
];

export async function getLatestNews(): Promise<NewsResult> {
  const supabase = createPublicClient();

  if (!supabase) {
    return { news: previewNews, mode: "preview" };
  }

  const { data, error } = await supabase
    .from("news")
    .select("id,title,summary,content,source,url,image,league,team,created_at")
    .order("created_at", { ascending: false })
    .limit(24);

  if (error || !data?.length) {
    console.error("Unable to load news from Supabase:", error?.message ?? "No rows returned");
    return { news: previewNews, mode: "fallback" };
  }

  return { news: data as News[], mode: "live" };
}

