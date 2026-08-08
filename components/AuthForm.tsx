"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";
import { clearGuestFollows, readGuestFollows } from "@/lib/guest-follows";
import { mergeGuestFollows } from "@/lib/account-follows";
import { teams } from "@/lib/teams";

type Mode = "login" | "register";
const validTeamIds = new Set(teams.map((team) => team.id));

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const client = createBrowserClient();

    if (!client) {
      setMessage("尚未配置 Supabase 环境变量。游客关注功能仍可正常使用。");
      setPending(false);
      return;
    }

    try {
      const result = mode === "login"
        ? await client.auth.signInWithPassword({ email, password })
        : await client.auth.signUp({ email, password });

      if (result.error) throw result.error;
      if (!result.data.user) throw new Error("未能创建用户会话");
      if (!result.data.session) {
        setMessage("注册成功，请先到邮箱完成确认后再登录。");
        return;
      }

      const guest = readGuestFollows(validTeamIds);
      const merged = await mergeGuestFollows(client, result.data.user.id, guest.teamIds);
      clearGuestFollows();
      const detail = guest.teamIds.length
        ? `已合并 ${merged.addedCount} 支游客球队${merged.skippedCount ? `，另有 ${merged.skippedCount} 支因账号已达 5 支上限而保留失败` : ""}。`
        : "";
      setMessage(`${mode === "login" ? "登录" : "注册"}成功。${detail}`);
      router.push("/onboarding/teams");
      router.refresh();
    } catch (error) {
      setMessage(`${mode === "login" ? "登录" : "注册"}失败：${error instanceof Error ? error.message : "请稍后重试"}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-copy">
        <span className="eyebrow">SYNC YOUR TEAMS</span>
        <h1>让关注球队<br />跟着你走</h1>
        <p>游客选择会先留在本机。登录时系统将把它们追加到账号关注中，不覆盖账号已有球队，最多保留 5 支。</p>
        <Link className="text-link" href="/onboarding/teams">← 先以游客身份选队</Link>
      </section>

      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-tabs" role="tablist" aria-label="账号操作">
          <button role="tab" aria-selected={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setMessage(null); }}>登录</button>
          <button role="tab" aria-selected={mode === "register"} className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setMessage(null); }}>注册</button>
        </div>
        <h2 id="auth-title">{mode === "login" ? "欢迎回来" : "创建账号"}</h2>
        <p>{mode === "login" ? "读取你的跨会话关注列表。" : "注册后自动合并本机游客关注。"}</p>
        <form onSubmit={(event) => void submit(event)}>
          <label>邮箱<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>密码<input required minLength={6} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <button className="primary-action" disabled={pending}>{pending ? "处理中…" : mode === "login" ? "登录并合并关注" : "注册并合并关注"}</button>
        </form>
        <div className="status-slot auth-status" aria-live="polite">{message}</div>
      </section>
    </div>
  );
}

