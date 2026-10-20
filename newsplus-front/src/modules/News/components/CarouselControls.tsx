import type { CarouselOptions } from "@newsplus/shared";
import { Segmented } from "@/components/ui/Segmented";

const SLIDES = [3, 4, 5, 6].map((n) => ({ id: String(n), label: String(n) }));
const STYLES = [
  { id: "cinematic" as const, label: "قصة" },
  { id: "frame" as const, label: "بطاقة" },
];
const DENSITIES = [
  { id: "headline" as const, label: "عنوان" },
  { id: "banner" as const, label: "عنوان وشريط" },
  { id: "line" as const, label: "سطر توضيحي" },
];

export function CarouselControls({
  options,
  busy,
  showApply,
  onChange,
  onApply,
}: {
  options: CarouselOptions;
  busy: boolean;
  showApply: boolean;
  onChange: (next: CarouselOptions) => void;
  onApply?: () => void;
}) {
  return (
    <div className="carousel-controls">
      <div className="field">
        <span className="field-label">عدد الشرائح</span>
        <Segmented value={String(options.slides)} options={SLIDES} disabled={busy} ariaLabel="عدد الشرائح" size="sm" onChange={(id) => onChange({ ...options, slides: Number(id) })} />
      </div>
      <div className="field">
        <span className="field-label">أسلوب النص</span>
        <Segmented value={options.style} options={STYLES} disabled={busy} ariaLabel="أسلوب النص" size="sm" onChange={(style) => onChange({ ...options, style })} />
      </div>
      <div className="field">
        <span className="field-label">كثافة النص</span>
        <Segmented value={options.density} options={DENSITIES} disabled={busy} ariaLabel="كثافة نص الشرائح" size="sm" onChange={(density) => onChange({ ...options, density })} />
      </div>
      <label className="check">
        <input type="checkbox" checked={options.mark} disabled={busy} onChange={(event) => onChange({ ...options, mark: event.target.checked })} />
        إظهار علامة Newsplus
      </label>
      {showApply && onApply ? (
        <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={onApply}>
          تحديث الشرائح
        </button>
      ) : null}
    </div>
  );
}
