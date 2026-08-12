"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { runManualEvaluation } from "@/lib/intelligence/evaluation";
import type { DiscoveryCandidate } from "@/lib/ingestion/discovery-types";
import { teams } from "@/lib/teams";
import type { TrustStatus } from "@/types/news";
import { SourceDiscoveryPanel } from "@/components/SourceDiscoveryPanel";

type WorkMode = "annotation" | "adjudication" | "prediction";
type FidelityChoice = "pass" | "fail" | "";

type HumanAnnotation = {
  annotatorId: string;
  trustStatus: TrustStatus | "";
  teamIds: string[];
  clusterId: string;
  summaryFidelity: FidelityChoice;
  reason: string;
  completed: boolean;
  completedAt: string | null;
};

type SystemPrediction = {
  trustStatus: TrustStatus | "";
  teamIds: string[];
  clusterId: string;
  completed: boolean;
  completedAt: string | null;
};

type EvaluationSample = {
  sampleId: string;
  title: string;
  sourceUrl: string;
  sourceExcerpt: string;
  contentHash: string;
  notes: string;
  annotationA: HumanAnnotation;
  adjudication: HumanAnnotation;
  prediction: SystemPrediction;
};

type StoredWorkspace = {
  version: 1;
  actorId: string;
  samples: EvaluationSample[];
  savedAt: string;
};

const STORAGE_KEY = "0126-football-day41-workspace-v1";

const emptyHumanAnnotation = (): HumanAnnotation => ({
  annotatorId: "",
  trustStatus: "",
  teamIds: [],
  clusterId: "",
  summaryFidelity: "",
  reason: "",
  completed: false,
  completedAt: null,
});

const emptyPrediction = (): SystemPrediction => ({
  trustStatus: "",
  teamIds: [],
  clusterId: "",
  completed: false,
  completedAt: null,
});

function blankSample(index: number): EvaluationSample {
  return {
    sampleId: `day41-${String(index).padStart(4, "0")}`,
    title: "",
    sourceUrl: "",
    sourceExcerpt: "",
    contentHash: "",
    notes: "",
    annotationA: emptyHumanAnnotation(),
    adjudication: emptyHumanAnnotation(),
    prediction: emptyPrediction(),
  };
}

function isHumanComplete(value: HumanAnnotation): boolean {
  return Boolean(
    value.completed
    && value.annotatorId.trim().length >= 2
    && value.trustStatus
    && value.summaryFidelity
    && value.reason.trim().length >= 3,
  );
}

function isPredictionComplete(value: SystemPrediction): boolean {
  return Boolean(value.completed && value.trustStatus);
}

function isScorable(sample: EvaluationSample): boolean {
  return isHumanComplete(sample.annotationA)
    && isHumanComplete(sample.adjudication)
    && sample.annotationA.annotatorId.trim() !== sample.adjudication.annotatorId.trim()
    && isPredictionComplete(sample.prediction);
}

