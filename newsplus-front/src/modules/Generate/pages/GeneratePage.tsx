import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { DownloadSimple, FileText, LinkSimple, PencilSimple, Translate, WarningCircle } from "@phosphor-icons/react";
import type { GenerateLanguage, GenerateLength, GenerateStyle, GenerateTone } from "@newsplus/shared";
import { QuotaNotice } from "@/components/QuotaNotice";
import { CopyButton } from "@/components/ui/CopyButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Segmented } from "@/components/ui/Segmented";
import { readDeskHandoff } from "@/services/deskHandoff";
import { generateContent } from "@/services/generateService";
import { isOpenAIQuotaError, toolErrorMessage } from "@/services/toolErrors";
import { formatNumber, formatTime } from "@/utils/format";
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

type Pane = "assign" | "draft";

const LANGS = [
  { id: "ar" as const, label: "عربي" },
  { id: "en" as const, label: "English" },
];

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
  const [pane, setPane] = useState<Pane>("assign");
  const [drafts, setDrafts] = useState<GenerateDraft[]>(readDrafts);
  const [activeId, setActiveId] = useState<string | null>(() => readDrafts()[0]?.id ?? null);
  const submitting = useRef(false);

  const mutation = useMutation({
    mutationFn: generateContent,
    onSuccess: (data, request) => {
      const submitted = splitHandoff(request.prompt);
      const next = pushDraft({ ...data, style: request.style, source: submitted.url || submitted.notes.slice(0, 80) });
      setDrafts(next);
      setActiveId(next[0]?.id ?? null);
      setPane("draft");
    },
    onSettled: () => {
      submitting.current = false;
    },
  });

  const result = drafts.find((item) => item.id === activeId) ?? null;
  const host = urlHost(url);
  const brokenUrl = urlLooksBroken(url);
  const prompt = [url.trim(), notes.trim()].filter(Boolean).join("\n\n");
  const tooLong = prompt.length > 12_000 || angle.trim().length > 240;
  const canSubmit = prompt.length >= 3 && !tooLong && Boolean((url.trim() && host) || notes.trim()) && !brokenUrl;
  const words = result ? wordCount(result.title, result.dek, result.body) : 0;
  const customAngle = (ANGLES as readonly string[]).includes(angle) ? "" : angle;

  function submit() {
    if (mutation.isPending || submitting.current || !canSubmit) return;
    submitting.current = true;
    mutation.mutate({ prompt, style, language, length, tone, angle: angle.trim() || undefined });
  }

  const submitRef = useRef(submit);
  submitRef.current = submit;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.key !== "Enter") return;
      event.preventDefault();
      submitRef.current();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="ws">
      <header className="ws-head">
        <div className="ws-title">
          <h1 className="page-title">توليد</h1>
          <p className="ws-lede">مسودة تحريرية من رابط أو موضوع، جاهزة للمراجعة قبل النشر.</p>
        </div>
      </header>

      <div className="ws-tabs">
        <Segmented
          value={pane}
          onChange={setPane}
          ariaLabel="أقسام التوليد"
          block
          options={[
            { id: "assign", label: "التعيين" },
            { id: "draft", label: "المسودة", count: drafts.length || undefined },
          ]}
        />
      </div>

      <div className="ws-body">
        <form
          className={`ws-pane ws-pane--form ${pane === "assign" ? "" : "is-off"}`}
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          aria-label="التعيين"
        >
          <div className="ws-scroll">
            <div className="field">
              <label className="field-label" htmlFor="generate-url">رابط الخبر</label>
              <div className={`input-wrap url-wrap ${brokenUrl ? "is-invalid" : ""}`}>
                <LinkSimple size={18} aria-hidden="true" />
                <input
                  id="generate-url"
                  className="input"
                  type="url"
                  inputMode="url"
                  autoComplete="url"
                  dir="ltr"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://example.com/news/…"
                  aria-invalid={brokenUrl || undefined}
                  aria-describedby="generate-url-hint"
                />
              </div>
              <p id="generate-url-hint" className={`hint ${brokenUrl ? "is-error" : ""}`} role={brokenUrl ? "alert" : undefined}>
                {brokenUrl
                  ? "الرابط غير صالح. أكمل العنوان أو امسحه واكتب موضوعاً بدلاً منه."
                  : host
                    ? `المصدر: ${host}. إن تعذّر فتح الصفحة نبحث عن الخبر انطلاقاً من الرابط.`
                    : "اختياري. اتركه فارغاً واكتب الموضوع في الملاحظات."}
              </p>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="generate-notes">ملاحظات التعيين</label>
              <textarea
                id="generate-notes"
                className="textarea"
                rows={4}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="الموضوع إن لم يتوفر رابط، أو الجمهور والتفاصيل التي تريد التركيز عليها."
              />
            </div>

            <div className="field">
              <span className="field-label">نوع المسودة</span>
              <Segmented
                value={style}
                onChange={setStyle}
                ariaLabel="نوع المسودة"
                block
                options={STYLES.map((item) => ({ id: item.id, label: item.label }))}
              />
              <p className="hint">{WORD_BAND[style][length]}</p>
            </div>

            <div className="field">
              <span className="field-label">زاوية التغطية</span>
              <div className="angle-chips" role="group" aria-label="زاوية التغطية">
                {ANGLES.map((item) => (
                  <button key={item} type="button" className={`chip ${angle === item ? "is-active" : ""}`} aria-pressed={angle === item} onClick={() => setAngle((current) => (current === item ? "" : item))}>
                    {item}
                  </button>
                ))}
              </div>
              <label className="sr-only" htmlFor="generate-angle">زاوية أخرى</label>
              <input id="generate-angle" className="input" value={customAngle} onChange={(event) => setAngle(event.target.value)} placeholder="أو اكتب زاوية أخرى…" />
            </div>

            <div className="field-grid">
              <div className="field">
                <span className="field-label">اللغة</span>
                <Segmented value={language} onChange={setLanguage} options={LANGS} ariaLabel="لغة المسودة" block />
              </div>
              <div className="field">
                <span className="field-label">الطول</span>
                <Segmented value={length} onChange={setLength} options={LENGTHS} ariaLabel="طول المسودة" block />
              </div>
              <div className="field">
                <span className="field-label">النبرة</span>
                <Segmented value={tone} onChange={setTone} options={TONES} ariaLabel="نبرة المسودة" block />
              </div>
            </div>
          </div>

          <div className="ws-dock">
            {tooLong ? <p className="hint is-error" role="alert">الحد الأقصى للتعيين 12,000 حرف وللزاوية 240 حرفاً.</p> : null}
            {mutation.error ? <ErrorBlock error={mutation.error} /> : null}
            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={mutation.isPending || !canSubmit}>
              {mutation.isPending ? <span className="spinner" aria-hidden="true" /> : <PencilSimple size={20} aria-hidden="true" />}
              {mutation.isPending ? "جارٍ الكتابة…" : "ولّد المسودة"}
            </button>
            <p className="ws-hint"><span className="kbd">Ctrl</span>+<span className="kbd">Enter</span> للتوليد السريع</p>
          </div>
        </form>

        <section className={`ws-pane ${pane === "draft" ? "" : "is-off"}`} aria-label="المسودة" aria-busy={mutation.isPending}>
          <div className="ws-pane-head">
            <p className="panel-title"><FileText size={18} aria-hidden="true" />المسودة</p>
            {result && !mutation.isPending ? (
              <p className="panel-meta">
                {formatNumber(words)} كلمة · {formatNumber(readingMinutes(words, result.language))} د
                {result.sourceMode ? ` · ${SOURCE_MODE_LABEL[result.sourceMode]}` : ""}
              </p>
            ) : null}
          </div>

          {drafts.length > 1 ? (
            <div className="drafts-row" style={{ padding: "var(--s-2) var(--s-4)", borderBottom: "1px solid var(--line)" }}>
              <div className="chip-scroll" role="group" aria-label="مسودات هذه الجلسة">
                {drafts.map((draft) => (
                  <button key={draft.id} type="button" className={`chip ${activeId === draft.id ? "is-active" : ""}`} aria-pressed={activeId === draft.id} onClick={() => setActiveId(draft.id)} title={draft.title}>
                    <span>{STYLE_LABEL[draft.style]} · {formatTime(draft.at)}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="ws-scroll">
            {mutation.isPending ? (
              <div className="ws-working" role="status">
                <p className="working">
                  <span className="working-dots" aria-hidden="true"><i /><i /><i /></span>
                  {host && !brokenUrl ? `جارٍ كتابة المسودة من ${host}…` : "جارٍ كتابة المسودة…"}
                </p>
                <div className="ink-lines" aria-hidden="true"><span /><span /><span /><span /><span /></div>
              </div>
            ) : result ? (
              <article className="doc" dir={result.language === "ar" ? "rtl" : "ltr"} key={result.id}>
                <p className="doc-kind"><span className="badge badge-brand">{STYLE_LABEL[result.style]}</span></p>
                <h2 className="doc-title">{result.title}</h2>
                {result.dek ? <p className="doc-dek">{result.dek}</p> : null}
                <div className="doc-body">{result.body}</div>
              </article>
            ) : (
              <EmptyState icon={<PencilSimple size={26} />} title="لا مسودة بعد" action={<button type="button" className="btn btn-quiet btn-sm ws-to-form" onClick={() => setPane("assign")}>ابدأ التعيين</button>}>
                الصق رابط الخبر أو اكتب الموضوع، ثم ولّد المسودة.
              </EmptyState>
            )}
          </div>

          {result && !mutation.isPending ? (
            <div className="ws-dock">
              <div className="ws-dock-row">
                <CopyButton className="btn btn-primary btn-sm" label="نسخ الكل" getText={() => packCopy(result)} toastMessage="تم نسخ المسودة" />
                <CopyButton className="btn btn-quiet btn-sm" label="العنوان" doneLabel="نُسخ العنوان" getText={() => result.title} toastMessage="تم نسخ العنوان" />
                {result.dek ? <CopyButton className="btn btn-quiet btn-sm" label="المقدمة" doneLabel="نُسخت" getText={() => result.dek} toastMessage="تم نسخ المقدمة" /> : null}
                <button type="button" className="btn btn-quiet btn-sm" onClick={() => downloadCopy(result, result.style)}>
                  <DownloadSimple size={18} aria-hidden="true" />
                  تنزيل
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate("/translate", { state: { source: packCopy(result) } })}>
                  <Translate size={18} aria-hidden="true" />
                  ترجمة
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function ErrorBlock({ error }: { error: unknown }) {
  if (isOpenAIQuotaError(error)) return <QuotaNotice />;
  return (
    <div className="notice is-error" role="alert">
      <WarningCircle size={20} weight="fill" aria-hidden="true" />
      <div>{toolErrorMessage(error)}</div>
    </div>
  );
}
