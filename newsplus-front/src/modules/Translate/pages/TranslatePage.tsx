import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowsLeftRight, Check, CircleNotch, Copy, FileText, Translate } from "@phosphor-icons/react";
import { readDeskHandoff } from "@/services/deskHandoff";
import { translateContent } from "@/services/translateService";
import { QuotaNotice } from "@/components/QuotaNotice";
import { copyText, isOpenAIQuotaError, toolErrorMessage } from "@/services/toolErrors";
import type { TranslateLanguage } from "@newsplus/shared";
import "../translate.css";

type MobilePane = "source" | "output";

function charCount(value: string) {
  return value.trim().length;
}

export default function TranslatePage() {
  const handoff = readDeskHandoff(useLocation().state);
  const [source, setSource] = useState(() => handoff?.source ?? "");
  const [target, setTarget] = useState<TranslateLanguage>("en");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [mobilePane, setMobilePane] = useState<MobilePane>("source");

  const mutation = useMutation({
    mutationFn: translateContent,
    onSuccess: () => setMobilePane("output"),
    onError: () => setMobilePane("source"),
  });

  const result = mutation.data;
  const translated = result?.translated ?? "";
  const looksUrl = /^https?:\/\/\S+$/i.test(source.trim());
  const sourceLimit = looksUrl ? 2_000 : 20_000;
  const sourceTooLong = charCount(source) > sourceLimit;
  const extractedSource = looksUrl && result ? result.original : null;
  const displayedSource = extractedSource ?? source;
  const languageName = (language: string) => language === "ar" ? "العربية" : language === "en" ? "الإنجليزية" : "لغة أخرى";

  function resetResult() {
    mutation.reset();
    setCopied(false);
    setCopyError(false);
  }

  function changeTarget(next: TranslateLanguage) {
    if (mutation.isPending || next === target) return;
    setTarget(next);
    resetResult();
    setMobilePane("source");
  }

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  function swap() {
    if (mutation.isPending) return;
    setTarget(result?.sourceLanguage === "ar" || result?.sourceLanguage === "en"
      ? result.sourceLanguage
      : target === "ar" ? "en" : "ar");
    if (result) {
      setSource(result.translated);
    }
    resetResult();
    setMobilePane("source");
  }

  function onSubmit() {
    const trimmed = source.trim();
    if (!trimmed || mutation.isPending || sourceTooLong) return;
    setCopied(false);
    setCopyError(false);
    mutation.mutate(looksUrl ? { url: trimmed, target } : { text: trimmed, target });
  }

  return (
    <div className="news-desk translate-desk">
      <header className="news-desk-head">
        <div className="news-desk-head-row">
          <div>
            <h1 className="news-title">ترجمة صحفية</h1>
            <p className="translate-intro">من المصدر إلى صياغة صحفية دقيقة، مع الحفاظ على المعنى والتفاصيل.</p>
          </div>
          <div className="news-live">
            <span className="translate-control-label">الترجمة إلى</span>
            <div className="news-seg" role="group" aria-label="لغة الهدف">
              <button
                type="button"
                className={`news-seg-btn ${target === "ar" ? "is-active" : ""}`}
                aria-pressed={target === "ar"}
                disabled={mutation.isPending}
                onClick={() => changeTarget("ar")}
              >
                عربي
              </button>
              <button
                type="button"
                className={`news-seg-btn ${target === "en" ? "is-active" : ""}`}
                aria-pressed={target === "en"}
                disabled={mutation.isPending}
                onClick={() => changeTarget("en")}
              >
                <span lang="en">English</span>
              </button>
            </div>
            <button type="button" className="news-refresh" onClick={swap} disabled={mutation.isPending} aria-label="تبديل اتجاه الترجمة">
              <ArrowsLeftRight size={15} aria-hidden="true" />
              <span className="news-refresh-label">تبديل</span>
            </button>
          </div>
        </div>
      </header>

      <div className="news-pane-tabs md:hidden" role="group" aria-label="أقسام الترجمة">
        <button
          type="button"
          aria-pressed={mobilePane === "source"}
          aria-controls="translate-source-pane"
          className={mobilePane === "source" ? "is-active" : ""}
          onClick={() => setMobilePane("source")}
        >
          <FileText size={16} aria-hidden="true" />
          الأصل
        </button>
        <button
          type="button"
          aria-pressed={mobilePane === "output"}
          aria-controls="translate-output-pane"
          className={mobilePane === "output" ? "is-active" : ""}
          onClick={() => setMobilePane("output")}
        >
          <Translate size={16} aria-hidden="true" />
          الترجمة
        </button>
      </div>

      <form
        className="news-panes"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <section id="translate-source-pane" className={`news-pane ${mobilePane === "source" ? "" : "max-md:hidden"}`} aria-label="المصدر">
          <div className="news-pane-bar">
            <p className="news-pane-label"><FileText size={16} aria-hidden="true" />{extractedSource ? "النص المستخرج" : looksUrl ? "رابط المصدر" : "النص الأصلي"}</p>
            <p className="news-pane-meta"><bdi>{charCount(displayedSource).toLocaleString("ar-EG")}</bdi> حرف</p>
          </div>
          {extractedSource && (
            <div className="translate-source-link">
              <span dir="ltr" title={source}>{source}</span>
              <button type="button" onClick={resetResult} disabled={mutation.isPending}>تعديل المصدر</button>
            </div>
          )}
          <div className="news-pane-scroll news-pane-editor">
            <label className="sr-only" htmlFor="translate-source">
              النص الأصلي
            </label>
            <textarea
              id="translate-source"
              className="tool-desk-textarea tool-desk-textarea--fill"
              value={displayedSource}
              readOnly={Boolean(extractedSource)}
              disabled={mutation.isPending}
              aria-invalid={sourceTooLong}
              onChange={(event) => {
                setSource(event.target.value);
                resetResult();
              }}
              placeholder="الصق نص الخبر أو رابط المقال هنا…"
              aria-describedby="translate-source-hint"
              dir="auto"
            />
          </div>
          <div className="news-desk-actions gen-assign-foot">
            <p id="translate-source-hint" className={sourceTooLong ? "tool-desk-hint is-error" : "translate-footnote"}>
              {sourceTooLong
                ? `المصدر يتجاوز ${sourceLimit.toLocaleString("ar-EG")} حرف. ${looksUrl ? "استخدم رابطاً أقصر أو الصق نص المقال." : "قسّم النص إلى أجزاء كاملة للترجمة."}`
                : "نص كامل وفقرات متسقة، مع الحفاظ على الأسماء والأرقام والاقتباسات."}
            </p>
            {mutation.error ? (
              isOpenAIQuotaError(mutation.error) ? (
                <QuotaNotice />
              ) : (
                <p className="tool-desk-hint is-error" role="alert">{toolErrorMessage(mutation.error)}</p>
              )
            ) : null}
            <button type="submit" className="news-btn-primary news-format-generate" disabled={mutation.isPending || !source.trim() || sourceTooLong}>
              {mutation.isPending ? <CircleNotch className="news-spin" size={18} aria-hidden="true" /> : <Translate size={18} aria-hidden="true" />}
              {mutation.isPending ? "جارٍ إعداد الترجمة…" : `ترجمة إلى ${languageName(target)}`}
            </button>
          </div>
        </section>

        <section id="translate-output-pane" className={`news-pane news-desk-pane ${mobilePane === "output" ? "" : "max-md:hidden"}`} aria-label="الترجمة" aria-busy={mutation.isPending}>
          <div className="news-pane-bar news-desk-bar">
            <p className="news-pane-label"><Translate size={16} aria-hidden="true" />الترجمة الصحفية</p>
            {mutation.isPending ? (
              <p className="news-desk-busy" aria-live="polite">
                <CircleNotch className="news-spin" size={14} aria-hidden="true" />
                جارٍ الترجمة…
              </p>
            ) : translated ? (
              <p className="news-pane-meta">
                {languageName(result?.targetLanguage ?? target)}
              </p>
            ) : <p className="news-pane-meta">{languageName(target)}</p>}
          </div>
          <div className="news-desk-main">
            <div className="news-pane-scroll news-desk-body">
              {!translated && !mutation.isPending && (
                <div className="news-desk-empty">
                  <Translate size={32} weight="thin" aria-hidden="true" />
                  <h2>الخبر بلغته الجديدة</h2>
                  <p>أضف المصدر واختر لغة الترجمة. سيظهر النص هنا للمراجعة جنباً إلى جنب مع الأصل.</p>
                  <span className="translate-empty-note">صياغة طبيعية · تفاصيل محفوظة</span>
                </div>
              )}
              {mutation.isPending && (
                <p className="news-state" role="status">
                  <CircleNotch className="news-spin" size={18} aria-hidden="true" />
                  جارٍ ترجمة النص ومراجعة الصياغة…
                </p>
              )}
              {translated && !mutation.isPending && (
                <article className="translate-copy" dir={result?.targetLanguage === "ar" ? "rtl" : "ltr"} lang={result?.targetLanguage ?? target} aria-label="النص المترجم">
                  {translated}
                </article>
              )}
            </div>
            {translated && !mutation.isPending && (
              <div className="translate-result-footer">
                <div>
                  <p className="translate-result-meta">{languageName(result?.sourceLanguage ?? "other")} إلى {languageName(result?.targetLanguage ?? target)} · <bdi>{charCount(translated).toLocaleString("ar-EG")}</bdi> حرف</p>
                  <p className="translate-footnote">راجع النص قبل النشر.</p>
                </div>
                <button
                  type="button"
                  className="news-btn-secondary"
                  onClick={async () => {
                    try {
                      await copyText(translated);
                      setCopied(true);
                      setCopyError(false);
                    } catch {
                      setCopyError(true);
                    }
                  }}
                >
                  {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                  {copied ? "تم النسخ" : "نسخ الترجمة"}
                </button>
                {copyError && <p className="translate-copy-error" role="alert">تعذّر النسخ. يمكنك تحديد النص ونسخه يدوياً.</p>}
              </div>
            )}
          </div>
        </section>
      </form>
      <p className="sr-only" role="status">{copied ? "تم نسخ الترجمة" : translated && !mutation.isPending ? "اكتملت الترجمة وأصبحت متاحة للمراجعة" : ""}</p>
    </div>
  );
}
