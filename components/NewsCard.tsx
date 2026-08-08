import type { News } from "@/types/news";

type NewsCardProps = {
  news: News;
  featured?: boolean;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Shanghai",
  }).format(new Date(value));
}

export function NewsCard({ news, featured = false }: NewsCardProps) {
  const content = (
    <>
      <div className="card-top">
        <span className="league-badge">{news.league || "足球"}</span>
        <span className="card-team">{news.team || "全球动态"}</span>
      </div>

      <div className="card-body">
        <h3>{news.title}</h3>
        <p>{news.summary || "更多报道内容正在整理中。"}</p>
      </div>

      <div className="card-meta">
        <span>{news.source || "0126 Football"} · {formatDate(news.created_at)}</span>
        <span className="read-more">{news.url ? "阅读原文 ↗" : "查看摘要"}</span>
      </div>
    </>
  );

  const className = `news-card${featured ? " featured" : ""}`;

  if (news.url) {
    return (
      <a className={className} href={news.url} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }

  return <article className={className}>{content}</article>;
}

