import Link from "next/link";

export function Header() {
  return (
    <header className="site-header">
      <div className="header-inner page-width">
        <Link className="brand" href="/" aria-label="0126 Football 首页">
          <span className="brand-mark">0126</span>
          <span>FOOTBALL</span>
        </Link>
        <span className="header-edition">CALENDAR EDITION</span>
      </div>
    </header>
  );
}
