"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  formatShanghaiDate,
  formatShanghaiDateTime,
  monthGrid,
  parseDate,
  shiftDate,
  shiftMonth,
  toShanghaiDateKey,
} from "@/lib/calendar-date";
import { writeGuestFollows } from "@/lib/guest-follows";
import { leagues, teams } from "@/lib/teams";
import { TrustBadge } from "@/components/TrustBadge";
import type { CalendarNews, InformationType, TrustStatus } from "@/types/news";

type CalendarViewProps = {
  initialItems: CalendarNews[];
  month: string;
  dataMode: "live" | "preview" | "fallback";
};

const validTeamIds = new Set(teams.map((team) => team.id));
const teamById = new Map(teams.map((team) => [team.id, team]));
const weekdays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
const MAX_TEAMS = 5;
const FOLLOWS_STORAGE_KEY = "0126football:guest-follows";
const FOLLOWS_CHANGED_EVENT = "0126football:follows-changed";

const informationLabels: Record<InformationType, string> = {
  club_announcement: "俱乐部公告",
  match: "比赛",
  player: "球员动态",
  transfer: "转会",
  coaching: "教练 / 训练",
  social: "官方活动",
  media: "媒体报道",
};

const levelLabels: Record<TrustStatus, string> = {
  confirmed: "绿色 · 官方确认",
  unverified: "蓝色 · 有来源待核实",
  rumor: "红色 · 传闻",
};

function displayDate(item: CalendarNews): string {
  return toShanghaiDateKey(item.event_at ?? item.published_at);
}

function subscribeToFollows(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(FOLLOWS_CHANGED_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(FOLLOWS_CHANGED_EVENT, callback);
  };
}

function getFollowsSnapshot() {
  return window.localStorage.getItem(FOLLOWS_STORAGE_KEY);
}

function getServerFollowsSnapshot() {
  return null;
}

function parseFollowsSnapshot(snapshot: string | null): string[] {
  if (!snapshot) return [];
  try {
    const parsed = JSON.parse(snapshot) as { version?: number; teamIds?: unknown[] };
    if (parsed.version !== 1 || !Array.isArray(parsed.teamIds)) return [];
    return Array.from(new Set(parsed.teamIds.filter((id): id is string => typeof id === "string" && validTeamIds.has(id)))).slice(0, MAX_TEAMS);
  } catch {
    return [];
  }
}

