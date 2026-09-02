import { Link } from "react-router-dom";
import type { NewsFeedItem } from "@newsplus/shared";
import { SourceMarkStack } from "@/modules/News/SourceMark";
import { formatRelative, formatStamp, newsRecency } from "@/modules/News/newsFormat";

type DeskHeadlinesProps = {
  items: NewsFeedItem[];
  isLoading: boolean;
  isError: boolean;
};

export function DeskHeadlines({ items, isLoading, isError }: DeskHeadlinesProps) {
  return (
    <section className="brand-panel overflow-hidden" aria-labelledby="desk-headlines-title">
      <div className="flex items-center justify-between gap-3 border-b brand-border-default px-5 py-4">
        <h2 id="desk-headlines-title" className="brand-text-primary text-sm font-semibold">
          عناوين المكتب
        </h2>
        <Link to="/news" className="brand-accent-text text-sm font-medium">
          كل العناوين
          <span className="me-1" aria-hidden="true">
            ←
          </span>
        </Link>
      </div>

      {isLoading && (
        <p className="brand-text-secondary px-5 py-8 text-sm">جاري جلب العناوين من المصادر...</p>
      )}

      {isError && (
        <p className="px-5 py-8 text-sm font-medium text-coral-500">تعذّر جلب العناوين. حاول تحديث الصفحة.</p>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <p className="brand-text-secondary px-5 py-8 text-sm">لا توجد عناوين في هذه النافذة.</p>
      )}

      {!isLoading && !isError && items.length > 0 && (
        <ul className="divide-y divide-[var(--border-default)]">
          {items.map((item) => {
            const recency = newsRecency(item.publishedAt);
            return (
              <li key={item.id}>
                <Link
                  to={`/news?item=${encodeURIComponent(item.id)}`}
                  state={{ itemId: item.id }}
                  className="block px-5 py-4 transition-colors hover:bg-[color-mix(in_srgb,var(--color-teal-600)_5%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-600/30"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <SourceMarkStack sources={item.sources} size={16} />
                    {item.breaking && recency === "now" ? (
                      <span className="brand-badge bg-coral-500/10 text-coral-500">عاجل</span>
                    ) : recency === "now" || recency === "fresh" ? (
                      <span className="brand-badge bg-teal-600/10 text-teal-600">جديد</span>
                    ) : recency === "aging" ? (
                      <span className="brand-text-secondary text-xs">أقدم</span>
                    ) : null}
                    <span className="brand-text-secondary text-xs">{item.sources[0]?.name}</span>
                    {item.sources.length > 1 && (
                      <span className="brand-text-secondary text-xs">+{item.sources.length - 1}</span>
                    )}
                  </div>
                  <p
                    className={
                      recency === "aging"
                        ? "brand-text-secondary text-[15px] leading-6 font-medium"
                        : "brand-text-primary text-[15px] leading-6 font-medium"
                    }
                  >
                    {item.title}
                  </p>
                  <p className="brand-text-secondary mt-1 text-xs" title={formatStamp(item.publishedAt)}>
                    {formatRelative(item.publishedAt)}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
