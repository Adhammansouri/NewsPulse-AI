type SystemStatusProps = {
  isLoading: boolean;
  isError: boolean;
  health?: {
    status: string;
    version: string;
    openai: boolean;
  };
};

export function BrandSystemStatus({ isLoading, isError, health }: SystemStatusProps) {
  return (
    <section
      className="brand-panel brand-bg-muted border-dashed p-5 sm:p-6"
      aria-live="polite"
      aria-busy={isLoading}
    >
      <h2 className="brand-text-primary text-sm font-semibold">حالة النظام</h2>
      <p className="brand-text-secondary mt-1 text-sm">اتصال الخادم وخدمات الذكاء الاصطناعي</p>

      {isLoading && (
        <p className="brand-text-secondary mt-4 text-sm">جاري التحقق من حالة النظام...</p>
      )}

      {isError && (
        <p className="mt-4 text-sm font-medium text-coral-500">
          تعذّر الاتصال بالخادم. تأكد أن الـ API يعمل على المنفذ 3001.
        </p>
      )}

      {health && (
        <dl className="mt-4 space-y-3 border-t brand-border-default pt-4">
          <div className="flex justify-between gap-4 text-sm">
            <dt className="brand-text-secondary">الحالة</dt>
            <dd className="font-mono font-medium text-teal-600">{health.status}</dd>
          </div>
          <div className="flex justify-between gap-4 text-sm">
            <dt className="brand-text-secondary">الإصدار</dt>
            <dd className="brand-text-primary font-mono">{health.version}</dd>
          </div>
          <div className="flex justify-between gap-4 text-sm">
            <dt className="brand-text-secondary">OpenAI</dt>
            <dd className="brand-text-primary font-medium">
              {health.openai ? "متصل" : "غير مُعدّ"}
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}
