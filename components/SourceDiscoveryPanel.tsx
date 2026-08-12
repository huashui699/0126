"use client";

import { useEffect, useState } from "react";

import type { DiscoveryCandidate } from "@/lib/ingestion/discovery-types";

type SourceOption = { slug: string; name: string; homepageUrl: string };

export function SourceDiscoveryPanel({ onClaim }: { onClaim: (candidate: DiscoveryCandidate) => void }) {
  const [sources, setSources] = useState<SourceOption[]>([]);
  const [sourceSlug, setSourceSlug] = useState("premier-league-official");
  const [candidates, setCandidates] = useState<DiscoveryCandidate[]>([]);
  const [claimedIds, setClaimedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("选择获准官网，然后自动发现近期候选文章。");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/evaluation/discovery", { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json() as { sources?: SourceOption[] };
        if (!response.ok || !Array.isArray(body.sources)) throw new Error("source_catalog_failed");
        setSources(body.sources);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus("来源目录加载失败，请刷新页面重试。");
      });
    return () => controller.abort();
  }, []);

  async function discover() {
    setLoading(true);
    setCandidates([]);
    setStatus("正在读取官网 robots、Sitemap 或 RSS，并提取公开元数据…");
    try {
      const response = await fetch(`/api/evaluation/discovery?source=${encodeURIComponent(sourceSlug)}`);
      const body = await response.json() as { candidates?: DiscoveryCandidate[]; detail?: string };
      if (!response.ok || !Array.isArray(body.candidates)) throw new Error(body.detail ?? "discovery_failed");
      setCandidates(body.candidates);
      const translatedCount = body.candidates.filter((candidate) => candidate.translationStatus === "translated" || candidate.translationStatus === "source_chinese").length;
      setStatus(body.candidates.length
        ? translatedCount === body.candidates.length
          ? `已发现 ${body.candidates.length} 条候选，中文处理已完成。领取后才会加入本地标注工作区。`
          : `已发现 ${body.candidates.length} 条候选，其中 ${translatedCount} 条已有中文；其余保留原文等待翻译配置或重试。`
        : "该官网暂未返回可识别的新文章，可以切换其他来源。");
    } catch (error) {
      setStatus(`发现失败：${error instanceof Error ? error.message : "网络或上游格式异常"}`);
    } finally {
      setLoading(false);
    }
  }

  function claim(candidate: DiscoveryCandidate) {
    onClaim(candidate);
    setClaimedIds((current) => current.includes(candidate.id) ? current : [...current, candidate.id]);
  }

  return (
    <section className="source-discovery" aria-labelledby="source-discovery-title">
      <div className="source-discovery-heading">
        <div>
          <span className="eyebrow">AUTOMATED SOURCE DISCOVERY</span>
          <h2 id="source-discovery-title">自动获取候选新闻</h2>
          <p>只读取白名单官网公开的 URL、标题、时间和短描述；不保存整篇正文。</p>
        </div>
        <span className="source-discovery-safety">19 个白名单来源</span>
      </div>
      <div className="source-discovery-controls">
        <label>
          官方来源
          <select value={sourceSlug} onChange={(event) => setSourceSlug(event.target.value)}>
            {sources.map((source) => <option key={source.slug} value={source.slug}>{source.name}</option>)}
          </select>
        </label>
        <button type="button" disabled={loading || !sources.length} onClick={() => void discover()}>
          {loading ? "正在发现…" : "自动发现最新候选"}
        </button>
      </div>
      <p className="source-discovery-status" role="status">{status}</p>
      {candidates.length ? (
        <div className="source-discovery-results">
          {candidates.map((candidate) => {
            const claimed = claimedIds.includes(candidate.id);
            const hasTranslation = candidate.translationStatus === "translated" && candidate.translatedTitle;
            const translationLabel = candidate.translationStatus === "translated" || candidate.translationStatus === "source_chinese"
              ? "中文可用"
              : candidate.translationStatus === "rejected"
                ? "译文校验未通过"
                : candidate.translationStatus === "failed"
                  ? "翻译失败"
                  : "待配置翻译";
            return (
              <article key={candidate.id}>
                <div>
                  <span>{candidate.sourceName} · {candidate.evidenceOrigin.toUpperCase()}</span>
                  <time dateTime={candidate.publishedAt}>{candidate.publishedAt.startsWith("1970-") ? "发布时间待核对" : new Date(candidate.publishedAt).toLocaleString("zh-CN")}</time>
                </div>
                <span className={`translation-badge translation-${candidate.translationStatus ?? "not_configured"}`}>{translationLabel}</span>
                <h3>{candidate.translatedTitle ?? candidate.title}</h3>
                {hasTranslation ? <p className="source-original-title">原文标题：{candidate.title}</p> : null}
                {candidate.translatedExcerpt || candidate.excerpt
                  ? <p>{candidate.translatedExcerpt ?? candidate.excerpt}</p>
                  : <p className="muted">官网未提供短描述，标注时请打开原始来源核对。</p>}
                {hasTranslation && candidate.excerpt ? (
                  <details className="source-original-copy">
                    <summary>查看原文摘要</summary>
                    <p>{candidate.excerpt}</p>
                  </details>
                ) : null}
                <footer>
                  <a href={candidate.url} target="_blank" rel="noreferrer">查看原始来源 ↗</a>
                  <button type="button" disabled={claimed} onClick={() => claim(candidate)}>{claimed ? "已加入工作区" : "领取并加入标注台"}</button>
                </footer>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
