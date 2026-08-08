import Link from "next/link";

export function Header() {
  return (
    <header className="site-header">
      <div className="header-inner page-width">
        <Link className="brand" href="/" aria-label="0126 Football 首页">
          <span className="brand-mark">0126</span>
          <span>FOOTBALL</span>
        </Link>
        <nav className="header-nav" aria-label="主导航">
          <Link href="/calendar">情报日历</Link>
          <Link href="/onboarding/teams">我的球队</Link>
          <Link href="/auth">登录</Link>
        </nav>
      </div>
    </header>
  );
}