function sampleStatus(sample: EvaluationSample): { label: string; tone: string } {
  if (isScorable(sample)) return { label: "可计分", tone: "ready" };
  if (isHumanComplete(sample.annotationA) && !isHumanComplete(sample.adjudication)) return { label: "待裁决", tone: "review" };
  if (isHumanComplete(sample.adjudication) && !isPredictionComplete(sample.prediction)) return { label: "待预测", tone: "prediction" };
  return { label: "待标注", tone: "draft" };
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function normalizeImportedSample(value: unknown, index: number): EvaluationSample {
  const candidate = value && typeof value === "object" ? value as Partial<EvaluationSample> : {};
  const normalizeHuman = (annotation: Partial<HumanAnnotation> | undefined): HumanAnnotation => ({
    ...emptyHumanAnnotation(),
    ...annotation,
    annotatorId: typeof annotation?.annotatorId === "string" ? annotation.annotatorId : "",
    trustStatus: ["confirmed", "unverified", "rumor"].includes(annotation?.trustStatus ?? "") ? annotation!.trustStatus! : "",
    teamIds: Array.isArray(annotation?.teamIds) ? annotation.teamIds.filter((id): id is string => typeof id === "string") : [],
    clusterId: typeof annotation?.clusterId === "string" ? annotation.clusterId : "",
    summaryFidelity: ["pass", "fail"].includes(annotation?.summaryFidelity ?? "") ? annotation!.summaryFidelity! : "",
    reason: typeof annotation?.reason === "string" ? annotation.reason : "",
    completed: Boolean(annotation?.completed),
    completedAt: typeof annotation?.completedAt === "string" ? annotation.completedAt : null,
  });
  const prediction = candidate.prediction;
  return {
    ...blankSample(index + 1),
    sampleId: typeof candidate.sampleId === "string" && candidate.sampleId.trim() ? candidate.sampleId.trim() : `day41-${String(index + 1).padStart(4, "0")}`,
    title: typeof candidate.title === "string" ? candidate.title : "",
    sourceUrl: typeof candidate.sourceUrl === "string" ? candidate.sourceUrl : "",
    sourceExcerpt: typeof candidate.sourceExcerpt === "string" ? candidate.sourceExcerpt.slice(0, 600) : "",
    contentHash: typeof candidate.contentHash === "string" ? candidate.contentHash : "",
    notes: typeof candidate.notes === "string" ? candidate.notes : "",
    annotationA: normalizeHuman(candidate.annotationA),
    adjudication: normalizeHuman(candidate.adjudication),
    prediction: {
      ...emptyPrediction(),
      ...prediction,
      trustStatus: ["confirmed", "unverified", "rumor"].includes(prediction?.trustStatus ?? "") ? prediction!.trustStatus! : "",
      teamIds: Array.isArray(prediction?.teamIds) ? prediction.teamIds.filter((id): id is string => typeof id === "string") : [],
      clusterId: typeof prediction?.clusterId === "string" ? prediction.clusterId : "",
      completed: Boolean(prediction?.completed),
      completedAt: typeof prediction?.completedAt === "string" ? prediction.completedAt : null,
    },
  };
}

function TeamChecklist({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) {
  return (
    <fieldset className="evaluation-team-fieldset">
      <legend>涉及球队（可多选，允许无球队）</legend>
      <div className="evaluation-team-grid">
        {teams.map((team) => {
          const checked = selected.includes(team.id);
          return (
            <label key={team.id} className={checked ? "selected" : ""}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onChange(checked ? selected.filter((id) => id !== team.id) : [...selected, team.id])}
              />
              <span>{team.shortNameZh}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function EvaluationWorkbench() {
  const [samples, setSamples] = useState<EvaluationSample[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<WorkMode>("annotation");
  const [actorId, setActorId] = useState("");
  const [query, setQuery] = useState("");
  const [statusMessage, setStatusMessage] = useState("正在读取本地工作区…");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const stored = JSON.parse(raw) as Partial<StoredWorkspace>;
          const restored = Array.isArray(stored.samples) ? stored.samples.map(normalizeImportedSample) : [];
          setSamples(restored);
          setActorId(typeof stored.actorId === "string" ? stored.actorId : "");
          setSelectedId(restored[0]?.sampleId ?? null);
          setStatusMessage(restored.length ? `已恢复 ${restored.length} 条本地样本。` : "工作区为空，可以新增或导入样本。");
        } else {
          setStatusMessage("工作区为空，可以新增或导入样本。");
        }
      } catch {
        setStatusMessage("本地工作区无法读取，请导入备份或新建样本。");
      } finally {
        setHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      const workspace: StoredWorkspace = { version: 1, actorId, samples, savedAt: new Date().toISOString() };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    }, 150);
    return () => window.clearTimeout(timer);
  }, [actorId, hydrated, samples]);

  const selected = samples.find((sample) => sample.sampleId === selectedId) ?? null;
  const filteredSamples = samples.filter((sample) => `${sample.sampleId} ${sample.title}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const counts = useMemo(() => ({
    annotation: samples.filter((sample) => isHumanComplete(sample.annotationA)).length,
    adjudication: samples.filter((sample) => isHumanComplete(sample.adjudication)).length,
    prediction: samples.filter((sample) => isPredictionComplete(sample.prediction)).length,
    ready: samples.filter(isScorable).length,
  }), [samples]);

  const scoringSamples = useMemo(() => samples.filter(isScorable), [samples]);
  const report = useMemo(() => runManualEvaluation(scoringSamples.map((sample) => ({
    sampleId: sample.sampleId,
    provenance: "human_annotated_real" as const,
    annotatorIds: [sample.annotationA.annotatorId],
    adjudicatedBy: sample.adjudication.annotatorId,
    referenceTrustStatus: sample.adjudication.trustStatus as TrustStatus,
    predictedTrustStatus: sample.prediction.trustStatus as TrustStatus,
    referenceTeamIds: sample.adjudication.teamIds,
    predictedTeamIds: sample.prediction.teamIds,
    referenceClusterId: sample.adjudication.clusterId.trim() || null,
    predictedClusterId: sample.prediction.clusterId.trim() || null,
    summaryFidelityPassed: sample.adjudication.summaryFidelity === "pass",
  }))), [scoringSamples]);

  function updateSelected(updater: (sample: EvaluationSample) => EvaluationSample) {
    if (!selectedId) return;
    setSamples((current) => current.map((sample) => sample.sampleId === selectedId ? updater(sample) : sample));
    setStatusMessage("修改已自动保存在当前浏览器。");
  }

  function addSample() {
    const next = blankSample(samples.length + 1);
    setSamples((current) => [...current, next]);
    setSelectedId(next.sampleId);
    setMode("annotation");
    setStatusMessage("已新增空白样本。");
  }

  function claimDiscoveredCandidate(candidate: DiscoveryCandidate) {
    const existing = samples.find((sample) => sample.sourceUrl === candidate.url || sample.contentHash === candidate.contentHash);
    if (existing) {
      setSelectedId(existing.sampleId);
      setMode("annotation");
      setStatusMessage(`该候选已经在工作区中：${existing.sampleId}`);
      return;
    }
    let index = samples.length + 1;
    while (samples.some((sample) => sample.sampleId === `day41-${String(index).padStart(4, "0")}`)) index += 1;
    const next: EvaluationSample = {
      ...blankSample(index),
      title: candidate.translatedTitle ?? candidate.title,
      sourceUrl: candidate.url,
      sourceExcerpt: candidate.translatedExcerpt ?? candidate.excerpt,
      contentHash: candidate.contentHash,
      notes: [
        `自动发现自 ${candidate.sourceName} · ${candidate.evidenceOrigin.toUpperCase()} · 发布时间 ${candidate.publishedAt}`,
        `翻译状态：${candidate.translationStatus ?? "not_configured"}`,
        candidate.translatedTitle ? `原文标题：${candidate.title}` : "",
        candidate.translatedExcerpt && candidate.excerpt ? `原文摘要：${candidate.excerpt}` : "",
      ].filter(Boolean).join("\n"),
      prediction: {
        ...emptyPrediction(),
        trustStatus: "unverified",
        teamIds: candidate.predictedTeamIds,
      },
    };
    setSamples((current) => [...current, next]);
    setSelectedId(next.sampleId);
    setMode("annotation");
    setStatusMessage(`已领取 ${next.sampleId}。请先完成 A 独立标注，系统预填答案仅在第 3 阶段查看。`);
  }

  function patchMetadata(patch: Partial<Pick<EvaluationSample, "sampleId" | "title" | "sourceUrl" | "sourceExcerpt" | "contentHash" | "notes">>) {
    updateSelected((sample) => ({ ...sample, ...patch }));
  }

  function patchHuman(stage: "annotationA" | "adjudication", patch: Partial<HumanAnnotation>) {
    updateSelected((sample) => ({
      ...sample,
      [stage]: { ...sample[stage], ...patch, annotatorId: actorId.trim(), completed: false, completedAt: null },
    }));
  }

  function patchPrediction(patch: Partial<SystemPrediction>) {
    updateSelected((sample) => ({ ...sample, prediction: { ...sample.prediction, ...patch, completed: false, completedAt: null } }));
  }

  function completeHuman(stage: "annotationA" | "adjudication") {
    if (!selected) return;
    const value = selected[stage];
    if (actorId.trim().length < 2 || !value.trustStatus || !value.summaryFidelity || value.reason.trim().length < 3) {
      setStatusMessage("请先填写至少 2 字符的人员代号、标签、摘要判断和至少 3 字符的理由。");
      return;
    }
    if (stage === "adjudication" && actorId.trim() === selected.annotationA.annotatorId.trim()) {
      setStatusMessage("裁决人必须与标注员 A 不同。");
      return;
    }
    updateSelected((sample) => ({
      ...sample,
      [stage]: { ...sample[stage], annotatorId: actorId.trim(), completed: true, completedAt: new Date().toISOString() },
    }));
    setStatusMessage(stage === "annotationA" ? "A 标注已完成，可以交给第二人裁决。" : "人工裁决已冻结，可以录入系统预测。");
  }

  function completePrediction() {
    if (!selected?.prediction.trustStatus) {
      setStatusMessage("请先填写系统预测标签。");
      return;
    }
    updateSelected((sample) => ({ ...sample, prediction: { ...sample.prediction, completed: true, completedAt: new Date().toISOString() } }));
    setStatusMessage("系统预测已冻结，该样本已进入 Day 41 计分。");
  }

  async function importWorkspace(file: File) {
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const values = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === "object" && "samples" in parsed && Array.isArray((parsed as { samples: unknown }).samples)
          ? (parsed as { samples: unknown[] }).samples
          : null;
      if (!values) throw new Error("invalid_shape");
      const imported = values.map(normalizeImportedSample);
      const ids = new Set<string>();
      if (imported.some((sample) => ids.size === ids.add(sample.sampleId).size)) throw new Error("duplicate_ids");
      setSamples(imported);
      setSelectedId(imported[0]?.sampleId ?? null);
      setStatusMessage(`已导入 ${imported.length} 条样本并保存到当前浏览器。`);
    } catch (error) {
      setStatusMessage(error instanceof Error && error.message === "duplicate_ids" ? "导入失败：样本 ID 重复。" : "导入失败：请选择标注台导出的 JSON 文件或模板。");
    }
  }

  function renderHumanEditor(stage: "annotationA" | "adjudication") {
    if (!selected) return null;
    const value = selected[stage];
    const isAdjudication = stage === "adjudication";
    return (
      <section className="evaluation-editor-section" aria-labelledby={`${stage}-title`}>
        <div className="evaluation-section-heading">
          <div>
            <span className="eyebrow">{isAdjudication ? "SECOND REVIEW" : "BLIND ANNOTATION"}</span>
            <h2 id={`${stage}-title`}>{isAdjudication ? "B 复核与最终裁决" : "A 独立标注"}</h2>
          </div>
          <span className={`evaluation-completion ${isHumanComplete(value) ? "done" : ""}`}>{isHumanComplete(value) ? `已完成 · ${value.annotatorId}` : "未完成"}</span>
        </div>
        {isAdjudication && isHumanComplete(selected.annotationA) ? (
          <details className="annotation-reference">
            <summary>查看 A 的标注结果</summary>
            <p>标签：{selected.annotationA.trustStatus}；球队：{selected.annotationA.teamIds.map((id) => teams.find((team) => team.id === id)?.shortNameZh ?? id).join("、") || "无"}；事件簇：{selected.annotationA.clusterId || "无"}</p>
            <p>理由：{selected.annotationA.reason}</p>
          </details>
        ) : null}
        <div className="evaluation-form-grid">
          <label>可信度标签
            <select value={value.trustStatus} onChange={(event) => patchHuman(stage, { trustStatus: event.target.value as TrustStatus | "" })}>
              <option value="">请选择</option><option value="confirmed">绿色 · 官方确认</option><option value="unverified">蓝色 · 待核实</option><option value="rumor">红色 · 传闻/低可信</option>
            </select>
          </label>
          <label>人工事件簇 ID（无则留空）
            <input value={value.clusterId} placeholder="例如 event-001" onChange={(event) => patchHuman(stage, { clusterId: event.target.value })} />
          </label>
          <label>摘要忠实度
            <select value={value.summaryFidelity} onChange={(event) => patchHuman(stage, { summaryFidelity: event.target.value as FidelityChoice })}>
              <option value="">请选择</option><option value="pass">通过：关键事实完整</option><option value="fail">失败：存在事实损失或虚构</option>
            </select>
          </label>
        </div>
        <TeamChecklist selected={value.teamIds} onChange={(teamIds) => patchHuman(stage, { teamIds })} />
        <label className="evaluation-wide-label">判断理由
          <textarea rows={3} value={value.reason} maxLength={500} placeholder="写明来源身份、证据链、冲突或摘要问题。" onChange={(event) => patchHuman(stage, { reason: event.target.value })} />
        </label>
        <button className="primary-action" type="button" onClick={() => completeHuman(stage)}>{isAdjudication ? "冻结最终裁决" : "完成 A 标注"}</button>
      </section>
    );
  }

  function renderPredictionEditor() {
    if (!selected) return null;
    const value = selected.prediction;
    return (
      <section className="evaluation-editor-section" aria-labelledby="prediction-title">
        <div className="evaluation-section-heading"><div><span className="eyebrow">SYSTEM OUTPUT</span><h2 id="prediction-title">录入系统预测</h2></div><span className={`evaluation-completion ${isPredictionComplete(value) ? "done" : ""}`}>{isPredictionComplete(value) ? "已完成" : "未完成"}</span></div>
        <p className="evaluation-help">人工裁决冻结后再录入，避免系统答案影响人工判断。</p>
        <div className="evaluation-form-grid">
          <label>系统可信度标签
            <select value={value.trustStatus} onChange={(event) => patchPrediction({ trustStatus: event.target.value as TrustStatus | "" })}>
              <option value="">请选择</option><option value="confirmed">绿色 · 官方确认</option><option value="unverified">蓝色 · 待核实</option><option value="rumor">红色 · 传闻/低可信</option>
            </select>
          </label>
          <label>系统事件簇 ID（无则留空）
            <input value={value.clusterId} placeholder="例如 cluster-018" onChange={(event) => patchPrediction({ clusterId: event.target.value })} />
          </label>
        </div>
        <TeamChecklist selected={value.teamIds} onChange={(teamIds) => patchPrediction({ teamIds })} />
        <button className="primary-action" type="button" onClick={completePrediction}>冻结系统预测并计分</button>
      </section>
    );
  }

  return (
    <section className="evaluation-workbench" aria-labelledby="evaluation-title">
      <header className="evaluation-hero">
        <div><span className="eyebrow">DAY 41 · HUMAN EVALUATION</span><h1 id="evaluation-title">人工标注与发布门禁</h1><p>数据只保存在当前浏览器。A 独立标注，B 复核裁决，最后录入系统预测并自动计分。</p></div>
        <div className="evaluation-local-badge"><strong>LOCAL ONLY</strong><span>未写入 Supabase</span></div>
      </header>

      <div className="evaluation-toolbar">
        <label>当前人员代号<input value={actorId} placeholder="例如 annotator-a" onChange={(event) => setActorId(event.target.value)} /></label>
        <div className="evaluation-toolbar-actions">
          <button type="button" onClick={addSample}>＋ 新增样本</button>
          <button type="button" onClick={() => downloadJson("day41-annotation-template.json", { version: 1, actorId: "", samples: [blankSample(1)] })}>下载模板</button>
          <button type="button" onClick={() => importRef.current?.click()}>导入 JSON</button>
          <button type="button" disabled={!samples.length} onClick={() => downloadJson("day41-workspace-backup.json", { version: 1, actorId, samples, savedAt: new Date().toISOString() })}>导出工作区</button>
          <input ref={importRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importWorkspace(file); event.target.value = ""; }} />
        </div>
      </div>
      <p className="evaluation-status" role="status">{statusMessage}</p>

      <SourceDiscoveryPanel onClaim={claimDiscoveredCandidate} />

      <div className="evaluation-metrics" aria-label="标注进度">
        <article><span>总样本</span><strong>{samples.length}</strong><small>目标 300</small></article>
        <article><span>A 已标注</span><strong>{counts.annotation}</strong><small>{samples.length ? Math.round(counts.annotation / samples.length * 100) : 0}%</small></article>
        <article><span>B 已裁决</span><strong>{counts.adjudication}</strong><small>{samples.length ? Math.round(counts.adjudication / samples.length * 100) : 0}%</small></article>
        <article><span>可计分</span><strong>{counts.ready}</strong><small>{counts.prediction} 条有预测</small></article>
      </div>

      <div className="evaluation-layout">
        <aside className="evaluation-sample-panel">
          <div className="evaluation-panel-heading"><h2>样本队列</h2><span>{filteredSamples.length}/{samples.length}</span></div>
          <input aria-label="搜索样本" value={query} placeholder="搜索编号或标题" onChange={(event) => setQuery(event.target.value)} />
          <div className="evaluation-sample-list">
            {filteredSamples.map((sample) => {
              const state = sampleStatus(sample);
              return <button type="button" key={sample.sampleId} className={sample.sampleId === selectedId ? "selected" : ""} onClick={() => setSelectedId(sample.sampleId)}><span><strong>{sample.sampleId}</strong><small>{sample.title || "未填写标题"}</small></span><em className={state.tone}>{state.label}</em></button>;
            })}
            {!filteredSamples.length ? <p>暂无样本。点击“新增样本”开始。</p> : null}
          </div>
        </aside>

        <div className="evaluation-main-panel">
          {selected ? (
            <>
              <section className="evaluation-source-card" aria-labelledby="source-title">
                <div className="evaluation-section-heading"><div><span className="eyebrow">SOURCE EVIDENCE</span><h2 id="source-title">样本与来源</h2></div><button className={`danger-text ${pendingDeleteId === selected.sampleId ? "armed" : ""}`} type="button" onClick={() => {
                  if (pendingDeleteId !== selected.sampleId) {
                    setPendingDeleteId(selected.sampleId);
                    setStatusMessage(`再次点击“确认删除”才会删除 ${selected.sampleId}。`);
                    return;
                  }
                  const remaining = samples.filter((sample) => sample.sampleId !== selected.sampleId);
                  setSamples(remaining);
                  setSelectedId(remaining[0]?.sampleId ?? null);
                  setPendingDeleteId(null);
                  setStatusMessage("样本已从当前浏览器工作区删除。");
                }}>{pendingDeleteId === selected.sampleId ? "确认删除" : "删除样本"}</button></div>
                <div className="evaluation-form-grid">
                  <label>样本编号<input value={selected.sampleId} readOnly title="样本编号由新增或导入时确定，避免中途产生重复编号。" /></label>
                  <label>内容哈希（推荐）<input value={selected.contentHash} placeholder="用于证明样本冻结" onChange={(event) => patchMetadata({ contentHash: event.target.value })} /></label>
                  <label className="span-two">标题<input value={selected.title} onChange={(event) => patchMetadata({ title: event.target.value })} /></label>
                  <label className="span-two">来源 URL<input type="url" value={selected.sourceUrl} placeholder="https://…" onChange={(event) => patchMetadata({ sourceUrl: event.target.value })} /></label>
                </div>
                <label className="evaluation-wide-label">必要短摘录（最多 600 字，不粘贴未授权全文）<textarea rows={4} maxLength={600} value={selected.sourceExcerpt} onChange={(event) => patchMetadata({ sourceExcerpt: event.target.value })} /></label>
                <label className="evaluation-wide-label">备注<textarea rows={2} value={selected.notes} onChange={(event) => patchMetadata({ notes: event.target.value })} /></label>
                {selected.sourceUrl ? <a className="evaluation-source-link" href={selected.sourceUrl} target="_blank" rel="noreferrer">打开原始来源 ↗</a> : null}
              </section>

              <div className="evaluation-mode-tabs" role="tablist" aria-label="标注阶段">
                <button role="tab" aria-selected={mode === "annotation"} className={mode === "annotation" ? "active" : ""} onClick={() => setMode("annotation")}>1. A 独立标注</button>
                <button role="tab" aria-selected={mode === "adjudication"} className={mode === "adjudication" ? "active" : ""} onClick={() => setMode("adjudication")}>2. B 复核裁决</button>
                <button role="tab" aria-selected={mode === "prediction"} className={mode === "prediction" ? "active" : ""} onClick={() => setMode("prediction")}>3. 系统预测</button>
              </div>
              {mode === "annotation" ? renderHumanEditor("annotationA") : null}
              {mode === "adjudication" ? renderHumanEditor("adjudication") : null}
              {mode === "prediction" ? renderPredictionEditor() : null}
            </>
          ) : <section className="evaluation-empty"><strong>还没有选中的样本</strong><p>新增一个样本，或导入下载的 JSON 模板。</p><button className="primary-action" type="button" onClick={addSample}>新增第一条样本</button></section>}
        </div>
      </div>

      <section className={`evaluation-report ${report.meetsDay41Gate ? "pass" : "blocked"}`} aria-labelledby="report-title">
        <div className="evaluation-section-heading"><div><span className="eyebrow">RELEASE GATE</span><h2 id="report-title">Day 41 自动计分</h2></div><strong>{report.meetsDay41Gate ? "PASS" : "BLOCKED"}</strong></div>
        <div className="evaluation-report-grid">
          <article><span>计分样本</span><strong>{report.sampleCount}/300</strong></article>
          <article><span>标签一致率</span><strong>{(report.labelAgreement * 100).toFixed(1)}%</strong></article>
          <article><span>绿色 precision</span><strong>{report.greenPrecision === null ? "—" : `${(report.greenPrecision * 100).toFixed(1)}%`}</strong></article>
          <article><span>实体 precision</span><strong>{report.entityPrecision === null ? "—" : `${(report.entityPrecision * 100).toFixed(1)}%`}</strong></article>
          <article><span>实体 recall</span><strong>{report.entityRecall === null ? "—" : `${(report.entityRecall * 100).toFixed(1)}%`}</strong></article>
          <article><span>聚类 precision</span><strong>{report.clusterPrecision === null ? "—" : `${(report.clusterPrecision * 100).toFixed(1)}%`}</strong></article>
          <article><span>摘要忠实率</span><strong>{(report.summaryFidelityPassRate * 100).toFixed(1)}%</strong></article>
        </div>
        {report.blockers.length ? <ul>{report.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}</ul> : <p>全部 Day 41 硬门禁已通过，可以进入下一发布门禁。</p>}
        <button type="button" disabled={!scoringSamples.length} onClick={() => downloadJson("day41-evaluation-report.json", { generatedAt: new Date().toISOString(), report, samples: scoringSamples })}>导出评测报告</button>
      </section>
    </section>
  );
}
