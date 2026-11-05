// DeskTranslate board (≥ 1024px): direction pill + source and output panels, with every state
// (empty / busy / done / stale). Port of docs/redesign/design/reference/DeskTranslate.dc.html; inline styles
// are the board's own. The board's `<main>` is a `<div>` here: the shell owns `<main>`.
import { useRef } from "react";
import { Button } from "@/ui/Button";
import { EmptyState } from "@/ui/EmptyState";
import { Field, FieldInput, Hint } from "@/ui/Field";
import { Icon } from "@/ui/Icon";
import { IconButton } from "@/ui/IconButton";
import { PulseLine } from "@/ui/PulseLine";
import { Segmented } from "@/ui/Segmented";
import { Skeleton } from "@/ui/Skeleton";
import { ToolErrorNotice } from "@/modules/Generate/components/GenerateParts";
import { AiCooldownCard } from "@/ui/ErrorSurface";
import { LANGUAGE_NAME, charsPhrase, excerpt, outputProps, paragraphs, type SourceKind } from "../translateDesk";
import type { TranslateDesk } from "../useTranslateDesk";

export const KIND_OPTIONS = [
  { value: "text", label: "نص" },
  { value: "url", label: "رابط" },
] as const satisfies ReadonlyArray<{ value: SourceKind; label: string }>;

const PILL_SIDE = { padding: "2px 16px", minWidth: "140px" } as const;
const PILL_LABEL = { fontSize: "11.5px" } as const;

