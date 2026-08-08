import type { TrustStatus } from "@/types/news";

export const trustLabels: Record<TrustStatus, { icon: string; label: string }> = {
  confirmed: { icon: "✓", label: "官方确认" },
  unverified: { icon: "?", label: "待核实" },
  rumor: { icon: "!", label: "传闻 / 低可信" },
};

export function TrustBadge({ status }: { status: TrustStatus }) {
  const value = trustLabels[status];
  return (
    <span className={`trust-badge trust-${status}`}>
      <span aria-hidden>{value.icon}</span>
      {value.label}
    </span>
  );
}
