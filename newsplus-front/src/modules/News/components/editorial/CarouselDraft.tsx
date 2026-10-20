import { useState } from "react";
import type { CarouselSlide, NewsSummarizeData } from "@newsplus/shared";
import { CopyButton } from "@/components/ui/CopyButton";
import { hasArabic } from "../../newsFormat";
import { SourceMark } from "../../SourceMark";

function slideText(slide: CarouselSlide) {
  return [slide.headline, slide.banner, slide.attribution].filter(Boolean).join("\n");
}

function hashtags(bullets: string[]) {
  return bullets
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => (item.startsWith("#") || item.startsWith("＃") ? item : `#${item.replace(/\s+/g, "")}`));
}

export function CarouselDraft({ data, slides }: { data: NewsSummarizeData; slides: CarouselSlide[] }) {
  const [active, setActive] = useState(0);
  const index = Math.min(active, Math.max(0, slides.length - 1));
  const slide = slides[index];
  const style = data.carousel?.style === "frame" ? "card" : "story";
  const source = data.sources[0];
  const tags = hashtags(data.bullets);
  if (!slide) return null;

  const all = () =>
    [...slides.map((item, i) => `شريحة ${i + 1}\n${slideText(item)}`), data.summary, tags.join(" ")].filter(Boolean).join("\n\n");

  return (
    <div className="carousel">
      <div className="carousel-tabs" role="tablist" aria-label="شرائح الكاروسيل">
        {slides.map((item, dot) => (
          <button key={item.index} type="button" role="tab" aria-selected={dot === index} className={dot === index ? "is-active" : ""} onClick={() => setActive(dot)}>
            {dot + 1}
          </button>
        ))}
      </div>

      <article key={index} className={`slide is-${style}`} aria-label={`شريحة ${index + 1} من ${slides.length}`}>
        <h3 dir={hasArabic(slide.headline) ? "rtl" : "ltr"}>{slide.headline}</h3>
        {slide.banner ? <p className="slide-banner" dir={hasArabic(slide.banner) ? "rtl" : "ltr"}>{slide.banner}</p> : null}
        {slide.attribution ? <p className="slide-attr" dir={hasArabic(slide.attribution) ? "rtl" : "ltr"}>{slide.attribution}</p> : null}
        {source ? (
          <p className="slide-source">
            <SourceMark id="" name={source.name} url={source.url} size={16} />
            {source.name}
          </p>
        ) : null}
      </article>

      <div className="carousel-actions">
        <CopyButton className="btn btn-quiet btn-sm" label="نسخ الشريحة" getText={() => slideText(slide)} toastMessage="تم نسخ الشريحة" />
        <CopyButton className="btn btn-quiet btn-sm" label="نسخ الكل" getText={all} toastMessage="تم نسخ الشرائح والكابشن" />
      </div>

      {data.summary ? (
        <>
          <p className="doc-label">الكابشن</p>
          <p className="doc-body" dir={hasArabic(data.summary) ? "rtl" : "ltr"}>{data.summary}</p>
        </>
      ) : null}
      {tags.length > 0 ? (
        <ul className="doc-tags" aria-label="وسوم">
          {tags.map((tag) => <li key={tag} dir="ltr">{tag}</li>)}
        </ul>
      ) : null}
    </div>
  );
}
