import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/Header";
import { CalendarView } from "@/components/CalendarView";
import { getCalendarNews } from "@/lib/calendar-news";
import { parseMonth } from "@/lib/calendar-date";

export const metadata: Metadata = { title: "球队情报日历｜0126 Football" };

type CalendarPageProps = {
  searchParams: Promise<{ month?: string | string[] }>;
};

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const values = await searchParams;
  const month = parseMonth(Array.isArray(values.month) ? values.month[0] : values.month);
  const { items, mode } = await getCalendarNews(month);

  return (
    <div className="site-shell">
      <Header />
      <main className="calendar-page">
        <Suspense fallback={<div className="calendar-loading page-width">正在整理球队情报…</div>}>
          <CalendarView initialItems={items} month={month} dataMode={mode} />
        </Suspense>
      </main>
    </div>
  );
}
