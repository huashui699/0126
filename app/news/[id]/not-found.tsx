import Link from "next/link";

export default function NewsNotFound() {
  return (
    <div className="calendar-empty page-width">
      <h1>没有找到这条情报</h1>
      <p>它可能已被移除或链接有误。返回日历查看当前可用内容。</p>
      <Link className="primary-link" href="/calendar">返回日历</Link>
    </div>
  );
}

