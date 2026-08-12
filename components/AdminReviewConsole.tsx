"use client";

import { useState } from "react";

type QueueItem = { id: string; title: string; trust_status: string; trust_reason: string; hidden_at: string | null };
type AuditAction = { id: string; action_type: string; action_status: string; reason: string; actor_ref: string; created_at: string };

export function AdminReviewConsole() {
  const [secret, setSecret] = useState("");
  const [actorRef, setActorRef] = useState("");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [actions, setActions] = useState<AuditAction[]>([]);
  const [clusterId, setClusterId] = useState("");
  const [mergeIntoClusterId, setMergeIntoClusterId] = useState("");
  const [status, setStatus] = useState("输入管理员密钥与操作者标识后加载队列。密钥只保存在当前页面内存中。");

  async function load() {
    setStatus("正在加载…");
    const response = await fetch("/api/admin/reviews", { headers: { "x-admin-secret": secret } });
    const body = await response.json();
    if (!response.ok) return setStatus(`加载失败：${body.error ?? response.status}`);
    setQueue(body.queue ?? []);
    setActions(body.actions ?? []);
    setStatus(`已加载 ${body.queue?.length ?? 0} 条待复核信息。`);
  }

  async function apply(action: string, payload: Record<string, string>) {
    const reason = window.prompt("请输入操作原因（至少 3 个字符）");
    if (!reason) return;
    setStatus("正在提交…");
    const response = await fetch("/api/admin/reviews", {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-secret": secret },
      body: JSON.stringify({ action, reason, actorRef, ...payload }),
    });
    const body = await response.json();
    if (!response.ok) return setStatus(`操作失败：${body.error ?? response.status}`);
    setStatus(`操作已记录：${body.actionId}`);
    await load();
  }

  return (
    <section className="admin-console" aria-labelledby="admin-console-title">
      <header><span className="eyebrow">REVIEW OPERATIONS</span><h1 id="admin-console-title">可信度复核台</h1><p>管理员 API 强制鉴权；所有修改与撤销都会追加审计记录。</p></header>
      <div className="admin-credentials">
        <label>管理员密钥<input type="password" value={secret} autoComplete="off" onChange={(event) => setSecret(event.target.value)} /></label>
        <label>操作者标识<input value={actorRef} placeholder="姓名或值班编号" onChange={(event) => setActorRef(event.target.value)} /></label>
        <button type="button" disabled={!secret || actorRef.trim().length < 3} onClick={load}>加载复核队列</button>
      </div>
      <p role="status">{status}</p>
      <section className="admin-cluster-merge" aria-labelledby="cluster-merge-title">
        <h2 id="cluster-merge-title">合并事件簇</h2>
        <label>来源事件簇 ID<input value={clusterId} onChange={(event) => setClusterId(event.target.value)} /></label>
        <label>目标事件簇 ID<input value={mergeIntoClusterId} onChange={(event) => setMergeIntoClusterId(event.target.value)} /></label>
        <button type="button" disabled={!clusterId || !mergeIntoClusterId || clusterId === mergeIntoClusterId} onClick={() => apply("merge_cluster", { clusterId, mergeIntoClusterId })}>合并并记录审计</button>
      </section>
      <div className="admin-review-grid">
        <section><h2>待复核</h2>{queue.length ? queue.map((item) => (
          <article key={item.id} className="admin-review-card">
            <small>{item.trust_status}</small><h3>{item.title}</h3><p>{item.trust_reason}</p>
            <div>
              <button type="button" onClick={() => apply("set_trust", { newsId: item.id, newTrust: "confirmed" })}>改为绿色</button>
              <button type="button" onClick={() => apply("set_trust", { newsId: item.id, newTrust: "unverified" })}>改为蓝色</button>
              <button type="button" onClick={() => apply("set_trust", { newsId: item.id, newTrust: "rumor" })}>改为红色</button>
              <button type="button" onClick={() => apply(item.hidden_at ? "unhide" : "hide", { newsId: item.id })}>{item.hidden_at ? "恢复展示" : "隐藏"}</button>
            </div>
          </article>
        )) : <p>当前没有待复核记录。</p>}</section>
        <section><h2>最近审计</h2>{actions.length ? <ol className="admin-audit-list">{actions.map((item) => (
          <li key={item.id}><strong>{item.action_type} · {item.action_status}</strong><p>{item.reason}</p><small>{item.actor_ref} · {new Date(item.created_at).toLocaleString("zh-CN")}</small>{item.action_status === "applied" && item.action_type !== "revert" ? <button type="button" onClick={() => apply("revert", { actionId: item.id })}>撤销</button> : null}</li>
        ))}</ol> : <p>暂无审计记录。</p>}</section>
      </div>
    </section>
  );
}
