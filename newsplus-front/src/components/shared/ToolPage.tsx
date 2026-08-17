type ToolPageProps = {
  title: string;
  description: string;
  placeholder: string;
  actionLabel: string;
  badge?: string;
  previewLabel?: string;
};

export function ToolPage({
  title,
  description,
  placeholder,
  actionLabel,
  badge = "قريباً",
  previewLabel = "المخرجات",
}: ToolPageProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-12 max-w-2xl">
        <span className="nd-tag">{badge}</span>
        <h1 className="nd-headline mt-6">{title}</h1>
        <p className="nd-body mt-4">{description}</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="nd-surface p-6 sm:p-8">
          <label htmlFor="tool-input" className="nd-label mb-4 block">INPUT</label>
          <textarea
            id="tool-input"
            rows={10}
            placeholder={placeholder}
            disabled
            className="nd-input mb-8 resize-none"
          />
          <button type="button" disabled className="nd-btn-primary w-full">
            {actionLabel}
          </button>
          <p className="nd-status-inline mt-6 text-center">
            [ PENDING ] سيتم تفعيل هذه الميزة بعد ربط OpenAI API
          </p>
        </div>

        <div className="nd-surface flex min-h-[360px] flex-col p-6 sm:p-8">
          <p className="nd-label">{previewLabel}</p>
          <div className="mt-8 flex flex-1 flex-col justify-center">
            <p className="nd-display text-4xl text-[var(--nd-text-disabled)]">—</p>
            <p className="nd-status-inline mt-6 text-center">
              [ NO OUTPUT ] معاينة النتائج ستظهر هنا بعد التفعيل
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
