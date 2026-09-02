import type { HealthData, NewsSource } from "@newsplus/shared";

type DeskPulseProps = {
  sources: NewsSource[];
  fetchedAt?: string;
  health?: HealthData;
  healthLoading: boolean;
  healthError: boolean;
};

function formatFetchedAt(iso?: string) {
  if (!iso) return "—";
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
    <section className="brand-panel p-5 sm:p-6" aria-labelledby="desk-pulse-title" aria-live="polite">
      <h2 id="desk-pulse-title" className="brand-text-primary text-sm font-semibold">
        نبض المكتب
      </h2>
      <p className="brand-text-secondary mt-1 text-sm">المصادر الحية وحالة الخدمات — بدون أرقام مختلقة.</p>

      <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="brand-text-secondary text-xs">المصادر</dt>
          <dd className="brand-text-primary mt-1 font-medium">
            {sources.length} — {arabic} عربي / {english} English
          </dd>
        </div>
        <div>
          <dt className="brand-text-secondary text-xs">آخر جلب</dt>
          <dd className="brand-text-primary mt-1 font-medium">{formatFetchedAt(fetchedAt)}</dd>
        </div>
        <div>
          <dt className="brand-text-secondary text-xs">الخادم</dt>
          <dd className="mt-1 font-medium">
            {healthLoading && <span className="brand-text-secondary">جاري التحقق...</span>}
            {healthError && <span className="text-coral-500">غير متصل</span>}
            {health && <span className="text-teal-600">{health.status}</span>}
          </dd>
        </div>
        <div>
          <dt className="brand-text-secondary text-xs">OpenAI</dt>
          <dd className="brand-text-primary mt-1 font-medium">
            {health ? (health.openai ? "متصل" : "غير مُعدّ") : "—"}
          </dd>
        </div>
      </dl>
    </section>
  );
}
