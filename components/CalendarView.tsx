"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";
import { readGuestFollows } from "@/lib/guest-follows";
import {
  currentShanghaiMonth,
  formatShanghaiDate,
  formatShanghaiDateTime,
  monthGrid,
  parseDate,
  shiftDate,
  shiftMonth,
  toShanghaiDateKey,
} from "@/lib/calendar-date";
import { teams } from "@/lib/teams";
import { TrustBadge, trustLabels } from "@/components/TrustBadge";
import type { CalendarNews, InformationType, TrustStatus } from "@/types/news";

type CalendarViewProps = {
  initialItems: CalendarNews[];
  month: string;
  dataMode: "live" | "preview" | "fallback";
};

const validTeamIds = new Set(teams.map((team) => team.id));
const teamById = new Map(teams.map((team) => [team.id, team]));
const weekdays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

const informationLabels: Record<InformationType, string> = {
  club_announcement: "俱乐部公告",
  match: "比赛",
  player: "球员动态",
  transfer: "转会",
  coaching: "教练 / 训练",
  social: "官方活动",
  media: "媒体报道",
};

function csvValues(value: string | null): string[] {
  return value ? Array.from(new Set(value.split(",").filter(Boolean))) : [];
}

function displayDate(item: CalendarNews): string {
  return toShanghaiDateKey(item.event_at ?? item.published_at);
}

