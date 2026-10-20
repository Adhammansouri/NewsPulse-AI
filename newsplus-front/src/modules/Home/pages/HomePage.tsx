import { ArrowLeft, Newspaper, PencilSimple, Translate } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/ui/EmptyState";
import { Notice } from "@/components/ui/Notice";
import { useHealth } from "@/hooks/useHealth";
import { useNewsFeed } from "@/hooks/useNewsFeed";
import { useSession } from "@/hooks/useSession";
import { getNewsSources } from "@/services/newsService";
import { formatLongDate } from "@/utils/format";
import { WireRow, WireSkeleton } from "@/modules/News/components/WireRow";
import { CommandBar } from "../components/CommandBar";
import { DeskStatus } from "../components/DeskStatus";
import "../home.css";

const TOOLS = [
  { href: "/news", title: "غرفة الأخبار", text: "تابع المصادر واختر خبراً لتحويله إلى منشور أو فيديو أو كاروسيل.", icon: Newspaper },
  { href: "/generate", title: "توليد", text: "مسودة ملخص أو مقال أو تقرير من رابط أو موضوع.", icon: PencilSimple },
  { href: "/translate", title: "ترجمة صحفية", text: "ترجمة بين العربية والإنجليزية مع حفظ الأسماء والأرقام.", icon: Translate },
] as const;

function greeting() {
  return new Date().getHours() < 12 ? "صباح الخير" : "مساء الخير";
}

export default function HomePage() {
  const session = useSession();
  const health = useHealth();
  const sources = useQuery({ queryKey: ["news-sources"], queryFn: getNewsSources });
  const feed = useNewsFeed();
  const items = feed.data?.items ?? [];
  const headlines = items.slice(0, 7);
  const name = session?.user.displayName ?? session?.user.identifier ?? "";

  return (
    <div className="page home">
      <header className="home-head">
        <p className="home-date">{formatLongDate()}</p>
        <h1 className="home-hello">{greeting()}{name ? `، ${name}` : ""}</h1>
        <p className="page-lede">ابدأ من رابط أو موضوع، أو اختر خبراً من الشريط الحي.</p>
      </header>

      <CommandBar />

      <div className="home-grid">
        <section className="home-wire" aria-labelledby="home-wire-title" aria-busy={feed.isLoading}>
          <div className="home-section-head">
            <h2 id="home-wire-title">الشريط الحي</h2>
            <Link to="/news" className="home-all">
              كل العناوين
              <ArrowLeft size={16} weight="bold" aria-hidden="true" className="flip-rtl" />
            </Link>
          </div>

          {feed.isLoading ? <WireSkeleton rows={5} /> : null}
          {feed.isError && !feed.data ? (
            <Notice tone="error" title="تعذّر جلب العناوين">تحقق من الاتصال ثم حدّث الصفحة.</Notice>
          ) : null}
          {!feed.isLoading && !feed.isError && headlines.length === 0 ? (
            <EmptyState icon={<Newspaper size={26} />} title="لا توجد عناوين الآن" action={<Link to="/news" className="btn btn-quiet btn-sm">افتح غرفة الأخبار</Link>}>
              ستظهر هنا أحدث الأخبار فور وصولها من المصادر.
            </EmptyState>
          ) : null}
          {headlines.length > 0 ? (
            <div className="wire wire-in">
              {headlines.map((item, index) => (
                <WireRow key={item.id} item={item} index={index} lead={index === 0} to={`/news?item=${encodeURIComponent(item.id)}`} />
              ))}
            </div>
          ) : null}
        </section>

        <aside className="home-side">
          <DeskStatus
            sources={sources.data?.sources ?? []}
            items={items}
            fetchedAt={feed.data?.fetchedAt}
            health={health.data}
            healthError={health.isError}
            loading={feed.isLoading}
          />
          <nav className="tools" aria-label="الأدوات">
            {TOOLS.map(({ href, title, text, icon: Icon }) => (
              <Link key={href} to={href} className="tool">
                <span className="tool-icon" aria-hidden="true"><Icon size={22} /></span>
                <span className="tool-copy">
                  <span className="tool-title">{title}</span>
                  <span className="tool-text">{text}</span>
                </span>
                <ArrowLeft size={18} className="tool-go flip-rtl" aria-hidden="true" />
              </Link>
            ))}
          </nav>
        </aside>
      </div>
    </div>
  );
}
