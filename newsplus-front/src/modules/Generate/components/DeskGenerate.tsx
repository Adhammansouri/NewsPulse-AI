// DeskGenerate board (≥ 1024px): the 470px assignment form + the result area, with every state
// (empty / writing / done / error / drafts). Port of docs/redesign/design/reference/DeskGenerate.dc.html;
// inline styles are the board's own. The board's `<main>` is a `<div>` here: the shell owns `<main>`.
import { useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AiPanel } from "@/ui/AiPanel";
import { AiSteps } from "@/ui/AiSteps";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { cx } from "@/ui/cx";
import { EmptyState } from "@/ui/EmptyState";
import { Field, FieldInput, FieldTextarea } from "@/ui/Field";
import { Icon } from "@/ui/Icon";
import { IconButton } from "@/ui/IconButton";
import { Popover } from "@/ui/Popover";
import { PulseLine } from "@/ui/PulseLine";
import { Skeleton } from "@/ui/Skeleton";
import { toArabicDigits } from "@/utils/arabic";
import { AiCooldownCard } from "@/ui/ErrorSurface";
import {
  LIMITS_LINE,
  SOURCE_MODE_LABEL,
  STYLE_ACTION,
  STYLE_DEFINITE,
  STYLE_LABEL,
  STYLE_SHAPE,
  STYLES,
  groupedArabic,
  ANGLE_MAX,
  ASSIGNMENT_MAX,
  lengthLine,
  packCopy,
  paragraphs,
  wordBand,
  type GenerateDraft,
} from "../generateDesk";
import { draftMeta, provenance, type GenerateDesk } from "../useGenerateDesk";
import { PLAIN_BUTTON_STYLE, SettingsRows, ToolErrorNotice, writingSteps } from "./GenerateParts";

const FORM_STYLE = {
  position: "relative",
  width: "470px",
  flex: "none",
  display: "flex",
  flexDirection: "column",
  background: "var(--surface)",
  borderInlineStart: "1px solid var(--line)",
} as const;