export function DeskTranslate({ desk }: { desk: TranslateDesk }) {
  const textRef = useRef<HTMLTextAreaElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const result = desk.result;
  const out = result ? outputProps(result.data.targetLanguage) : null;

  function editSource() {
    const node = desk.kind === "url" ? urlRef.current : textRef.current;
    if (!node) return;
    node.focus();
    const end = node.value.length;
    node.setSelectionRange(end, end);
  }

  return (
    <div className="grow col" style={{ minHeight: 0, padding: "24px 32px 28px", gap: "18px" }}>
      <header className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div className="col">
          <h1 className="t-title" style={{ fontSize: "22px" }}>
            ترجمة صحفية
          </h1>
          <p className="t-meta">تحافظ على الأسماء والأرقام والاقتباسات، وتكتب بأسلوب صحفي لا حرفي</p>
        </div>
        <div className="panel row" style={{ gap: "4px", padding: "5px", borderRadius: "16px" }}>
          <span className="col" style={PILL_SIDE}>
            <span className="t-meta" style={PILL_LABEL}>
              من · اكتُشفت تلقائياً
            </span>
            <span style={{ fontWeight: 700 }}>{LANGUAGE_NAME[desk.from]}</span>
          </span>
          <IconButton
            label="تبديل الاتجاه"
            icon="swap"
            line
            style={{ borderRadius: "50%" }}
            disabled={desk.pending}
            onClick={desk.swap}
          />
          <span className="col" style={PILL_SIDE}>
            <span className="t-meta" style={PILL_LABEL}>
              إلى
            </span>
            <span style={{ fontWeight: 700 }}>{LANGUAGE_NAME[desk.target]}</span>
          </span>
        </div>
      </header>

      <div className="grow" style={{ minHeight: 0, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" }}>
        <section className="panel col" aria-label="الأصل" style={{ overflow: "hidden" }}>
          <div className="row" style={{ justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--line)" }}>
            <Segmented role="group" aria-label="نوع المصدر" options={KIND_OPTIONS} value={desk.kind} onChange={desk.setKind} />
            <span className="t-meta num">{desk.kind === "url" ? "رابط" : charsPhrase(desk.text.trim().length)}</span>
          </div>
          {desk.kind === "text" ? (
            <label className="grow" style={{ display: "flex", padding: "20px 22px" }}>
              <span className="sr">النص الأصلي</span>
              <textarea
                ref={textRef}
                style={{ flex: 1, border: 0, outline: 0, resize: "none", background: "transparent", fontSize: "17px", lineHeight: 1.9, color: "var(--ink)" }}
                dir={desk.detected === "en" ? "ltr" : "rtl"}
                value={desk.text}
                placeholder="الصق نص الخبر هنا. هنعرف لغته لوحدنا…"
                aria-invalid={desk.tooLong || undefined}
                onChange={(event) => desk.setText(event.target.value)}
              />
            </label>
          ) : (
            <div className="grow col" style={{ padding: "20px 22px", gap: "12px" }}>
              <Field state={desk.urlValid ? "valid" : desk.url.trim() ? "error" : undefined}>
                <Icon name="link" style={{ color: "var(--teal)" }} />
                <FieldInput
                  ref={urlRef}
                  dir="ltr"
                  type="url"
                  inputMode="url"
                  value={desk.url}
                  onChange={(event) => desk.setUrl(event.target.value)}
                  style={{ textAlign: "right" }}
                  aria-label="رابط المقال"
                />
              </Field>
              <p className="hint">المحرّر يستخرج نص المقال فقط، بدون القوائم والإعلانات</p>
              {result?.kind === "url" && <Extracted desk={desk} />}
            </div>
          )}
          <div className="row" style={{ padding: "12px 16px", borderTop: "1px solid var(--line)" }}>
            {desk.phase === "done" && (
              <Button variant="ghost" size="sm" onClick={editSource}>
                عدّل الأصل
              </Button>
            )}
            {desk.limitHint ? (
              <Hint tone="error" className="grow" role="alert">
                {desk.limitHint}
              </Hint>
            ) : (
              <span className="grow" />
            )}
            <Button variant="ai" disabled={!desk.canSubmit} onClick={desk.submit}>
              <Icon name="translate" />
              {desk.buttonLabel}
            </Button>
          </div>
        </section>

        <section className="panel col" aria-label="الترجمة" aria-busy={desk.pending} style={{ overflow: "hidden", background: "var(--surface-2)" }}>
          <div className="row" style={{ justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--line)", background: "var(--surface)" }}>
            <h2 className="t-label">الترجمة الصحفية</h2>
            <span className="t-meta">{LANGUAGE_NAME[desk.target]}</span>
          </div>
          {desk.error && desk.phase !== "busy" && <ToolErrorNotice error={desk.error} onRetry={desk.submit} style={{ margin: "14px 18px 0" }} />}
          {desk.phase === "empty" && (
            <div className="grow" style={{ display: "grid", placeItems: "center" }}>
              <EmptyState
                style={{ maxWidth: "340px" }}
                art={<Icon name="translate" size="xl" />}
                titleAs="h3"
                titleClassName="t-head"
                title="الخبر بلغته الجديدة"
                description="اضغط ترجم، وهتظهر الترجمة هنا جنب الأصل عشان تراجعهم سطر بسطر."
              />
            </div>
          )}
          {desk.phase === "busy" && (
            <div className="grow col fade-in" style={{ padding: "24px", gap: "14px" }} aria-live="polite">
              <div className="row">
                <PulseLine preset="90x24" />
                <span className="ai-mark t-ai">يترجم ويراجع الصياغة…</span>
              </div>
              <Skeleton height="14px" width="100%" />
              <Skeleton height="14px" width="92%" />
              <Skeleton height="14px" width="97%" />
              <Skeleton height="14px" width="54%" />
            </div>
          )}
          {desk.phase === "done" && result && out && (
            <>
              {desk.stale && (
                <p role="status" className="notice notice--warn fade-in" style={{ margin: "14px 18px 0" }}>
                  <Icon name="warning" style={{ color: "var(--warn)" }} />
                  عدّلت الأصل بعد الترجمة. الترجمة القديمة ظاهرة لحد ما تضغط «أعد الترجمة».
                </p>
              )}
              <article
                key={result.data.translated}
                className="grow typeset col"
                lang={out.lang}
                dir={out.dir}
                style={{
                  overflowY: "auto",
                  padding: "22px 26px",
                  gap: "14px",
                  fontSize: "17px",
                  lineHeight: 1.8,
                  color: "var(--ink)",
                  fontFamily: out.fontFamily,
                  opacity: desk.stale ? 0.55 : 1,
                }}
              >
                {paragraphs(result.data.translated).map((text, index) => (
                  <p key={index}>{text}</p>
                ))}
              </article>
              <div className="row" style={{ padding: "12px 18px", borderTop: "1px solid var(--line)", background: "var(--surface)" }}>
                <p className="ai-mark grow" style={{ color: "var(--ink-3)" }}>
                  <Icon name="sparkle" size="sm" />
                  راجع الترجمة قبل النشر
                </p>
                <Button variant="ghost" size="sm" loading={desk.socialPending} disabled={desk.aiCooldown} onClick={desk.startPost}>
                  استخدمها في منشور
                </Button>
                <Button variant="ink" size="sm" onClick={desk.copyTranslation}>
                  <Icon name="copy" size="sm" />
                  {desk.copied ? "تم النسخ" : "نسخ الترجمة"}
                </Button>
              </div>
            </>
          )}
        </section>
      </div>
      <AiCooldownCard />
    </div>
  );
}

/** «النص المستخرج · ١٬٩٢٠ حرف» — the start of the article the editor pulled from the URL. */
export function Extracted({ desk }: { desk: TranslateDesk }) {
  const result = desk.result;
  if (!result) return null;
  const source = outputProps(result.data.sourceLanguage === "en" ? "en" : "ar");
  return (
    <div className="panel panel--flat col fade-in" style={{ padding: "14px 16px", gap: "6px", background: "var(--surface-2)" }}>
      <span className="t-label">النص المستخرج · {charsPhrase(result.data.original.length)}</span>
      <p lang={source.lang} dir={source.dir} style={{ fontFamily: source.fontFamily, fontSize: "14.5px", lineHeight: 1.7, color: "var(--ink-2)" }}>
        {excerpt(result.data.original)}
      </p>
    </div>
  );
}
