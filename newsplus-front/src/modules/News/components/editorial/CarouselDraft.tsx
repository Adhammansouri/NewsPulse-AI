import { useState } from "react";
import { Check, Copy } from "@phosphor-icons/react";
import type { CarouselSlide, NewsSummarizeData } from "@newsplus/shared";
import { copyText } from "@/services/toolErrors";
import { hasArabic } from "../../newsFormat";
import { SourceMark } from "../../SourceMark";

export function CarouselDraft({
  data,
  slides,
}: {
  data: NewsSummarizeData;
  slides: CarouselSlide[];
}) {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState("");
  const count = slides.length;
  const index = Math.min(active, Math.max(0, count - 1));
  const slide = slides[index];
  const style = data.carousel?.style === "frame" ? "card" : "story";
  const source = data.sources[0];
  const tags = data.bullets
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => (item.startsWith("#") || item.startsWith("＃") ? item : `#${item.replace(/\s+/g, "")}`));

  async function copyValue(key: string, value: string) {
    await copyText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(""), 1400);
  }

  if (!slide) return null;

  return (
    <div className="news-carousel">
      <div className="news-carousel-dots" role="tablist" aria-label="شرائح الكاروسيل">
        {slides.map((item, dot) => (
          <button
            key={item.index}
            type="button"
            role="tab"
            aria-selected={dot === index}
            className={dot === index ? "is-active" : ""}
            onClick={() => setActive(dot)}
          >
            {dot + 1}
          </button>
        ))}
      </div>

      <article className={`news-slide-copy is-${style}`} aria-label={`شريحة ${index + 1}`}>
        <h3 dir={hasArabic(slide.headline) ? "rtl" : "ltr"}>{slide.headline}</h3>
        {slide.banner ? (
          <p className="news-slide-punch" dir={hasArabic(slide.banner) ? "rtl" : "ltr"}>
            {slide.banner}
          </p>
        ) : null}
        {slide.attribution ? (
          <p className="news-slide-dek" dir={hasArabic(slide.attribution) ? "rtl" : "ltr"}>
            {slide.attribution}
          </p>
        ) : null}
        {source ? (
          <p className="news-slide-source">
            <SourceMark id="" name={source.name} url={source.url} size={14} />
            {source.name}
          </p>
        ) : null}
      </article>

      <div className="news-carousel-tools">
        <button type="button" className="news-btn-secondary" onClick={() => void copyValue("slide", slideText(slide))}>
          {copied === "slide" ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
          نسخ الشريحة
        </button>
        <button
          type="button"
          className="news-btn-secondary"
          onClick={() => void copyValue("all", allText(slides, data.summary, tags))}
        >
          {copied === "all" ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
          نسخ الكل
        </button>
      </div>

      {data.summary ? (
        <>
          <p className="news-field-label">الكابشن</p>
          <p className="news-summary-body" dir={hasArabic(data.summary) ? "rtl" : "ltr"}>
            {data.summary}
          </p>
        </>
      ) : null}
      {tags.length > 0 ? (
        <ul className="news-social-tags" aria-label="وسوم">
          {tags.map((tag) => (
            <li key={tag} dir="ltr">
              {tag}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function slideText(slide: CarouselSlide) {
  return [slide.headline, slide.banner, slide.attribution].filter(Boolean).join("\n");
}

function allText(slides: CarouselSlide[], caption: string, tags: string[]) {
  const blocks = slides.map((slide, index) => `شريحة ${index + 1}\n${slideText(slide)}`);
  return [...blocks, caption, tags.join(" ")].filter(Boolean).join("\n\n");
}
