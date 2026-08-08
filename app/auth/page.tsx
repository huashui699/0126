import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "登录与注册｜0126 Football" };

export default function AuthPage() {
  return (
    <div className="site-shell">
      <Header />
      <main className="page-width auth-page"><AuthForm /></main>
    </div>
  );
}
