// MobTranslate board (< 1024px): `m-head` with the source seg, the direction pill, the source (textarea, then
// a 3-line card once translated), the output `ai-panel`, and the bottom CTA. Port of
// docs/redesign/design/reference/MobTranslate.dc.html; inline styles are the board's own.
import { useEffect, useRef, type KeyboardEvent } from "react";
import { readDrafts, packCopy } from "@/modules/Generate/generateDesk";
import { shortTitle } from "@/modules/Generate/components/MobGenerate";
import { ToolErrorNotice } from "@/modules/Generate/components/GenerateParts";
import { AiPanel } from "@/ui/AiPanel";
import { Button } from "@/ui/Button";
import { Chip } from "@/ui/Chip";
import { Field, FieldInput, Hint } from "@/ui/Field";
import { Icon } from "@/ui/Icon";
import { IconButton } from "@/ui/IconButton";
import { PulseLine } from "@/ui/PulseLine";
import { Segmented } from "@/ui/Segmented";
import { Skeleton } from "@/ui/Skeleton";
import { LANGUAGE_NAME, charsPhrase, outputProps, paragraphs } from "../translateDesk";
import type { TranslateDesk } from "../useTranslateDesk";
import { Extracted, KIND_OPTIONS } from "./DeskTranslate";

const PILL_LABEL = { fontSize: "11px" } as const;
const CLAMP_STYLE = {
  fontSize: "15px",
  lineHeight: 1.85,
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
} as const;

