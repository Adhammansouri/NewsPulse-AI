import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowsLeftRight, Check, CircleNotch, Copy, FileText, Translate } from "@phosphor-icons/react";
import { readDeskHandoff } from "@/services/deskHandoff";
import { translateContent } from "@/services/translateService";
import { copyText, toolErrorMessage } from "@/services/toolErrors";
import type { TranslateLanguage } from "@newsplus/shared";

type MobilePane = "source" | "output";

function charCount(value: string) {
  return value.trim().length;
}

export default function TranslatePage() {
  const handoff = readDeskHandoff(useLocation().state);
  const [source, setSource] = useState(() => handoff?.source ?? "");
  const [target, setTarget] = useState<TranslateLanguage>("en");
  const [copied, setCopied] = useState(false);
  const [mobilePane, setMobilePane] = useState<MobilePane>("source");

  const mutation = useMutation({
    mutationFn: translateContent,
    onSuccess: () => setMobilePane("output"),
  });

  const result = mutation.data;
  const translated = result?.translated ?? "";
  const looksUrl = /^https?:\/\//i.test(source.trim()) && !source.includes("\n") && source.trim().length < 500;

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  function swap() {
    setTarget((current) => (current === "ar" ? "en" : "ar"));
    if (result) {
      setSource(result.translated);
      mutation.reset();
      setMobilePane("source");
    }
  }

  function onSubmit() {
    const trimmed = source.trim();
    if (!trimmed) return;
    setCopied(false);
    mutation.mutate(looksUrl ? { url: trimmed, target } : { text: trimmed, target });
  }

  return (
    <div className="news-desk">
      <header className="news-desk-head">
        <div className="news-desk-head-row">
          <div>
            <h1 className="news-title">ترجمة</h1>
            <p className="sr-only">نص أو رابط، عربي وإنجليزي جنباً إلى جنب للمراجعة قبل النقل.</p>
          </div>
          <div className="news-live">
            <div className="news-seg" role="group" aria-label="لغة الهدف">
              <button
                type="button"
                className={`news-seg-btn ${target === "ar" ? "is-active" : ""}`}
                aria-pressed={target === "ar"}
                onClick={() => setTarget("ar")}
              >
                عربي
              </button>
              <button
                type="button"
                className={`news-seg-btn ${target === "en" ? "is-active" : ""}`}
                aria-pressed={target === "en"}
                onClick={() => setTarget("en")}
              >
                EN
              </button>
            </div>
            <button type="button" className="news-refresh" onClick={swap}>
              <ArrowsLeftRight size={15} aria-hidden="true" />
              <span className="news-refresh-label">تبديل</span>
            </button>
          </div>
        </div>
      </header>

      <div className="news-pane-tabs md:hidden" role="tablist" aria-label="أقسام الترجمة">
        <button
          type="button"
          role="tab"
          aria-selected={mobilePane === "source"}
          className={mobilePane === "source" ? "is-active" : ""}
          onClick={() => setMobilePane("source")}
        >
          <FileText size={16} aria-hidden="true" />
          الأصل
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobilePane === "output"}
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
        <section className={`news-pane ${mobilePane === "source" ? "" : "max-md:hidden"}`}>
          <div className="news-pane-bar">
            <p className="news-pane-label">{looksUrl ? "رابط المصدر" : "النص الأصلي"}</p>
            <p className="news-pane-meta">{charCount(source)} حرف</p>
          </div>
          <div className="news-pane-scroll news-pane-editor">
            <label className="sr-only" htmlFor="translate-source">
              النص الأصلي
            </label>
            <textarea
              id="translate-source"
              className="tool-desk-textarea tool-desk-textarea--fill"
              value={source}
              onChange={(event) => {
                setSource(event.target.value);
                mutation.reset();
              }}
              placeholder="الصق النص أو رابط المحتوى للترجمة..."
              dir="auto"
            />
          </div>
          <div className="news-desk-actions gen-assign-foot">
            {mutation.error && <p className="tool-desk-hint is-error">{toolErrorMessage(mutation.error)}</p>}
            <button type="submit" className="news-btn-primary news-format-generate" disabled={mutation.isPending || !source.trim()}>
              {mutation.isPending ? <CircleNotch className="news-spin" size={16} aria-hidden="true" /> : null}
              {mutation.isPending ? "جاري الترجمة..." : "ترجمة"}
            </button>
          </div>
        </section>

        <section className={`news-pane news-desk-pane ${mobilePane === "output" ? "" : "max-md:hidden"}`} aria-label="الترجمة">
          <div className="news-pane-bar news-desk-bar">
            <p className="news-pane-label">الترجمة</p>
            {mutation.isPending ? (
              <p className="news-desk-busy" aria-live="polite">
                <CircleNotch className="news-spin" size={14} aria-hidden="true" />
                جاري الترجمة...
              </p>
            ) : translated ? (
              <p className="news-pane-meta">
                {result?.sourceLanguage ?? "?"} إلى {result?.targetLanguage ?? target} · {charCount(translated)} حرف
              </p>
            ) : null}
          </div>
          <div className="news-desk-main">
            <div className="news-pane-scroll news-desk-body">
              {!translated && !mutation.isPending && (
                <div className="news-desk-empty">
                  <p>الصق النص أو الرابط في الأصل، ثم اطلب الترجمة.</p>
                </div>
              )}
              {mutation.isPending && (
                <p className="news-state">
                  <CircleNotch className="news-spin" size={18} aria-hidden="true" />
                  جاري إعداد النص المترجم...
                </p>
              )}
              {translated && !mutation.isPending && (
                <p className="gen-body" dir="auto">
                  {translated}
                </p>
              )}
            </div>
            {translated && !mutation.isPending && (
              <div className="tool-desk-actions">
                <button
                  type="button"
                  className="news-btn-secondary"
                  onClick={async () => {
                    await copyText(translated);
                    setCopied(true);
                  }}
                >
                  {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                  {copied ? "تم النسخ" : "نسخ الترجمة"}
                </button>
              </div>
            )}
          </div>
        </section>
      </form>
    </div>
  );
}