export function CalendarView({ initialItems, month, dataMode }: CalendarViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dayPanelRef = useRef<HTMLElement>(null);
  const [draftTeamIds, setDraftTeamIds] = useState<string[]>([]);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const followsSnapshot = useSyncExternalStore(subscribeToFollows, getFollowsSnapshot, getServerFollowsSnapshot);
  const selectedTeamIds = useMemo(
    () => parseFollowsSnapshot(followsSnapshot),
    [followsSnapshot],
  );

  useEffect(() => {
    if (!teamDialogOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTeamDialogOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("modal-open");
    };
  }, [teamDialogOpen]);

  const selectedDate = parseDate(searchParams.get("date") ?? undefined, month);
  const activeTeamIds = selectedTeamIds.length ? new Set(selectedTeamIds) : validTeamIds;
  const filteredItems = initialItems.filter((item) => item.team_ids.some((id) => activeTeamIds.has(id)));
  const byDate = new Map<string, CalendarNews[]>();

  for (const item of filteredItems) {
    const key = displayDate(item);
    byDate.set(key, [...(byDate.get(key) ?? []), item]);
  }

  function updateParams(changes: Record<string, string | null>, serverNavigation = false) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const query = params.toString();
    const destination = query ? `${pathname}?${query}` : pathname;
    if (serverNavigation) router.push(destination, { scroll: false });
    else window.history.pushState(null, "", destination);
  }

  function selectDay(date: string, shouldScroll = true) {
    const nextMonth = date.slice(0, 7);
    updateParams({ month: nextMonth, date }, nextMonth !== month);
    if (shouldScroll) requestAnimationFrame(() => dayPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function selectMonth(nextMonth: string) {
    updateParams({ month: nextMonth, date: `${nextMonth}-01` }, true);
  }

  function openTeamDialog() {
    setDraftTeamIds(selectedTeamIds);
    setTeamDialogOpen(true);
  }

  function toggleDraftTeam(teamId: string) {
    setDraftTeamIds((current) => {
      if (current.includes(teamId)) return current.filter((id) => id !== teamId);
      if (current.length >= MAX_TEAMS) return current;
      return [...current, teamId];
    });
  }

  function applyTeamSelection() {
    writeGuestFollows(draftTeamIds);
    window.dispatchEvent(new Event(FOLLOWS_CHANGED_EVENT));
    setTeamDialogOpen(false);
  }

  const currentPath = `${pathname}${searchParams.size ? `?${searchParams.toString()}` : ""}`;
  const selectedItems = byDate.get(selectedDate) ?? [];
  const gridDays = monthGrid(month);
  const selectedTeams = selectedTeamIds.flatMap((id) => teamById.get(id) ? [teamById.get(id)!] : []);

  return (
    <div className="calendar-shell page-width">
      <section className="calendar-heading" aria-labelledby="calendar-title">
        <div className="calendar-title-row">
          <button className="team-selector-button" type="button" onClick={openTeamDialog} aria-haspopup="dialog">
            <span className="team-selector-icon" aria-hidden>⚽</span>
            <span><small>关注球队</small><strong>{selectedTeams.length ? selectedTeams.map((team) => team.shortNameZh).join("、") : "全部球队"}</strong></span>
            <span aria-hidden>⌄</span>
          </button>
          <div>
            <span className="eyebrow">FOOTBALL INTELLIGENCE</span>
            <h1 id="calendar-title">足球情报日历</h1>
            <p>每天的重要消息，一眼看清可信度与数量</p>
          </div>
        </div>
      </section>

      {dataMode !== "live" ? (
        <div className="calendar-notice" role="status">当前展示验收样例数据，仅用于验证产品流程。</div>
      ) : null}

      <section className="calendar-toolbar" aria-label="月份选择">
        <div className="month-nav">
          <button aria-label="上个月" onClick={() => selectMonth(shiftMonth(month, -1))}>←</button>
          <strong>{month.replace("-", " 年 ")} 月</strong>
          <button aria-label="下个月" onClick={() => selectMonth(shiftMonth(month, 1))}>→</button>
        </div>
        <div className="count-legend" aria-label="信息级别说明">
          <span><i className="count-confirmed" />官方确认</span>
          <span><i className="count-unverified" />待核实</span>
          <span><i className="count-rumor" />传闻</span>
        </div>
      </section>

      <section className="month-view" aria-label={`${month} 月历`}>
        <div className="weekday-row" aria-hidden>{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
        <div className="month-grid">
          {gridDays.map((date) => {
            const items = byDate.get(date) ?? [];
            const counts = {
              confirmed: items.filter((item) => item.trust_status === "confirmed").length,
              unverified: items.filter((item) => item.trust_status === "unverified").length,
              rumor: items.filter((item) => item.trust_status === "rumor").length,
            };
            return (
              <button
                key={date}
                className={`month-day ${date.startsWith(`${month}-`) ? "" : "outside"} ${date === selectedDate ? "selected" : ""}`}
                aria-label={`${formatShanghaiDate(date)}，官方确认 ${counts.confirmed}，待核实 ${counts.unverified}，传闻 ${counts.rumor}`}
                onClick={() => selectDay(date)}
              >
                <b>{Number(date.slice(-2))}</b>
                <span className="day-counts" aria-hidden>
                  <i className="count-confirmed"><em>绿</em>{counts.confirmed}</i>
                  <i className="count-unverified"><em>蓝</em>{counts.unverified}</i>
                  <i className="count-rumor"><em>红</em>{counts.rumor}</i>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="day-summary" aria-labelledby="selected-date-title" ref={dayPanelRef}>
        <header className="day-summary-header">
          <button onClick={() => selectDay(shiftDate(selectedDate, -1), false)} aria-label="前一天">←</button>
          <div><span>当天情报简述</span><h2 id="selected-date-title">{formatShanghaiDate(selectedDate)}</h2></div>
          <button onClick={() => selectDay(shiftDate(selectedDate, 1), false)} aria-label="后一天">→</button>
        </header>

        {selectedItems.length ? (
          <div className="agenda-list">
            {selectedItems.map((item) => (
              <article className={`agenda-card level-${item.trust_status}`} key={item.id}>
                <div className="agenda-meta">
                  <TrustBadge status={item.trust_status} />
                  <span>{informationLabels[item.info_type]}</span>
                  <span>{item.team}</span>
                </div>
                <h3><Link href={`/news/${item.id}?returnTo=${encodeURIComponent(currentPath)}`}>{item.title}</Link></h3>
                <p>{item.summary}</p>
                <div className="agenda-time">
                  <span>{levelLabels[item.trust_status]}</span>
                  <time dateTime={item.event_at ?? item.published_at}>{formatShanghaiDateTime(item.event_at ?? item.published_at)}</time>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="agenda-empty" role="status"><strong>这一天暂无情报</strong><p>请选择其他日期，或在左上角切换关注球队。</p></div>
        )}
      </section>

      {teamDialogOpen ? (
        <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setTeamDialogOpen(false); }}>
          <section className="team-dialog" role="dialog" aria-modal="true" aria-labelledby="team-dialog-title">
            <header>
              <div><span className="eyebrow">MY TEAMS</span><h2 id="team-dialog-title">选择关注球队</h2></div>
              <button className="dialog-close" type="button" onClick={() => setTeamDialogOpen(false)} aria-label="关闭球队选择">×</button>
            </header>
            <p>最多选择 {MAX_TEAMS} 支；暂不选择时，日历会显示全部球队。</p>
            <div className="dialog-team-groups">
              {leagues.map((league) => (
                <fieldset key={league.id}>
                  <legend>{league.nameZh}</legend>
                  <div className="dialog-team-grid">
                    {teams.filter((team) => team.leagueId === league.id).map((team) => {
                      const selected = draftTeamIds.includes(team.id);
                      const disabled = !selected && draftTeamIds.length >= MAX_TEAMS;
                      return <button key={team.id} type="button" className={selected ? "selected" : ""} disabled={disabled} aria-pressed={selected} onClick={() => toggleDraftTeam(team.id)}><span>{team.shortNameZh}</span><small>{team.shortNameEn}</small></button>;
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
            <footer>
              <button className="text-action" type="button" onClick={() => setDraftTeamIds([])}>查看全部球队</button>
              <span>{draftTeamIds.length} / {MAX_TEAMS}</span>
              <button className="primary-action" type="button" onClick={applyTeamSelection}>应用到日历</button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}
