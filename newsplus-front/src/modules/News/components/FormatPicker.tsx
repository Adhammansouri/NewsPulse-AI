import {
  Check,
  Compass,
  FileText,
  ListBullets,
  Images,
  Newspaper,
  ShareNetwork,
  Stack,
  VideoCamera,
} from "@phosphor-icons/react";
import type { CarouselOptions, NewsSummarizeData } from "@newsplus/shared";
import { STORY_FORMATS, storyFormatMeta } from "../newsFormat";
import { CarouselControls } from "./CarouselControls";

type Format = NewsSummarizeData["format"];

export const FORMAT_ICONS = {
  desk: FileText,
  bulletin: Newspaper,
  facts: ListBullets,
  context: Compass,
  social: ShareNetwork,
  video: VideoCamera,
  carousel: Images,
  briefing: Stack,
} as const;

const BRIEFING = { id: "briefing" as const, label: "موجز الغرفة", hint: "أعلى 8 عناوين في الغرفة الآن" };

/** Large selectable cards — used before the first draft exists. */
export function FormatCards({
  selected,
  busy,
  briefingDisabled,
  carouselOptions,
  onCarouselOptions,
  onSelect,
}: {
  selected: Format;
  busy: boolean;
  briefingDisabled: boolean;
  carouselOptions: CarouselOptions;
  onCarouselOptions: (next: CarouselOptions) => void;
  onSelect: (format: Format) => void;
}) {
  return (
    <div className="formats">
      <div className="formats-grid" role="radiogroup" aria-label="صيغة المحتوى">
        {STORY_FORMATS.map((format) => {
          const Icon = FORMAT_ICONS[format.id];
          const active = selected === format.id;
          return (
            <button
              key={format.id}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={busy}
              className={`format-card ${active ? "is-active" : ""}`}
              onClick={() => onSelect(format.id)}
            >
              <span className="format-icon" aria-hidden="true"><Icon size={22} weight={active ? "fill" : "regular"} /></span>
              <span className="format-copy">
                <span className="format-name">{format.label}</span>
                <span className="format-hint">{format.hint}</span>
              </span>
              <Check className="format-check" size={16} weight="bold" aria-hidden="true" />
            </button>
          );
        })}
      </div>

      <div className={`expand ${selected === "carousel" ? "is-open" : ""}`}>
        <div className="expand-inner">
          <div className="carousel-box">
            <p className="field-label">إعدادات الكاروسيل</p>
            <CarouselControls options={carouselOptions} busy={busy} showApply={false} onChange={onCarouselOptions} />
          </div>
        </div>
      </div>

      <button
        type="button"
        role="radio"
        aria-checked={selected === "briefing"}
        disabled={busy || briefingDisabled}
        className={`format-card format-card--wide ${selected === "briefing" ? "is-active" : ""}`}
        onClick={() => onSelect("briefing")}
      >
        <span className="format-icon" aria-hidden="true"><Stack size={22} weight={selected === "briefing" ? "fill" : "regular"} /></span>
        <span className="format-copy">
          <span className="format-name">{BRIEFING.label}</span>
          <span className="format-hint">{BRIEFING.hint}. لا يعتمد على الخبر المحدد.</span>
        </span>
        <Check className="format-check" size={16} weight="bold" aria-hidden="true" />
      </button>
    </div>
  );
}

/** Compact scrolling switch — used on a finished draft to re-write it in another format. */
export function FormatSwitch({
  selected,
  busy,
  briefingDisabled,
  carouselOptions,
  onCarouselOptions,
  onApplyCarousel,
  onSelect,
}: {
  selected: Format;
  busy: boolean;
  briefingDisabled: boolean;
  carouselOptions: CarouselOptions;
  onCarouselOptions: (next: CarouselOptions) => void;
  onApplyCarousel: () => void;
  onSelect: (format: Format) => void;
}) {
  const choices = [...STORY_FORMATS, { ...BRIEFING }];
  return (
    <div className="format-switch">
      <div className="chip-scroll" role="group" aria-label="إعادة الكتابة بصيغة أخرى">
        {choices.map((option) => {
          const Icon = FORMAT_ICONS[option.id];
          const active = selected === option.id;
          return (
            <button
              key={option.id}
              type="button"
              className={`chip ${active ? "is-active" : ""}`}
              aria-pressed={active}
              title={storyFormatMeta(option.id).hint}
              disabled={busy || (option.id === "briefing" && briefingDisabled)}
              onClick={() => onSelect(option.id)}
            >
              <Icon size={16} weight={active ? "fill" : "regular"} aria-hidden="true" />
              {option.label}
            </button>
          );
        })}
      </div>
      {selected === "carousel" ? (
        <details className="carousel-box carousel-box--inline">
          <summary>إعدادات الكاروسيل</summary>
          <CarouselControls options={carouselOptions} busy={busy} showApply onChange={onCarouselOptions} onApply={onApplyCarousel} />
        </details>
      ) : null}
    </div>
  );
}
