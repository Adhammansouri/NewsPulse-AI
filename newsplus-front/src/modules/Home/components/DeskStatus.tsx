import type { HealthData, NewsFeedItem, NewsSource } from "@newsplus/shared";
import { formatAgo } from "@/utils/format";

type DeskStatusProps = {
  sources: NewsSource[];
  items: NewsFeedItem[];
  fetchedAt?: string;
  health?: HealthData;
  healthError: boolean;
  loading: boolean;
};

export function DeskStatus({ sources, items, fetchedAt, health, healthError, loading }: DeskStatusProps) {
  const lastHour = items.filter((item) => Date.now() - new Date(item.publishedAt).getTime() < 3_600_000).length;
  const server = healthError ? { tone: "is-danger", text: "الخادم غير متصل" } : health ? { tone: "is-ok", text: "الخادم يعمل" } : { tone: "", text: "جارٍ التحقق" };
  const ai = health ? (health.openai ? { tone: "is-ok", text: "الذكاء الاصطناعي متصل" } : { tone: "is-warn", text: "OpenAI غير مُعدّ" }) : { tone: "", text: "—" };

  return (
    <section className="status" aria-label="حالة المكتب" aria-live="polite">
      <dl className="status-grid">
        <div>
          <dt>المصادر</dt>
          <dd>{loading ? "—" : sources.length}</dd>
        </div>
        <div>
          <dt>عناوين آخر ساعة</dt>
          <dd>{loading ? "—" : lastHour}</dd>
        </div>
        <div>
          <dt>آخر تحديث</dt>
          <dd>{fetchedAt ? formatAgo(fetchedAt) : "—"}</dd>
        </div>
      </dl>
      <ul className="status-list">
        <li><span className={`dot ${server.tone}`} aria-hidden="true" />{server.text}</li>
        <li><span className={`dot ${ai.tone}`} aria-hidden="true" />{ai.text}</li>
      </ul>
    </section>
  );
}
