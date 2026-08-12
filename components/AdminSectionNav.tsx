import Link from "next/link";

export function AdminSectionNav({ current }: { current: "review" | "evaluation" }) {
  return (
    <nav className="admin-section-nav" aria-label="运营工具">
      <Link className={current === "review" ? "active" : ""} href="/admin/review">运营复核</Link>
      <Link className={current === "evaluation" ? "active" : ""} href="/admin/evaluation">Day 41 标注台</Link>
    </nav>
  );
}
