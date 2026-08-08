"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";
import { clearGuestRecoveryNotice, readGuestFollows, writeGuestFollows } from "@/lib/guest-follows";
import { replaceAccountFollows } from "@/lib/account-follows";
import { leagues, searchTeams, teams } from "@/lib/teams";

const validTeamIds = new Set(teams.map((team) => team.id));

export function TeamPicker() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedLeague, setSelectedLeague] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [recovered, setRecovered] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      const guest = readGuestFollows(validTeamIds);
      if (guest.recovered) setRecovered(true);
      let initial = guest.teamIds;
      const client = createBrowserClient();
      const { data: authData } = client ? await client.auth.getSession() : { data: { session: null } };

      if (client && authData.session?.user) {
        const { data } = await client
          .from("user_team_follows")
          .select("team_id,sort_order")
          .eq("user_id", authData.session.user.id)
          .order("sort_order", { ascending: true });
        if (data) initial = data.map((row) => String(row.team_id)).filter((id) => validTeamIds.has(id));
      }

      if (active) {
        setSelected(initial);
        setReady(true);
        clearGuestRecoveryNotice();
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(
    () => searchTeams(query).filter((team) => selectedLeague === "all" || team.leagueId === selectedLeague),
    [query, selectedLeague],
  );

  function toggle(teamId: string) {
    setStatus(null);
    setSelected((current) => {
      if (current.includes(teamId)) return current.filter((id) => id !== teamId);
      if (current.length >= 5) {
        setStatus("最多关注 5 支球队，请先取消一支再继续。");
        return current;
      }
      return [...current, teamId];
    });
  }

  function move(teamId: string, direction: -1 | 1) {
    setSelected((current) => {
      const index = current.indexOf(teamId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function save() {
    if (!selected.length) {
      setStatus("请至少选择 1 支球队。");
      return;
    }

    setSaving(true);
    setStatus(null);
    try {
      const client = createBrowserClient();
      const { data } = client ? await client.auth.getSession() : { data: { session: null } };
      if (client && data.session?.user) {
        await replaceAccountFollows(client, data.session.user.id, selected);
        setStatus("账号关注已保存，可在其他会话中读取。");
      } else {
        writeGuestFollows(selected);
        setStatus("已保存在此浏览器。登录后可合并到账号。");
      }
      router.refresh();
    } catch (error) {
      setStatus(`保存失败：${error instanceof Error ? error.message : "请稍后重试"}`);
    } finally {
      setSaving(false);
    }
  }

  if (!ready) return <div className="picker-loading" role="status">正在读取关注球队…</div>;

  return (
    <div className="picker-layout">
      <section className="picker-main" aria-labelledby="picker-title">
        <div className="picker-heading">
          <div>
            <span className="eyebrow">DAY 11–15 · MY TEAMS</span>
            <h1 id="picker-title">选择你关心的球队</h1>
            <p>按联赛浏览，或用中文、英文和常用简称搜索。首次选择通常不到一分钟。</p>
          </div>
          <Link className="text-link" href="/auth">登录 / 注册</Link>
        </div>

        {recovered && <div className="inline-alert" role="status">检测到异常的本地数据，已自动恢复可用内容。</div>}

        <label className="team-search">
          <span>搜索球队</span>
          <input
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="例如：曼联、Manchester、BVB"
          />
        </label>

        <div className="league-tabs" role="group" aria-label="按联赛筛选">
          <button className={selectedLeague === "all" ? "active" : ""} onClick={() => setSelectedLeague("all")}>全部</button>
          {leagues.map((league) => (
            <button key={league.id} className={selectedLeague === league.id ? "active" : ""} onClick={() => setSelectedLeague(league.id)}>
              {league.nameZh}
            </button>
          ))}
        </div>

        {filtered.length ? (
          <div className="team-groups">
            {leagues.map((league) => {
              const leagueTeams = filtered.filter((team) => team.leagueId === league.id);
              if (!leagueTeams.length) return null;
              return (
                <section key={league.id} aria-labelledby={`league-${league.id}`}>
                  <div className="league-title"><h2 id={`league-${league.id}`}>{league.nameZh}</h2><span>{league.nameEn}</span></div>
                  <div className="team-grid">
                    {leagueTeams.map((team) => {
                      const isSelected = selected.includes(team.id);
                      const disabled = !isSelected && selected.length >= 5;
                      return (
                        <button
                          key={team.id}
                          className={`team-option ${isSelected ? "selected" : ""}`}
                          aria-pressed={isSelected}
                          disabled={disabled}
                          onClick={() => toggle(team.id)}
                        >
                          <span className="team-monogram" aria-hidden>{team.shortNameEn.slice(0, 2).toUpperCase()}</span>
                          <span><strong>{team.nameZh}</strong><small>{team.nameEn}</small></span>
                          <b aria-hidden>{isSelected ? "✓" : "+"}</b>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="empty-state" role="status">
            <strong>没有找到匹配的球队</strong>
            <p>换一个中英文名称或简称，也可以清空搜索后按联赛浏览。</p>
            <button onClick={() => { setQuery(""); setSelectedLeague("all"); }}>清空搜索</button>
          </div>
        )}
      </section>

      <aside className="selection-panel" aria-labelledby="selection-title">
        <div className="selection-count"><span id="selection-title">已选球队</span><strong>{selected.length} / 5</strong></div>
        <p>顺序将用于后续情报日历的默认展示。</p>
        {selected.length ? (
          <ol>
            {selected.map((teamId, index) => {
              const team = teams.find((item) => item.id === teamId)!;
              return (
                <li key={teamId}>
                  <span><b>{index + 1}</b>{team.shortNameZh}</span>
                  <span className="order-actions">
                    <button aria-label={`上移${team.nameZh}`} disabled={index === 0} onClick={() => move(teamId, -1)}>↑</button>
                    <button aria-label={`下移${team.nameZh}`} disabled={index === selected.length - 1} onClick={() => move(teamId, 1)}>↓</button>
                    <button aria-label={`取消关注${team.nameZh}`} onClick={() => toggle(teamId)}>×</button>
                  </span>
                </li>
              );
            })}
          </ol>
        ) : <div className="selection-empty">从左侧选择 1–5 支球队</div>}
        <button className="primary-action" disabled={!selected.length || saving} onClick={() => void save()}>
          {saving ? "保存中…" : "保存我的球队"}
        </button>
        {selected.length ? <Link className="calendar-entry" href="/calendar">打开情报日历 →</Link> : null}
        <div className="status-slot" aria-live="polite">{status}</div>
      </aside>
    </div>
  );
}