export function MobTranslate({ desk }: { desk: TranslateDesk }) {
  const textRef = useRef<HTMLTextAreaElement>(null);
  const latestDraft = useRef(readDrafts()[0] ?? null).current;
  const result = desk.result;
  const out = result ? outputProps(result.data.targetLanguage) : null;
  const started = desk.phase !== "empty";
  /** Text mode: the editor until the first translation, then the 3-line card (tap it to edit). */
  const showEditor = desk.kind === "text" && (!started || desk.editing);
  const showCard = desk.kind === "text" && started && !desk.editing;

  useEffect(() => {
    if (desk.editing) textRef.current?.focus();
  }, [desk.editing]);

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) desk.setText(text.trim());
    } catch {
      /* clipboard read refused: the editor pastes into the field by hand */
    }
    textRef.current?.focus();
  }

  function onCardKey(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    desk.setEditing(true);
  }

  return (
    <>
      <header className="m-head" style={{ gap: "12px" }}>
        <div className="m-head__row">
          <span className="m-title">ترجمة</span>
          <Segmented options={KIND_OPTIONS} value={desk.kind} onChange={desk.setKind} />
        </div>
        <div className="panel row" style={{ gap: "4px", padding: "5px", borderRadius: "16px", boxShadow: "none", background: "var(--surface-2)" }}>
          <span className="col grow" style={{ textAlign: "center" }}>
            <span className="t-meta" style={PILL_LABEL}>
              من · تلقائي
            </span>
            <b style={{ fontWeight: 700 }}>{LANGUAGE_NAME[desk.from]}</b>
          </span>
          <IconButton label="تبديل الاتجاه" icon="swap" line style={{ borderRadius: "50%" }} disabled={desk.pending} onClick={desk.swap} />
          <span className="col grow" style={{ textAlign: "center" }}>
            <span className="t-meta" style={PILL_LABEL}>
              إلى
            </span>
            <b style={{ fontWeight: 700 }}>{LANGUAGE_NAME[desk.target]}</b>
          </span>
        </div>
      </header>

      <main className="m-scroll col" style={{ padding: "4px 16px 18px", gap: "12px" }}>
        {showEditor && (
          <>
            <label className="panel col" style={{ padding: "14px 16px", gap: "8px", minHeight: "260px" }}>
              <span className="t-label">النص الأصلي</span>
              <textarea
                ref={textRef}
                style={{ flex: 1, border: 0, outline: 0, resize: "none", background: "transparent", fontSize: "16px", lineHeight: 1.85, color: "var(--ink)" }}
                dir={desk.detected === "en" ? "ltr" : "rtl"}
                placeholder="الصق نص الخبر هنا. هنعرف لغته لوحدنا…"
                value={desk.text}
                aria-invalid={desk.tooLong || undefined}
                onChange={(event) => desk.setText(event.target.value)}
                onBlur={() => desk.setEditing(false)}
              />
            </label>
            {!started && !desk.text.trim() && (
              <div className="row" style={{ gap: "6px", flexWrap: "wrap" }}>
                <Chip size="sm" soft onClick={pasteFromClipboard}>
                  <Icon name="copy" size="sm" />
                  الصق من الحافظة
                </Chip>
                {latestDraft && (
                  <Chip size="sm" soft onClick={() => desk.setText(packCopy(latestDraft))}>
                    آخر مسودة: {shortTitle(latestDraft.title)}
                  </Chip>
                )}
              </div>
            )}
          </>
        )}

        {desk.kind === "url" && (
          <div className="col" style={{ gap: "12px" }}>
            <Field state={desk.urlValid ? "valid" : desk.url.trim() ? "error" : undefined}>
              <Icon name="link" style={{ color: "var(--teal)" }} />
              <FieldInput
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

        {showCard && (
          <section
            className="panel col"
            role="button"
            tabIndex={0}
            aria-label="عدّل الأصل"
            onClick={() => desk.setEditing(true)}
            onKeyDown={onCardKey}
            style={{ padding: "14px 16px", gap: "6px", borderColor: desk.stale ? "var(--warn-dot)" : "var(--line)" }}
          >
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h2 className="t-label">الأصل</h2>
              <span className="t-meta">{desk.stale ? "اتعدّل الآن" : charsPhrase(desk.text.trim().length)}</span>
            </div>
            <p style={CLAMP_STYLE} dir={desk.detected === "en" ? "ltr" : "rtl"}>
              {desk.text}
            </p>
          </section>
        )}

        {desk.limitHint && (
          <Hint tone="error" role="alert">
            {desk.limitHint}
          </Hint>
        )}

        {desk.stale && !desk.pending && (
          <p className="notice notice--warn arrive" role="status">
            <Icon name="warning" style={{ color: "var(--warn)", marginTop: "2px" }} />
            عدّلت الأصل بعد الترجمة. الترجمة القديمة ظاهرة لحد ما تعيدها.
          </p>
        )}

        {desk.error && !desk.pending && <ToolErrorNotice error={desk.error} />}

        {desk.phase === "busy" && (
          <AiPanel as="section" className="col" style={{ padding: "16px", gap: "12px", boxShadow: "none" }} aria-live="polite">
            <div className="row">
              <PulseLine preset="80x24" />
              <span className="ai-mark t-ai">يترجم ويراجع الصياغة…</span>
            </div>
            <Skeleton height="13px" />
            <Skeleton height="13px" width="92%" />
            <Skeleton height="13px" width="96%" />
            <Skeleton height="13px" width="50%" />
          </AiPanel>
        )}

        {desk.phase === "done" && result && out && (
          <AiPanel
            as="section"
            strip
            key={result.data.translated}
            className="col typeset"
            style={{ overflow: "hidden", boxShadow: "none", opacity: desk.stale ? 0.55 : 1 }}
          >
            <div className="col" style={{ padding: "14px 16px", gap: "10px" }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <h2 className="t-label t-ai">الترجمة الصحفية</h2>
                <span className="t-meta">{charsPhrase(result.data.translated.length)}</span>
              </div>
              <article lang={out.lang} dir={out.dir} className="col" style={{ fontFamily: out.fontFamily, fontSize: "16px", lineHeight: 1.75, gap: "10px" }}>
                {paragraphs(result.data.translated).map((text, index) => (
                  <p key={index}>{text}</p>
                ))}
              </article>
              <p className="ai-mark" style={{ color: "var(--ink-3)" }}>
                <Icon name="sparkle" size="sm" />
                الأسماء والأرقام محفوظة · راجعها قبل النشر
              </p>
            </div>
          </AiPanel>
        )}
      </main>

      <div className="m-cta" style={{ paddingBottom: "12px" }}>
        {desk.phase === "done" && !desk.stale ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <Button variant="quiet" loading={desk.socialPending} onClick={desk.startPost}>
              في منشور
            </Button>
            <Button variant="ink" onClick={desk.copyTranslation}>
              <Icon name="copy" size="sm" />
              {desk.copied ? "تم النسخ" : "نسخ"}
            </Button>
          </div>
        ) : (
          <Button variant="ai" block size="lg" disabled={!desk.canSubmit} onClick={desk.submit}>
            <Icon name="translate" />
            {desk.buttonLabel}
          </Button>
        )}
      </div>
    </>
  );
}
