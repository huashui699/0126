"use client";

export default function CalendarError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="calendar-empty page-width">
      <h1>日历暂时无法加载</h1>
      <p>你的球队关注不会丢失。请稍后重试，或先返回球队管理。</p>
      <button className="primary-action" onClick={() => reset()}>重新加载</button>
    </div>
  );
}

