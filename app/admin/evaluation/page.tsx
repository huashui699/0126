import type { Metadata } from "next";

import { AdminSectionNav } from "@/components/AdminSectionNav";
import { EvaluationWorkbench } from "@/components/EvaluationWorkbench";
import { Header } from "@/components/Header";

export const metadata: Metadata = { title: "Day 41 标注台｜0126 Football", robots: { index: false, follow: false } };

export default function EvaluationPage() {
  return (
    <div className="site-shell">
      <Header />
      <main className="page-width admin-page-shell">
        <AdminSectionNav current="evaluation" />
        <EvaluationWorkbench />
      </main>
    </div>
  );
}
