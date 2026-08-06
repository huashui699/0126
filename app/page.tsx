import { Header } from "@/components/Header";
import { NewsCard } from "@/components/NewsCard";
import { getLatestNews } from "@/lib/news";

export const revalidate = 300;

const leagues = ["全部", "英超", "西甲", "欧冠", "德甲", "意甲"];

export default async function HomePage() {
  const { news, mode } = await getLatestNews();

  return (
    <div className="site-shell">
      <Header />

      <main>
        <section className="hero page-width" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="eyebrow">全球赛场 · 中文视角</span>
            <h1 id="hero-title">
              不错过每一个
              <span>关键瞬间</span>
            </h1>
            <p>聚合主流足球资讯，用清晰的中文摘要帮你快速掌握赛场内外。</p>
          </div>

          <div className="hero-score" aria-label="今日焦点">
            <div className="live-pill"><i /> TODAY&apos;S FOCUS</div>
            <strong>24/7</strong>
            <span>持续追踪全球足球动态</span>
          </div>
        </section>

        <section className="news-section page-width" aria-labelledby="latest-news">
          <div className="section-heading">
            <div>
              <span className="section-kicker">THE LATEST</span>
              <h2 id="latest-news">最新资讯</h2>
            </div>
            <p>{mode === "live" ? "数据已连接 Supabase" : "当前展示预览数据"}</p>
          </div>

          <nav className="league-filter" aria-label="联赛筛选预览">
            {leagues.map((league, index) => (
              <span className={index === 0 ? "active" : ""} key={league}>
                {league}
              </span>
            ))}
          </nav>

          {mode !== "live" && (
            <div className="setup-notice" role="status">
              <span>配置提示</span>
              添加 Supabase 环境变量并执行数据库脚本后，这里会自动显示真实数据。
            </div>
          )}

          <div className="news-grid">
            {news.map((item, index) => (
              <NewsCard key={item.id} news={item} featured={index === 0} />
            ))}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="page-width">
          <span><b>0126</b> FOOTBALL</span>
          <p>为热爱足球的人，呈现值得关注的消息。</p>
        </div>
      </footer>
    </div>
  );
}
