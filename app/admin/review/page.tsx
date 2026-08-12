import type { Metadata } from "next";
import { AdminSectionNav } from "@/components/AdminSectionNav";
import { AdminReviewConsole } from "@/components/AdminReviewConsole";
import { Header } from "@/components/Header";

export const metadata: Metadata = { title: "可信度复核台｜0126 Football", robots: { index: false, follow: false } };

export default function AdminReviewPage() {
  return <div className="site-shell"><Header /><main className="page-width admin-page-shell"><AdminSectionNav current="review" /><AdminReviewConsole /></main></div>;
}
