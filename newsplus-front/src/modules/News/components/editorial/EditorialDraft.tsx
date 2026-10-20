import type { NewsSummarizeData } from "@newsplus/shared";
import { hasArabic, splitSocialBullets, storyFormatMeta } from "../../newsFormat";
import { SourceMark } from "../../SourceMark";
import { CarouselDraft } from "./CarouselDraft";

function dirOf(text: string) {
  return hasArabic(text) ? "rtl" : "ltr";
}

/** The finished piece, set for reading: one column, generous leading. */
export function EditorialDraft({ data, format }: { data: NewsSummarizeData; format: NewsSummarizeData["format"] }) {
  const meta = storyFormatMeta(format);
  const isSocial = format === "social";
  const factsFirst = format === "facts";
  const { tags, alts } = isSocial ? splitSocialBullets(data.bullets) : { tags: [] as string[], alts: data.bullets };
  const listItems = isSocial ? alts : data.bullets;
  const hideBody = factsFirst && data.summary.length < 40;

  return (
    <article className={`doc is-${format}`}>
      <p className="doc-kind">
        <span className="badge badge-brand">{meta.ready}</span>
        {data.versionNumber ? <span className="badge">نسخة {data.versionNumber}</span> : null}
      </p>

      {format === "carousel" && data.carousel ? (
        <CarouselDraft data={data} slides={data.carousel.slides} />
      ) : format === "video" ? (
        <VideoScript data={data} />
      ) : (
        <>
          <h2 className="doc-title" dir={dirOf(data.title)}>{data.title}</h2>
          {data.dek ? <p className="doc-dek" dir={dirOf(data.dek)}>{data.dek}</p> : null}
          {!factsFirst && data.summary ? <p className="doc-body" dir={dirOf(data.summary)}>{data.summary}</p> : null}
          {isSocial && tags.length > 0 ? (
            <ul className="doc-tags" aria-label="وسوم">
              {tags.map((tag) => <li key={tag} dir="ltr">{tag}</li>)}
            </ul>
          ) : null}
          {isSocial && alts.length > 0 ? <p className="doc-label">صياغات أخرى</p> : null}
          {listItems.length > 0 ? (
            <ul className={`doc-list ${factsFirst ? "is-facts" : ""}`}>
              {listItems.map((bullet) => <li key={bullet} dir={dirOf(bullet)}>{bullet}</li>)}
            </ul>
          ) : null}
          {factsFirst && !hideBody && data.summary ? <p className="doc-body" dir={dirOf(data.summary)}>{data.summary}</p> : null}
        </>
      )}

      {data.sources.length > 0 ? (
        <footer className="doc-sources">
          <p className="doc-label">المصادر</p>
          <ul>
            {data.sources.map((source) => (
              <li key={`${source.name}-${source.url}`}>
                <a href={source.url} target="_blank" rel="noreferrer">
                  <SourceMark id="" name={source.name} url={source.url} size={18} />
                  {source.name}
                </a>
              </li>
            ))}
          </ul>
        </footer>
      ) : null}
    </article>
  );
}

function VideoScript({ data }: { data: NewsSummarizeData }) {
  return (
    <div className="doc-video">
      <p className="doc-label">عنوان النشر</p>
      <h2 className="doc-title" dir={dirOf(data.title)}>{data.title}</h2>
      {data.dek ? (
        <>
          <p className="doc-label">الكوفر</p>
          <p className="doc-dek" dir={dirOf(data.dek)}>{data.dek}</p>
        </>
      ) : null}
      {data.summary ? (
        <>
          <p className="doc-label">النص</p>
          <p className="doc-body" dir={dirOf(data.summary)}>{data.summary}</p>
        </>
      ) : null}
      {data.bullets.length > 0 ? (
        <>
          <p className="doc-label">لقطات ورسوم</p>
          <ul className="doc-list">
            {data.bullets.map((bullet) => <li key={bullet} dir={dirOf(bullet)}>{bullet}</li>)}
          </ul>
        </>
      ) : null}
    </div>
  );
}