export function DeskGenerate({ desk }: { desk: GenerateDesk }) {
  const draftsButtonRef = useRef<HTMLButtonElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  let srcState: "valid" | "error" | undefined;
  let srcHint: ReactNode = null;
  if (desk.urlRejected) {
    srcState = "error";
    srcHint = (
      <>
        <Icon name="error-circle" size="sm" />
        الموقع رفض الوصول للصفحة
      </>
    );
  } else if (desk.brokenUrl) {
    srcState = "error";
    srcHint = "الرابط غير صالح. امسحه أو أكمل العنوان، أو اترك الحقل فارغاً واكتب موضوعاً.";
  } else if (desk.host) {
    srcState = "valid";
    srcHint = (
      <>
        <Icon name="check" size="sm" />
        رابط من {desk.host} · سيقرأ المحرّر المقال كاملاً
      </>
    );
  }

  return (
    <div className="grow" style={{ display: "flex", minHeight: 0, overflow: "hidden" }}>
      <form
        aria-label="التعيين"
        style={FORM_STYLE}
        onSubmit={(event) => {
          event.preventDefault();
          desk.submit();
        }}
      >
        <Popover
          open={desk.draftsOpen}
          onClose={() => desk.setDraftsOpen(false)}
          anchorRef={draftsButtonRef}
          aria-label="مسوداتي"
          className="col"
          // Board: top 78px, inset 20px. Up to 20 drafts: the list scrolls inside the form's height.
          style={{ top: "78px", insetInline: "20px", padding: "10px", gap: "2px", maxHeight: "calc(100% - 98px)", overflowY: "auto" }}
        >
          <div className="row" style={{ justifyContent: "space-between", padding: "6px 8px 10px" }}>
            <b style={{ fontWeight: 600 }}>مسوداتي</b>
            <span className="t-meta">محفوظة على الجهاز ده · آخر ٢٠</span>
          </div>
          {desk.drafts.map((draft) => (
            <DraftRow key={draft.id} draft={draft} desk={desk} highlighted={draft.id === (desk.activeId ?? desk.drafts[0]?.id)} />
          ))}
          <Button
            variant="ghost"
            size="sm"
            style={{ color: "var(--breaking)", alignSelf: "flex-start", marginTop: "6px" }}
            onClick={desk.removeAllDrafts}
          >
            امسح كل المسودات
          </Button>
        </Popover>

        <div className="col" style={{ flex: 1, overflowY: "auto", padding: "22px 26px", gap: "22px" }}>
          <header className="row" style={{ justifyContent: "space-between" }}>
            <div className="col">
              <h1 className="t-title" style={{ fontSize: "22px" }}>
                توليد
              </h1>
              <p className="t-meta">مقال أو تقرير أو ملخص من رابط أو موضوع</p>
            </div>
            <Button
              ref={draftsButtonRef}
              variant="ghost"
              size="sm"
              aria-expanded={desk.draftsOpen}
              aria-haspopup="dialog"
              disabled={desk.drafts.length === 0}
              onClick={() => desk.setDraftsOpen(!desk.draftsOpen)}
            >
              <Icon name="history" size="sm" />
              مسوداتي · {toArabicDigits(desk.drafts.length)}
            </Button>
          </header>

          <div className="col" style={{ gap: "8px" }}>
            <label className="t-label" htmlFor="g-src">
              المصدر
            </label>
            <Field state={srcState} hint={srcHint ?? undefined} hintTone={srcState === "valid" ? "ok" : undefined}>
              <Icon name="link" style={{ color: "var(--teal)" }} />
              <FieldInput
                id="g-src"
                dir="ltr"
                type="url"
                inputMode="url"
                autoComplete="url"
                value={desk.url}
                onChange={(event) => desk.setUrl(event.target.value)}
                placeholder="https://example.com/news/..."
                style={{ textAlign: "right" }}
              />
            </Field>
            {desk.urlRejected && (
              <AiPanel className="col arrive" style={{ padding: "16px", gap: "10px", boxShadow: "none" }}>
                <span className="ai-mark t-ai">المحرّر يقدر يكمّل بطريقة تانية</span>
                <p className="t-small">يدوّر على نفس الخبر في مصادر تانية، أو تلصق نص المقال بنفسك.</p>
                <div className="row">
                  <Button variant="ai" size="sm" onClick={desk.searchInstead}>
                    ابحث عن الخبر
                  </Button>
                  <Button
                    variant="quiet"
                    size="sm"
                    onClick={() => {
                      desk.pasteInstead();
                      notesRef.current?.focus();
                    }}
                  >
                    الصق النص
                  </Button>
                </div>
              </AiPanel>
            )}
            <Field as="label" area sunken>
              <span className="sr">ملاحظات للمحرر</span>
              <FieldTextarea
                ref={notesRef}
                rows={2}
                value={desk.notes}
                onChange={(event) => desk.setNotes(event.target.value)}
                placeholder="ملاحظات اختيارية: الجمهور، تفاصيل تريد التركيز عليها…"
              />
            </Field>
          </div>

          <fieldset className="col" style={{ border: 0, padding: 0, margin: 0, gap: "8px" }}>
            <legend className="t-label" style={{ marginBottom: "8px" }}>
              ماذا تكتب؟
            </legend>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px" }}>
              {STYLES.map((item) => {
                const on = desk.style === item.id;
                const shape = STYLE_SHAPE[item.id];
                return (
                  <button
                    key={item.id}
                    className="tile"
                    type="button"
                    aria-pressed={on}
                    onClick={() => desk.setStyle(item.id)}
                    style={{ padding: "12px", gap: "6px" }}
                  >
                    <span className="tile__shape" style={{ height: "60px" }}>
                      <svg width="38" height="38" viewBox="0 0 64 64" aria-hidden="true">
                        <rect x="14" y={shape.y} width="36" height={shape.h} rx="5" fill="none" stroke="currentColor" strokeWidth="3" />
                        <rect x="21" y={shape.ty} width="22" height="4" rx="2" fill="currentColor" />
                        <rect x="21" y={shape.ly} width="16" height="3" rx="1.5" fill="currentColor" opacity=".5" />
                      </svg>
                    </span>
                    <span className="tile__name">{item.label}</span>
                    <span className="tile__hint num">{wordBand(item.id, desk.length)}</span>
                    {on && (
                      <span className="tile__check">
                        <Icon name="check" size="sm" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="col" style={{ gap: "12px" }}>
            <p className="t-label">الضبط</p>
            <SettingsRows desk={desk} />
          </div>
        </div>

        <div className="col" style={{ gap: "6px", padding: "14px 26px 18px", borderTop: "1px solid var(--line)" }}>
          {desk.error && !desk.urlRejected && <ToolErrorNotice error={desk.error} onRetry={desk.retry} />}
          {desk.tooLong && (
            <p className="hint hint--error" role="alert">
              الحد الأقصى للتعيين {groupedArabic(ASSIGNMENT_MAX)} حرف وللزاوية {groupedArabic(ANGLE_MAX)} حرف.
            </p>
          )}
          <Button
            variant="ai"
            block
            size="lg"
            type="submit"
            kbd="Ctrl ↵"
            disabled={!desk.canSubmit}
            aria-disabled={desk.pending || undefined}
          >
            <Icon name="sparkle" />
            {STYLE_ACTION[desk.style]}
          </Button>
          <p className="t-meta" style={{ textAlign: "center" }}>
            {LIMITS_LINE}
          </p>
        </div>
      </form>

      <div className="grow col" style={{ background: "var(--bg)" }}>
        {desk.pending ? <Writing desk={desk} /> : desk.active ? <Done desk={desk} draft={desk.active} /> : <Empty />}
      </div>
      <AiCooldownCard />
    </div>
  );
}

function DraftRow({ draft, desk, highlighted }: { draft: GenerateDraft; desk: GenerateDesk; highlighted: boolean }) {
  return (
    <div
      className="row"
      style={{ gap: "12px", padding: "10px 8px", borderRadius: "12px", background: highlighted ? "var(--teal-soft)" : "transparent" }}
    >
      <Badge variant={highlighted ? "ai" : "topic"}>{STYLE_LABEL[draft.style]}</Badge>
      <button type="button" className="col grow" style={PLAIN_BUTTON_STYLE} onClick={() => desk.openDraft(draft.id)}>
        <span className="ellipsis" style={{ fontWeight: 600, fontSize: "14px" }}>
          {draft.title}
        </span>
        <span className="t-meta">{draftMeta(draft, true)}</span>
      </button>
      <IconButton label="حذف المسودة" style={{ width: "32px", height: "32px" }} onClick={() => desk.removeDraft(draft.id)}>
        <Icon name="trash" size="sm" />
      </IconButton>
    </div>
  );
}

function Empty() {
  return (
    <div className="grow" style={{ display: "grid", placeItems: "center", padding: "40px" }}>
      <EmptyState
        style={{ maxWidth: "460px" }}
        artStyle={{ background: "var(--ai-soft)" }}
        art={<Icon name="sparkle-double" size="xl" style={{ color: "var(--cyan)" }} />}
        title="مسودتك هتظهر هنا"
        description="الصق رابط الخبر، اختار نوع المادة، والمحرّر يقرأ المصدر ويكتب مسودة جاهزة للمراجعة."
      >
        <div className="col" style={{ gap: "8px", marginTop: "10px", width: "100%" }}>
          <div className="row panel panel--flat" style={{ padding: "10px 14px", gap: "10px", textAlign: "start" }}>
            <Badge variant="teal">رابط</Badge>
            <span className="t-small">يقرأ الصفحة كاملة، ولو تعذّر يبحث عن الخبر</span>
          </div>
          <div className="row panel panel--flat" style={{ padding: "10px 14px", gap: "10px", textAlign: "start" }}>
            <Badge variant="teal">موضوع</Badge>
            <span className="t-small">اكتب الفكرة والتفاصيل اللي تهمك في الملاحظات</span>
          </div>
        </div>
      </EmptyState>
    </div>
  );
}

function Writing({ desk }: { desk: GenerateDesk }) {
  const style = desk.run?.style ?? desk.style;
  return (
    <div className="grow fade-in" style={{ display: "flex", gap: "30px", padding: "40px 44px", overflow: "hidden" }}>
      <AiPanel
        glow
        className="col"
        aria-live="polite"
        style={{ width: "300px", flex: "none", alignSelf: "flex-start", padding: "22px", gap: "16px" }}
      >
        <span className="ai-mark t-ai">المحرّر يكتب {STYLE_DEFINITE[style]}</span>
        <PulseLine preset="256x40" />
        <AiSteps steps={writingSteps(desk, "desk")} />
      </AiPanel>
      <div className="doc grow col" style={{ maxWidth: "640px", padding: "34px 40px", gap: "14px", alignSelf: "flex-start" }}>
        <Skeleton height="32px" width="84%" />
        <Skeleton height="18px" width="50%" />
        <Skeleton height="14px" width="100%" style={{ marginTop: "14px" }} />
        <Skeleton height="14px" width="97%" />
        <Skeleton height="14px" width="93%" />
        <Skeleton height="14px" width="60%" />
        <Skeleton height="14px" width="100%" style={{ marginTop: "10px" }} />
        <Skeleton height="14px" width="88%" />
      </div>
    </div>
  );
}

function Done({ desk, draft }: { desk: GenerateDesk; draft: GenerateDraft }) {
  const dir = draft.language === "en" ? "ltr" : "rtl";
  return (
    <>
      <div className="row" style={{ padding: "12px 28px", background: "var(--surface)", borderBottom: "1px solid var(--line)", flexWrap: "wrap" }}>
        <Badge variant="ai">{STYLE_LABEL[draft.style]}</Badge>
        {draft.sourceMode && (
          <Badge variant="teal">
            <Icon name="link" size="sm" />
            {SOURCE_MODE_LABEL[draft.sourceMode]}
          </Badge>
        )}
        <span className="t-meta num">{lengthLine(draft)}</span>
        <span className="grow" />
        <Link className="btn btn--ghost btn--sm" to="/translate" state={{ source: packCopy(draft) }}>
          <Icon name="translate" size="sm" />
          ترجم
        </Link>
        <Button
          variant="ghost"
          size="sm"
          loading={desk.social.pending}
          disabled={desk.social.blocked}
          onClick={() => desk.social.start(packCopy(draft), draft.language)}
        >
          {!desk.social.pending && <Icon name="sparkle" size="sm" style={{ color: "var(--cyan)" }} />}
          حوّله لمنشور سوشيال
        </Button>
        <IconButton label="تنزيل" icon="download" onClick={() => desk.download(draft)} />
        <Button variant="ink" size="sm" onClick={(event) => desk.copyAll(draft, event.currentTarget)}>
          <Icon name="copy" size="sm" />
          نسخ الكل
        </Button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "34px 44px" }}>
        <article
          key={draft.id}
          className="doc typeset"
          style={{ maxWidth: "720px", margin: "0 auto", padding: "0 0 30px", display: "flex", flexDirection: "column", gap: "4px" }}
        >
          <div className="ai-strip" />
          <div className="col" style={{ padding: "26px 44px 0", gap: "4px" }}>
            <p className="ai-mark" style={{ color: "var(--ink-3)", marginBottom: "8px" }}>
              <Icon name="sparkle" size="sm" />
              {provenance(draft)}
            </p>
            <div className="block">
              <div className="block__label">
                العنوان
                <CopyButton done={desk.copied === "title"} onClick={(control) => desk.copyBlock("title", draft.title, control)} />
              </div>
              <h2 className="t-hero" style={{ fontSize: "30px" }} lang={draft.language} dir={dir}>
                {draft.title}
              </h2>
            </div>
            {draft.dek && (
              <div className="block">
                <div className="block__label">
                  المقدمة
                  <CopyButton done={desk.copied === "dek"} onClick={(control) => desk.copyBlock("dek", draft.dek, control)} />
                </div>
                <p
                  className="t-head"
                  style={{ color: "var(--ink-2)", fontWeight: 500, fontSize: "18px", lineHeight: 1.7 }}
                  lang={draft.language}
                  dir={dir}
                >
                  {draft.dek}
                </p>
              </div>
            )}
            <div className="block">
              <div className="block__label">النص</div>
              <div className="t-body col" style={{ color: "var(--ink)", gap: "14px", fontSize: "17px" }} lang={draft.language} dir={dir}>
                {paragraphs(draft.body).map((text, index) => (
                  <p key={index}>{text}</p>
                ))}
              </div>
            </div>
          </div>
        </article>
      </div>
    </>
  );
}

/** `button.block__copy`: «نسخ» → «تم النسخ» (`is-done`) for a moment, as on the Main board. */
export function CopyButton({ done, onClick }: { done: boolean; onClick: (control: HTMLButtonElement) => void }) {
  return (
    <button className={cx("block__copy", done && "is-done")} type="button" onClick={(event) => onClick(event.currentTarget)}>
      {done ? "تم النسخ" : "نسخ"}
    </button>
  );
}
