type ToolPageProps = {
  title: string;
  description: string;
  placeholder: string;
  actionLabel: string;
  badge?: string;
};

export function ToolPage({
  title,
  description,
  placeholder,
  actionLabel,
  badge = "قريباً",
}: ToolPageProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <span className="mb-3 inline-flex rounded-full bg-coral-500/10 px-3 py-1 text-xs font-medium text-coral-500">
          {badge}
        </span>
        <h1 className="mb-3 text-3xl font-bold text-navy-900">{title}</h1>
        <p className="text-slate-600">{description}</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-navy-900">المدخلات</label>
        <textarea
          rows={8}
          placeholder={placeholder}
          disabled
          className="mb-4 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 outline-none"
        />
        <button
          type="button"
          disabled
          className="w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white opacity-60"
        >
          {actionLabel}
        </button>
        <p className="mt-4 text-center text-xs text-slate-400">
          سيتم تفعيل هذه الميزة بعد ربط OpenAI API
        </p>
      </div>
    </div>
  );
}
