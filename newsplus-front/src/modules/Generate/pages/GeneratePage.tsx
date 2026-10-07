import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  Check,
  CircleNotch,
  Copy,
  DownloadSimple,
  FileText,
  LinkSimple,
  PencilSimple,
  Translate,
} from "@phosphor-icons/react";
import { readDeskHandoff } from "@/services/deskHandoff";
import { generateContent } from "@/services/generateService";
import { QuotaNotice } from "@/components/QuotaNotice";
import { copyText, isOpenAIQuotaError, toolErrorMessage } from "@/services/toolErrors";
import type { GenerateLanguage, GenerateLength, GenerateStyle, GenerateTone } from "@newsplus/shared";
import {
  ANGLES,
  LENGTHS,
  SOURCE_MODE_LABEL,
  STYLE_LABEL,
  STYLES,
  TONES,
  WORD_BAND,
  downloadCopy,
  packCopy,
  pushDraft,
  readDrafts,
  readingMinutes,
  splitHandoff,
  urlHost,
  urlLooksBroken,
  wordCount,
  type GenerateDraft,
} from "../generateDesk";

type MobilePane = "assign" | "copy";
type CopiedKey = "all" | "title" | "dek" | null;

function draftTime(at: number) {
  return new Date(at).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" });
}

export default function GeneratePage() {
  const navigate = useNavigate();
  const handoff = readDeskHandoff(useLocation().state);
  const initial = useMemo(() => splitHandoff(handoff?.prompt || handoff?.input), [handoff?.input, handoff?.prompt]);
  const [url, setUrl] = useState(initial.url);
  const [notes, setNotes] = useState(initial.notes);
  const [angle, setAngle] = useState("");
  const [style, setStyle] = useState<GenerateStyle>(handoff?.style ?? (initial.url ? "brief" : "article"));
  const [language, setLanguage] = useState<GenerateLanguage>("ar");
  const [length, setLength] = useState<GenerateLength>("standard");
  const [tone, setTone] = useState<GenerateTone>("desk");
  const [copied, setCopied] = useState<CopiedKey>(null);
  const [copyError, setCopyError] = useState(false);
  const submittingRef = useRef(false);
  const [mobilePane, setMobilePane] = useState<MobilePane>("assign");
  const [drafts, setDrafts] = useState<GenerateDraft[]>(readDrafts);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(() => readDrafts()[0]?.id ?? null);

  const mutation = useMutation({
    mutationFn: generateContent,
    onSuccess: (data, request) => {
      const submitted = splitHandoff(request.prompt);
      const next = pushDraft({
        ...data,
        style: request.style,
        source: submitted.url || submitted.notes.slice(0, 80),
      });
      setDrafts(next);
      setActiveDraftId(next[0]?.id ?? null);
      setMobilePane("copy");
    },
    onSettled: () => { submittingRef.current = false; },
  });

  const result = drafts.find((item) => item.id === activeDraftId) ?? null;
  const host = urlHost(url);
  const brokenUrl = urlLooksBroken(url);
  const assignmentPrompt = [url.trim(), notes.trim()].filter(Boolean).join("\n\n");
  const tooLong = assignmentPrompt.length > 12_000 || angle.trim().length > 240;
  const canSubmit = assignmentPrompt.length >= 3 && !tooLong && Boolean((url.trim() && host) || notes.trim()) && !brokenUrl;
  const words = result ? wordCount(result.title, result.dek, result.body) : 0;
  const minutes = result ? readingMinutes(words, result.language) : 0;
  const resultStyle = result?.style ?? style;
  const customAngle = (ANGLES as readonly string[]).includes(angle) ? "" : angle;

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(null), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  function onSubmit() {
    if (mutation.isPending || submittingRef.current || !canSubmit) return;
    const sourceUrl = url.trim();
    const assignment = notes.trim();
    const prompt = sourceUrl || assignment;
    if (!prompt || brokenUrl) return;
    setCopied(null);
    setCopyError(false);
    submittingRef.current = true;
    mutation.mutate({
      prompt: [sourceUrl, assignment].filter(Boolean).join("\n\n"),
      style,
      language,
      length,
      tone,
      angle: angle.trim() || undefined,
    });
  }

  const submitRef = useRef(onSubmit);
  submitRef.current = onSubmit;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.key !== "Enter") return;
      event.preventDefault();
      submitRef.current();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function copyPart(key: CopiedKey, value: string) {
    try {
      await copyText(value);
      setCopied(key);
      setCopyError(false);
    } catch {
      setCopied(null);
      setCopyError(true);
    }
  }

  return (
    <div className="news-desk gen-desk">
      <header className="news-desk-head">
        <div className="news-desk-head-row">
          <div>
            <h1 className="news-title">توليد</h1>
            <p className="sr-only">مسودة تحريرية من رابط أو موضوع، جاهزة للمراجعة قبل النشر.</p>
          </div>
        </div>
      </header>

      <div className="news-toolbar">
        <div className="news-filter-bar gen-toolbar-meta">
          <div className="news-seg news-seg--lang" role="group" aria-label="لغة المسودة">
            {(["ar", "en"] as const).map((code) => (
              <button
                key={code}
                type="button"
                className={`news-seg-btn ${language === code ? "is-active" : ""}`}
                aria-pressed={language === code}
                onClick={() => setLanguage(code)}
              >
                {code === "ar" ? "عربي" : "EN"}
              </button>
            ))}
          </div>
          <div className="news-seg" role="group" aria-label="طول المسودة">
            {LENGTHS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`news-seg-btn ${length === item.id ? "is-active" : ""}`}
                aria-pressed={length === item.id}
                onClick={() => setLength(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="news-seg" role="group" aria-label="نبرة المسودة">
            {TONES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`news-seg-btn ${tone === item.id ? "is-active" : ""}`}
                aria-pressed={tone === item.id}
                onClick={() => setTone(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="news-seg news-seg--time" role="radiogroup" aria-label="شكل المسودة">
          {STYLES.map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={style === item.id}
              className={`news-seg-btn ${style === item.id ? "is-active" : ""}`}
              onClick={() => setStyle(item.id)}
            >
              {item.label}
              <span className="news-seg-count">{WORD_BAND[item.id][length].replace(" كلمة", "")}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="news-pane-tabs md:hidden" role="tablist" aria-label="أقسام التوليد">
        <button
          type="button"
          role="tab"
          aria-selected={mobilePane === "assign"}
          className={mobilePane === "assign" ? "is-active" : ""}
          onClick={() => setMobilePane("assign")}
        >
          <PencilSimple size={16} aria-hidden="true" />
          التعيين
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobilePane === "copy"}
          className={mobilePane === "copy" ? "is-active" : ""}
          onClick={() => setMobilePane("copy")}
        >
          <FileText size={16} aria-hidden="true" />
          المسودة
        </button>
      </div>

      <div className="news-panes">
        <form
          className={`news-pane ${mobilePane === "assign" ? "" : "max-md:hidden"}`}
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className="news-pane-bar">
            <p className="news-pane-label">التعيين</p>
            <p className="news-pane-meta">{STYLE_LABEL[style]}</p>
          </div>

          <div className="news-pane-scroll news-pane-editor">
            <label className="news-field-label" htmlFor="generate-url">
              رابط الخبر
            </label>
            <div className={`tool-desk-url ${brokenUrl ? "is-invalid" : host ? "is-ready" : ""}`}>
              <LinkSimple size={16} aria-hidden="true" />
              <input
                id="generate-url"
                className="tool-desk-input"
                type="url"
                inputMode="url"
                autoComplete="url"
                dir="ltr"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://example.com/news/..."
              />
            </div>
            {host && !brokenUrl && (
              <p className="tool-desk-hint">المصدر: {host}. إن تعذر فتح الصفحة يُبحث عن الخبر من الرابط.</p>
            )}
            {brokenUrl && (
              <p className="tool-desk-hint is-error">الرابط غير صالح. امسحه أو أكمل العنوان، أو اترك الحقل فارغاً واكتب موضوعاً.</p>
            )}

            <label className="news-field-label" htmlFor="generate-notes">
              ملاحظات التعيين
            </label>
            <textarea
              id="generate-notes"
              className="tool-desk-textarea"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="موضوع إن لم يتوفر رابط، أو جمهور وتفاصيل تريد التركيز عليها."
            />

            <p className="news-field-label">زاوية التغطية</p>
            <div className="gen-chips">
              {ANGLES.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`news-chip ${angle === item ? "is-active" : ""}`}
                  aria-pressed={angle === item}
                  onClick={() => setAngle((current) => (current === item ? "" : item))}
                >
                  {item}
                </button>
              ))}
            </div>
            <input
              id="generate-angle"
              className="tool-desk-input"
              value={customAngle}
              onChange={(event) => setAngle(event.target.value)}
              placeholder="أو اكتب زاوية أخرى..."
            />
          </div>

          {drafts.length > 0 && (
            <div className="gen-drafts">
              <div className="news-pane-bar">
                <p className="news-pane-label">مسودات الجلسة</p>
                <p className="news-pane-meta">{drafts.length}</p>
              </div>
              <ul>
                {drafts.map((draft) => (
                  <li key={draft.id}>
                    <button
                      type="button"
                      className={`news-feed-item ${activeDraftId === draft.id ? "is-active" : ""}`}
                      onClick={() => {
                        setActiveDraftId(draft.id);
                        setMobilePane("copy");
                      }}
                    >
                      <div className="news-feed-row">
                        <span className="news-source-name">{STYLE_LABEL[draft.style]}</span>
                        <time className="news-time">{draftTime(draft.at)}</time>
                      </div>
                      <p className="news-feed-title">{draft.title}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="news-desk-actions gen-assign-foot">
            {tooLong && <p className="tool-desk-hint is-error" role="alert">الحد الأقصى للتعيين 12,000 حرف وللزاوية 240 حرف.</p>}
            {mutation.error ? (
              isOpenAIQuotaError(mutation.error) ? (
                <QuotaNotice />
              ) : (
                <p className="tool-desk-hint is-error">{toolErrorMessage(mutation.error)}</p>
              )
            ) : null}
            <button type="submit" className="news-btn-primary news-format-generate" disabled={mutation.isPending || !canSubmit}>
              {mutation.isPending ? <CircleNotch className="news-spin" size={16} aria-hidden="true" /> : null}
              {mutation.isPending ? "جاري الكتابة..." : "توليد"}
            </button>
          </div>
        </form>

        <section className={`news-pane news-desk-pane ${mobilePane === "copy" ? "" : "max-md:hidden"}`} aria-label="المسودة">
          <div className="news-pane-bar news-desk-bar">
            <p className="news-pane-label">المسودة</p>
            {mutation.isPending ? (
              <p className="news-desk-busy" aria-live="polite">
                <CircleNotch className="news-spin" size={14} aria-hidden="true" />
                جاري الكتابة...
              </p>
            ) : result ? (
              <p className="news-pane-meta">
                {words} كلمة · {minutes} د
                {result.sourceMode ? ` · ${SOURCE_MODE_LABEL[result.sourceMode]}` : ""}
              </p>
            ) : null}
          </div>

          <div className="news-desk-main">
            {copyError && <p className="tool-desk-hint is-error" role="alert">تعذّر النسخ. يمكنك تحديد النص ونسخه يدويًا.</p>}
            <div className="news-pane-scroll news-desk-body">
              {!result && !mutation.isPending && (
                <div className="news-desk-empty">
                  <p>الصق رابط الخبر أو اكتب الموضوع في التعيين، ثم ولّد المسودة.</p>
                </div>
              )}

              {mutation.isPending && (
                <p className="news-state">
                  <CircleNotch className="news-spin" size={18} aria-hidden="true" />
                  {host && !brokenUrl ? `جاري كتابة المسودة من ${host}...` : "جاري كتابة المسودة..."}
                </p>
              )}

              {result && !mutation.isPending && (
                <article className="gen-proof" dir={result.language === "ar" ? "rtl" : "ltr"}>
                  <h2 className="news-story-title">{result.title}</h2>
                  {result.dek && <p className="news-story-excerpt gen-dek">{result.dek}</p>}
                  <div className="gen-body">{result.body}</div>
                </article>
              )}
            </div>

            {result && !mutation.isPending && (
              <div className="tool-desk-actions">
                <button type="button" className="news-btn-secondary" onClick={() => copyPart("all", packCopy(result))}>
                  {copied === "all" ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                  {copied === "all" ? "تم النسخ" : "نسخ الكل"}
                </button>
                <button type="button" className="news-btn-secondary" onClick={() => copyPart("title", result.title)}>
                  {copied === "title" ? "نُسخ العنوان" : "العنوان"}
                </button>
                {result.dek && (
                  <button type="button" className="news-btn-secondary" onClick={() => copyPart("dek", result.dek)}>
                    {copied === "dek" ? "نُسخت المقدمة" : "المقدمة"}
                  </button>
                )}
                <button type="button" className="news-btn-secondary" onClick={() => downloadCopy(result, resultStyle)}>
                  <DownloadSimple size={16} aria-hidden="true" />
                  تنزيل
                </button>
                <button
                  type="button"
                  className="news-btn-secondary"
                  onClick={() => navigate("/translate", { state: { source: packCopy(result) } })}
                >
                  <Translate size={16} aria-hidden="true" />
                  ترجمة
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
