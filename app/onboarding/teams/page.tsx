import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { TeamPicker } from "@/components/TeamPicker";

export const metadata: Metadata = { title: "选择球队｜0126 Football" };

export default function TeamOnboardingPage() {
  return (
    <div className="site-shell">
      <Header />
      <main className="page-width onboarding-page">
        <TeamPicker />
      </main>
    </div>
  );
}