export function CalendarView({ initialItems, month, dataMode }: CalendarViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [followedTeamIds, setFollowedTeamIds] = useState<string[] | null>(null);

  useEffect(() => {
    let active = true;
    async function loadFollows() {
      const guest = readGuestFollows(validTeamIds).teamIds;
      let next = guest;
      const client = createBrowserClient();
      const { data: sessionData } = client ? await client.auth.getSession() : { data: { session: null } };
      if (client && sessionData.session?.user) {
        const { data } = await client
          .from("user_team_follows")
          .select("team_id,sort_order")
          .eq("user_id", sessionData.session.user.id)
          .order("sort_order", { ascending: true });
        if (data) next = data.map((row) => String(row.team_id)).filter((id) => validTeamIds.has(id));
      }
      if (active) setFollowedTeamIds(next);
    }
    void loadFollows();
    return () => { active = false; };
  }, []);

  const view = searchParams.get("view") === "month" ? "month" : "agenda";
  const selectedDate = parseDate(searchParams.get("date") ?? undefined, month);
  const requestedTeamSlugs = csvValues(searchParams.get("teams"));
  const requestedTypes = csvValues(searchParams.get("type")) as InformationType[];
  const requestedTrust = csvValues(searchParams.get("trust")) as TrustStatus[];

  const followedTeams = (followedTeamIds ?? []).flatMap((id) => teamById.get(id) ? [teamById.get(id)!] : []);
  const followedSlugs = followedTeams.map((team) => team.slug);
  const activeTeamSlugs = requestedTeamSlugs.length
    ? requestedTeamSlugs.filter((slug) => followedSlugs.includes(slug))
    : followedSlugs;
  const activeTypes = requestedTypes.filter((value) => value in informationLabels);
  const activeTrust = requestedTrust.filter((value) => value in trustLabels);
  const activeTeamIds = new Set(followedTeams.filter((team) => activeTeamSlugs.includes(team.slug)).map((team) => team.id));

  const filteredItems = initialItems.filter((item) => {
    if (!item.team_ids.some((id) => activeTeamIds.has(id))) return false;
    if (activeTypes.length && !activeTypes.includes(item.info_type)) return false;
    if (activeTrust.length && !activeTrust.includes(item.trust_status)) return false;
    return true;
  });

  const byDate = new Map<string, CalendarNews[]>();
  for (const item of filteredItems) {
    const key = displayDate(item);
    byDate.set(key, [...(byDate.get(key) ?? []), item]);
  }

  function updateParams(changes: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const query = params.toString();
    const destination = query ? `${pathname}?${query}` : pathname;
    const changesMonth = Boolean(changes.month && changes.month !== month);
    if (changesMonth) router.push(destination, { scroll: false });
    else window.history.pushState(null, "", destination);
  }

  function toggleListParam(key: "teams" | "type" | "trust", value: string, current: string[], allValues?: string[]) {
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
    const normalized = allValues && next.length === allValues.length ? null : next.join(",");
    updateParams({ [key]: normalized });
  }

  function selectDay(date: string) {
    updateParams({ month: date.slice(0, 7), date, view: "agenda" });
  }

  function selectMonth(nextMonth: string) {
    updateParams({ month: nextMonth, date: `${nextMonth}-01` });
  }

  const currentPath = `${pathname}${searchParams.size ? `?${searchParams.toString()}` : ""}`;

  if (followedTeamIds === null) return <div className="calendar-loading" role="status">正在读取你的球队日历…</div>;

  if (!followedTeams.length) {
    return (
      <div className="calendar-empty page-width">
        <span className="eyebrow">YOUR CALENDAR</span>
        <h1>先选择球队，再打开专属日历</h1>
        <p>日历只展示你关注球队的情报。选择 1–5 支球队后，日期、筛选和详情流程会自动启用。</p>
        <Link className="primary-link" href="/onboarding/teams">选择我的球队</Link>
      </div>
    );
  }

  const selectedItems = byDate.get(selectedDate) ?? [];
  const gridDays = monthGrid(month);

  return (
    <div className="calendar-shell page-width">
      <section className="calendar-heading" aria-labelledby="calendar-title">
        <div>
          <span className="eyebrow">PERSONAL INTELLIGENCE CALENDAR</span>
          <h1 id="calendar-title">我的球队情报日历</h1>
          <p>{followedTeams.map((team) => team.shortNameZh).join(" · ")} · 默认使用上海时间</p>
        </div>
        <div className="view-switch" role="group" aria-label="日历视图">
          <button className={view === "agenda" ? "active" : ""} onClick={() => updateParams({ view: "agenda" })}>日程</button>
          <button className={view === "month" ? "active" : ""} onClick={() => updateParams({ view: "month" })}>月历</button>
        </div>
      </section>

      {dataMode !== "live" ? (
        <div className="calendar-notice" role="status">
          当前使用明确标记的 M3 验收样例；不代表真实新闻，也不启用未经授权的采集。
        </div>
      ) : null}

      <section className="calendar-toolbar" aria-label="日历筛选">
        <div className="month-nav">
          <button aria-label="上个月" onClick={() => selectMonth(shiftMonth(month, -1))}>←</button>
          <strong>{month.replace("-", " 年 ")} 月</strong>
          <button aria-label="下个月" onClick={() => selectMonth(shiftMonth(month, 1))}>→</button>
        </div>
        <details className="filter-panel">
          <summary>筛选 <span>{activeTypes.length + activeTrust.length + (requestedTeamSlugs.length ? requestedTeamSlugs.length : 0)}</span></summary>
          <div className="filter-grid">
            <fieldset>
              <legend>球队</legend>
              {followedTeams.map((team) => (
                <label key={team.id}><input type="checkbox" checked={activeTeamSlugs.includes(team.slug)} onChange={() => toggleListParam("teams", team.slug, activeTeamSlugs, followedSlugs)} />{team.shortNameZh}</label>
              ))}
            </fieldset>
            <fieldset>
              <legend>信息类型</legend>
              {(Object.entries(informationLabels) as [InformationType, string][]).map(([value, label]) => (
                <label key={value}><input type="checkbox" checked={activeTypes.includes(value)} onChange={() => toggleListParam("type", value, activeTypes)} />{label}</label>
              ))}
            </fieldset>
            <fieldset>
              <legend>可信度</legend>
              {(Object.entries(trustLabels) as [TrustStatus, { label: string }][]).map(([value, label]) => (
                <label key={value}><input type="checkbox" checked={activeTrust.includes(value)} onChange={() => toggleListParam("trust", value, activeTrust)} />{label.label}</label>
              ))}
            </fieldset>
          </div>
          <button className="clear-filters" onClick={() => updateParams({ teams: null, type: null, trust: null })}>清除筛选</button>
        </details>
      </section>

      {view === "month" ? (
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
                    <i className="count-confirmed">{counts.confirmed}</i>
                    <i className="count-unverified">{counts.unverified}</i>
                    <i className="count-rumor">{counts.rumor}</i>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="count-legend"><span><i className="count-confirmed" />官方确认</span><span><i className="count-unverified" />待核实</span><span><i className="count-rumor" />传闻</span></div>
        </section>
      ) : (
        <section className="agenda-view" aria-labelledby="agenda-date">
          <div className="day-nav">
            <button onClick={() => selectDay(shiftDate(selectedDate, -1))}>← 前一天</button>
            <div><span>上海时间</span><h2 id="agenda-date">{formatShanghaiDate(selectedDate)}</h2></div>
            <button onClick={() => selectDay(shiftDate(selectedDate, 1))}>后一天 →</button>
          </div>
          <button className="today-link" onClick={() => selectDay(`${currentShanghaiMonth()}-${toShanghaiDateKey(new Date()).slice(-2)}`)}>回到今天</button>

          {selectedItems.length ? (
            <div className="agenda-list">
              {selectedItems.map((item) => (
                <article className="agenda-card" key={item.id}>
                  <div className="agenda-meta">
                    <TrustBadge status={item.trust_status} />
                    <span>{informationLabels[item.info_type]}</span>
                    <span>{item.team}</span>
                  </div>
                  <h3><Link href={`/news/${item.id}?returnTo=${encodeURIComponent(currentPath)}`}>{item.title}</Link></h3>
                  <p>{item.summary}</p>
                  <div className="agenda-time">
                    <span>{item.event_at ? "事件时间" : "发布时间"}</span>
                    <time dateTime={item.event_at ?? item.published_at}>{formatShanghaiDateTime(item.event_at ?? item.published_at)}</time>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="agenda-empty" role="status">
              <strong>{filteredItems.length ? "这一天暂无情报" : "当前筛选没有结果"}</strong>
              <p>{filteredItems.length ? "可以查看前后日期或切换到月历。" : "清除部分筛选条件后再试。"}</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

