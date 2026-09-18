import { Check, Copy } from "@phosphor-icons/react";
import type { NewsSummarizeData } from "@newsplus/shared";
import { hasArabic, splitSocialBullets, storyFormatMeta } from "../../newsFormat";
import { SourceMark } from "../../SourceMark";

export function EditorialDraft({
  data,
  format,
  busy,
  copied,
  hideCopy = false,
  onCopy,
}: {
  data: NewsSummarizeData;
  format: NewsSummarizeData["format"];
  busy: boolean;
  copied: boolean;
  hideCopy?: boolean;
  onCopy: () => void;
}) {
  const meta = storyFormatMeta(format);
  const isVideo = format === "video";
  const factsFirst = format === "facts";
  const isSocial = format === "social";
  const { tags, alts } = isSocial ? splitSocialBullets(data.bullets) : { tags: [] as string[], alts: data.bullets };
  const hideBody = format === "facts" && data.summary.length < 40;
  const bodyBeforeBullets = !factsFirst;
  const listItems = isSocial ? alts : data.bullets;

  return (
    <div className={`news-summary is-${format}`}>
      <div className="news-summary-bar">
        <p className="news-state is-ready">
          <Check size={16} aria-hidden="true" />
          {meta.ready}
          {data.versionNumber ? <span className="news-version-chip">ن{data.versionNumber}</span> : null}
        </p>
        {hideCopy ? null : (
          <div className="news-summary-tools">
            <button type="button" className="news-btn-secondary" onClick={onCopy} disabled={busy}>
              {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
              {copied ? "تم النسخ" : "نسخ"}
            </button>
          </div>
        )}
      </div>

      {isVideo ? (
        <VideoScript data={data} />
      ) : (
        <>
          <h2 className="news-story-title" dir={hasArabic(data.title) ? "rtl" : "ltr"}>
            {data.title}
          </h2>
          {data.dek && (
            <p className="news-story-excerpt" dir={hasArabic(data.dek) ? "rtl" : "ltr"}>
              {data.dek}
            </p>
          )}
          {bodyBeforeBullets && data.summary ? (
            <p className="news-summary-body" dir={hasArabic(data.summary) ? "rtl" : "ltr"}>
              {data.summary}
            </p>
          ) : null}
          {isSocial && tags.length > 0 ? (
            <ul className="news-social-tags" aria-label="وسوم">
              {tags.map((tag) => (
                <li key={tag} dir="ltr">
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
          {isSocial && alts.length > 0 ? <p className="news-field-label">صياغات أخرى</p> : null}
          {listItems.length > 0 && (
            <ul className={`news-bullets ${factsFirst ? "is-facts" : ""}`}>
              {listItems.map((bullet) => (
                <li key={bullet} dir={hasArabic(bullet) ? "rtl" : "ltr"}>
                  {bullet}
                </li>
              ))}
            </ul>
          )}
          {!bodyBeforeBullets && !hideBody && data.summary ? (
            <p className="news-summary-body" dir={hasArabic(data.summary) ? "rtl" : "ltr"}>
              {data.summary}
            </p>
          ) : null}
        </>
      )}

      {data.sources.length > 0 && (
        <div className="news-links">
          <p className="news-field-label">المصادر</p>
          {data.sources.map((source) => (
            <a key={`${source.name}-${source.url}`} href={source.url} target="_blank" rel="noreferrer">
              <SourceMark id="" name={source.name} url={source.url} size={14} />
              {source.name}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function VideoScript({ data }: { data: NewsSummarizeData }) {
  return (
    <div className="news-video-script">
      <p className="news-field-label">عنوان النشر</p>
      <h2 className="news-story-title" dir={hasArabic(data.title) ? "rtl" : "ltr"}>
        {data.title}
      </h2>
      {data.dek ? (
        <>
          <p className="news-field-label">الكوفر</p>
          <p className="news-video-cover" dir={hasArabic(data.dek) ? "rtl" : "ltr"}>
            {data.dek}
          </p>
        </>
      ) : null}
      {data.summary ? (
        <>
          <p className="news-field-label">النص</p>
          <p className="news-summary-body news-video-body" dir={hasArabic(data.summary) ? "rtl" : "ltr"}>
            {data.summary}
          </p>
        </>
      ) : null}
      {data.bullets.length > 0 ? (
        <>
          <p className="news-field-label">لقطات / CG</p>
          <ul className="news-bullets">
            {data.bullets.map((bullet) => (
              <li key={bullet} dir={hasArabic(bullet) ? "rtl" : "ltr"}>
                {bullet}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
