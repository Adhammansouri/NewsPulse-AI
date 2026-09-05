import type { HealthData, NewsSource } from "@newsplus/shared";

type DeskPulseProps = {
  sources: NewsSource[];
  fetchedAt?: string;
  health?: HealthData;
  healthLoading: boolean;
  healthError: boolean;
};

function formatFetchedAt(iso?: string) {
  if (!iso) return "غير متاح";
  try {
    return new Date(iso).toLocaleString("ar", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function DeskPulse({ sources, fetchedAt, health, healthLoading, healthError }: DeskPulseProps) {
  const arabic = sources.filter((source) => source.language === "ar").length;
  const english = sources.filter((source) => source.language === "en").length;

  return (
    <section className="desk-pulse" aria-labelledby="desk-pulse-title" aria-live="polite">
      <h2 id="desk-pulse-title" className="desk-pulse__title">
        حالة المكتب
      </h2>

      <dl className="desk-pulse__grid">
        <div>
          <dt>المصادر</dt>
          <dd>
            {sources.length} مصدر
            {sources.length > 0 ? ` (${arabic} عربي، ${english} English)` : ""}
          </dd>
        </div>
        <div>
          <dt>آخر جلب</dt>
          <dd>{formatFetchedAt(fetchedAt)}</dd>
        </div>
        <div>
          <dt>الخادم</dt>
          <dd>
            {healthLoading && <span className="brand-text-secondary">جاري التحقق...</span>}
            {healthError && <span className="text-coral-500">غير متصل</span>}
            {health && <span className="text-teal-600">{health.status}</span>}
          </dd>
        </div>
        <div>
          <dt>OpenAI</dt>
          <dd>{health ? (health.openai ? "متصل" : "غير مُعدّ") : "غير معروف"}</dd>
        </div>
      </dl>
    </section>
  );
}
