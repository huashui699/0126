import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { TrustBadge } from "@/components/TrustBadge";
import { getCalendarNewsById, safeExternalUrl } from "@/lib/calendar-news";
import { formatShanghaiDateTime } from "@/lib/calendar-date";

const informationLabels = {
  club_announcement: "俱乐部公告",
  match: "比赛",
  player: "球员动态",
  transfer: "转会",
  coaching: "教练 / 训练",
  social: "官方活动",
  media: "媒体报道",
} as const;

type NewsDetailProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
};

function safeReturnPath(value: string | string[] | undefined): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate?.startsWith("/calendar") ? candidate : "/calendar";
}

export async function generateMetadata({ params }: Pick<NewsDetailProps, "params">): Promise<Metadata> {
  const { id } = await params;
  const item = await getCalendarNewsById(id);
  return { title: item ? `${item.title}｜0126 Football` : "情报未找到｜0126 Football" };
}

export default async function NewsDetailPage({ params, searchParams }: NewsDetailProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const item = await getCalendarNewsById(id);
  if (!item) notFound();

  const returnPath = safeReturnPath(query.returnTo);
  const externalUrl = safeExternalUrl(item.url);

  return (
    <div className="site-shell">
      <Header />
      <main className="detail-page page-width">
        <Link className="detail-back" href={returnPath}>← 返回原日期和筛选</Link>

        <article className="detail-article">
          <header className="detail-header">
            <div className="detail-kicker">
              <TrustBadge status={item.trust_status} />
              <span>{informationLabels[item.info_type]}</span>
              <span>{item.team}</span>
            </div>
            <h1>{item.title}</h1>
            <p className="detail-summary">{item.summary}</p>
            <dl className="detail-metadata">
              <div><dt>来源</dt><dd>{item.source ?? "0126 Football"}</dd></div>
              <div><dt>发布时间</dt><dd><time dateTime={item.published_at}>{formatShanghaiDateTime(item.published_at)}</time></dd></div>
              {item.event_at ? <div><dt>事件时间</dt><dd><time dateTime={item.event_at}>{formatShanghaiDateTime(item.event_at)}</time></dd></div> : null}
            </dl>
          </header>

          <div className="detail-layout">
            <section className="detail-content" aria-labelledby="summary-title">
              <h2 id="summary-title">中文摘要</h2>
              <p>{item.content ?? item.summary ?? "内容正在整理中。"}</p>
              {externalUrl ? (
                <a className="source-link" href={externalUrl.toString()} target="_blank" rel="noopener noreferrer">
                  查看原文 · {externalUrl.hostname} ↗
                </a>
              ) : <div className="source-unavailable">原文链接暂不可用</div>}
            </section>

            <aside className="trust-explanation" aria-labelledby="trust-title">
              <span className="section-kicker">WHY THIS LABEL</span>
              <h2 id="trust-title">为什么这样标记</h2>
              <p>{item.trust_reason}</p>
              <small>标签表示当前证据支持程度，不是对事实真假的最终裁决。</small>
            </aside>
          </div>

          <section className="status-history" aria-labelledby="history-title">
            <div>
              <span className="section-kicker">STATUS HISTORY</span>
              <h2 id="history-title">状态历史</h2>
            </div>
            <div className="history-empty">
              <strong>暂无状态变更</strong>
              <p>完整审计历史将在 Day 37 实现。本页不会生成或暗示不存在的历史记录。</p>
            </div>
          </section>
        </article>
      </main>
    </div>
  );
}

