import { Link } from "react-router-dom";
import { CaretLeft } from "@phosphor-icons/react";
import type { NewsFeedItem } from "@newsplus/shared";
import { SourceMarkStack } from "@/modules/News/SourceMark";
import { formatRelative, formatStamp, newsRecency } from "@/modules/News/newsFormat";

type DeskHeadlinesProps = {
  items: NewsFeedItem[];
  isLoading: boolean;
  isError: boolean;
};

function HeadlineRow({ item, lead = false }: { item: NewsFeedItem; lead?: boolean }) {
  const recency = newsRecency(item.publishedAt);
  const aging = recency === "aging";
  const breaking = Boolean(item.breaking && recency === "now");
  const fresh = !breaking && (recency === "now" || recency === "fresh");

  return (
    <Link
      to={`/news?item=${encodeURIComponent(item.id)}`}
      state={{ itemId: item.id }}
      className={["desk-wire__row", lead ? "is-lead" : "", aging ? "is-aging" : ""].filter(Boolean).join(" ")}
    >
      <div className="desk-wire__meta">
        <SourceMarkStack sources={item.sources} size={lead ? 18 : 16} />
        {breaking ? <span className="brand-badge bg-coral-500/10 text-coral-500">عاجل</span> : null}
        {fresh ? <span className="brand-badge bg-teal-600/10 text-teal-600">جديد</span> : null}
        <span>{item.sources[0]?.name}</span>
        {item.sources.length > 1 ? <span>+{item.sources.length - 1}</span> : null}
        <span title={formatStamp(item.publishedAt)}>{formatRelative(item.publishedAt)}</span>
      </div>
      <p className="desk-wire__headline">{item.title}</p>
    </Link>
  );
}

function HeadlinesSkeleton() {
  return (
    <div className="desk-skel" aria-hidden="true">
      {[92, 78, 84, 70, 76, 64].map((width, index) => (
        <div key={index} className="desk-skel__row">
          <span className="desk-skel__meta" />
          <span className="desk-skel__title" style={{ width: `${width}%` }} />
        </div>
      ))}
    </div>
  );
}

export function DeskHeadlines({ items, isLoading, isError }: DeskHeadlinesProps) {
  const [lead, ...rest] = items;

  return (
    <section className="desk-wire" aria-labelledby="desk-headlines-title" aria-busy={isLoading}>
      <div className="desk-wire__head">
        <h2 id="desk-headlines-title" className="desk-wire__title">
          عناوين المكتب
        </h2>
        <Link to="/news" className="desk-wire__all">
          كل العناوين
          <CaretLeft size={14} weight="bold" aria-hidden="true" />
        </Link>
      </div>

      {isLoading ? <HeadlinesSkeleton /> : null}

      {isError ? (
        <p className="desk-wire__status is-error">تعذّر جلب العناوين. حدّث الصفحة ثم حاول مرة أخرى.</p>
      ) : null}

      {!isLoading && !isError && items.length === 0 ? (
        <p className="desk-wire__status">
          لا توجد عناوين في هذه النافذة.{" "}
          <Link to="/news" className="brand-accent-text font-medium">
            افتح صفحة الأخبار
          </Link>
        </p>
      ) : null}

      {!isLoading && !isError && lead ? (
        <div>
          <HeadlineRow item={lead} lead />
          {rest.map((item) => (
            <HeadlineRow key={item.id} item={item} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
