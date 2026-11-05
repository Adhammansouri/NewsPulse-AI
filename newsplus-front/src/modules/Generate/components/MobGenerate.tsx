// MobGenerate board (< 1024px): form → writing → done, with the drafts and «الضبط» sheets. Port of
// docs/redesign/design/reference/MobGenerate.dc.html; inline styles are the board's own. The «الضبط» sheet is
// the approved adaptation of sprint §A Mobile (the desktop §4 controls in a `sheet`).
import { useRef } from "react";
import { Link } from "react-router-dom";
import { useHideTabBar } from "@/components/shell/tabBarVisibility";
import { useNewsFeed } from "@/hooks/useNewsFeed";
import { AiPanel } from "@/ui/AiPanel";
import { AiSteps } from "@/ui/AiSteps";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Chip } from "@/ui/Chip";
import { cx } from "@/ui/cx";
import { Icon } from "@/ui/Icon";
import { IconButton } from "@/ui/IconButton";
import { PulseLine } from "@/ui/PulseLine";
import { Sheet } from "@/ui/Sheet";
import { Skeleton } from "@/ui/Skeleton";
import { toArabicDigits } from "@/utils/arabic";
import {
  SOURCE_MODE_LABEL,
  STYLE_ACTION,
  STYLE_DEFINITE,
  STYLE_LABEL,
  STYLES,
  lengthLine,
  looksLikeHttpUrl,
  packCopy,
  paragraphs,
  urlHost,
  wordRange,
  type GenerateDraft,
} from "../generateDesk";
import { draftMeta, type GenerateDesk } from "../useGenerateDesk";
import { CopyButton } from "./DeskGenerate";
import { PLAIN_BUTTON_STYLE, SettingsRows, ToolErrorNotice, writingSteps } from "./GenerateParts";

const BLOCK_STYLE = { marginInline: "-12px", padding: "10px 12px" } as const;
const SHEET_STYLE = { maxHeight: "640px", paddingBottom: "24px" } as const;

/** «آخر عاجل: المركزي يثبت الفائدة» — the headline before its colon, at most four words. */
export function shortTitle(title: string): string {
  const head = title.split(/[:：]/)[0].trim();
  const words = head.split(/\s+/).filter(Boolean);
  return words.length > 4 ? `${words.slice(0, 4).join(" ")}…` : head;
}

export function MobGenerate({ desk }: { desk: GenerateDesk }) {
  const done = desk.mobileView === "result" && desk.active !== null;
  // MobGenerate `showTabs`: the tab bar shows on the form (empty / error / drafts), not while writing or done.
  useHideTabBar(desk.pending || done);
  if (desk.pending) return <MobWriting desk={desk} />;
  if (done && desk.active) return <MobDone desk={desk} draft={desk.active} />;
  return <MobForm desk={desk} />;
}

function MobForm({ desk }: { desk: GenerateDesk }) {
  const sourceRef = useRef<HTMLTextAreaElement>(null);
  const feed = useNewsFeed();
  const breaking = feed.data?.items.find((item) => item.breaking);
  const empty = !desk.sourceText.trim();

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) desk.setSourceText(text.trim());
    } catch {
      /* clipboard read refused: the editor pastes into the field by hand */
    }
    sourceRef.current?.focus();
  }

  return (
    <>
      <header className="m-head">
        <div className="m-head__row">
          <span className="m-title">توليد</span>
          <Button
            variant="ghost"
            size="sm"
            aria-haspopup="dialog"
            disabled={desk.drafts.length === 0}
            onClick={() => desk.setDraftsOpen(true)}
          >
            <Icon name="history" size="sm" />
            مسوداتي · {toArabicDigits(desk.drafts.length)}
          </Button>
        </div>
        <p className="t-meta">مقال أو تقرير أو ملخص من رابط أو موضوع</p>
      </header>

      <main className="m-scroll col" style={{ padding: "8px 16px 20px", gap: "20px" }}>
        <div className="col" style={{ gap: "8px" }}>
          <label className="t-label" htmlFor="mg-src">
            رابط أو موضوع
          </label>
          <label className={cx("field field--area", desk.urlRejected && "is-error")} style={{ minHeight: "96px" }}>
            <textarea
              ref={sourceRef}
              id="mg-src"
              rows={3}
              dir={looksLikeHttpUrl(desk.sourceText) ? "ltr" : "rtl"}
              placeholder="الصق رابط الخبر، أو اكتب الموضوع وما يهمك فيه…"
              style={{ textAlign: "right" }}
              value={desk.sourceText}
              aria-invalid={desk.urlRejected || desk.brokenUrl || undefined}
              aria-describedby={desk.urlRejected ? "mg-src-error" : undefined}
              onChange={(event) => desk.setSourceText(event.target.value)}
            />
          </label>
          {desk.urlRejected && (
            <p id="mg-src-error" className="hint hint--error">
              <Icon name="error-circle" size="sm" />
              الموقع رفض الوصول للصفحة
            </p>
          )}
          {empty && (
            <div className="row" style={{ gap: "6px", flexWrap: "wrap" }}>
              <Chip size="sm" soft onClick={pasteFromClipboard}>
                <Icon name="copy" size="sm" />
                الصق من الحافظة
              </Chip>
              {breaking && (
                <Chip size="sm" soft onClick={() => desk.setSourceText(breaking.sources[0]?.url ?? breaking.title)}>
                  آخر عاجل: {shortTitle(breaking.title)}
                </Chip>
              )}
            </div>
          )}
        </div>

        {desk.urlRejected && (
          <AiPanel className="col arrive" style={{ padding: "16px", gap: "10px", boxShadow: "none" }}>
            <span className="ai-mark t-ai">المحرّر يقدر يكمّل بطريقة تانية</span>
            <p className="t-small">يدوّر على نفس الخبر في مصادر تانية، أو تلصق نص المقال بنفسك.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <Button variant="ai" size="sm" onClick={desk.searchInstead}>
                ابحث عن الخبر
              </Button>
              <Button
                variant="quiet"
                size="sm"
                onClick={() => {
                  desk.pasteInstead();
                  sourceRef.current?.focus();
                }}
              >
                الصق النص
              </Button>
            </div>
          </AiPanel>
        )}

        <fieldset className="col" style={{ border: 0, padding: 0, margin: 0, gap: "8px" }}>
          <legend className="t-label" style={{ marginBottom: "8px" }}>
            ماذا تكتب؟
          </legend>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "8px" }}>
            {STYLES.map((item) => (
              <button
                key={item.id}
                className="tile"
                type="button"
                aria-pressed={desk.style === item.id}
                onClick={() => desk.setStyle(item.id)}
                style={{ padding: "10px", alignItems: "center", textAlign: "center", gap: "4px" }}
              >
                <span className="tile__name">{item.label}</span>
                <span className="tile__hint num" style={{ fontSize: "11.5px" }}>
                  {wordRange(item.id, desk.length)}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <button
          className="m-list"
          type="button"
          aria-haspopup="dialog"
          style={{ padding: 0, textAlign: "start" }}
          onClick={() => desk.setSettingsOpen(true)}
        >
          <span className="m-item" style={{ border: 0 }}>
            <span className="ic-wrap">
              <Icon name="filter" />
            </span>
            <span className="m-item__label">
              الضبط
              <small>{desk.settingsSummary}</small>
            </span>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--teal)" }}>تعديل</span>
          </span>
        </button>
      </main>

      <div className="m-cta" style={{ paddingBottom: "12px" }}>
        {desk.error && !desk.urlRejected && <ToolErrorNotice error={desk.error} onRetry={desk.retry} />}
        {empty && <p className="m-cta__hint">الصق رابط أو اكتب موضوع عشان تبدأ</p>}
        <Button variant="ai" block size="lg" disabled={!desk.canSubmit} onClick={() => desk.submit()}>
          <Icon name="sparkle" />
          {STYLE_ACTION[desk.style]}
        </Button>
      </div>

      <Sheet
        open={desk.draftsOpen}
        onClose={() => desk.setDraftsOpen(false)}
        aria-labelledby="md-t"
        className="col"
        style={SHEET_STYLE}
      >
        <header className="row" style={{ justifyContent: "space-between", padding: "6px 20px 12px" }}>
          <div className="col">
            <h2 id="md-t" className="t-title">
              مسوداتي
            </h2>
            <span className="t-meta">محفوظة على الجهاز ده · آخر ٢٠</span>
          </div>
          <Button variant="ghost" size="sm" style={{ color: "var(--breaking)" }} onClick={desk.removeAllDrafts}>
            امسح الكل
          </Button>
        </header>
        <div className="m-scroll" style={{ padding: "0 16px" }}>
          <div className="m-list">
            {desk.drafts.map((draft) => (
              <div key={draft.id} className="m-item" style={{ minHeight: "70px" }}>
                <Badge variant={draft.id === (desk.activeId ?? desk.drafts[0]?.id) ? "ai" : "topic"}>{STYLE_LABEL[draft.style]}</Badge>
                <button type="button" className="m-item__label" style={PLAIN_BUTTON_STYLE} onClick={() => desk.openDraft(draft.id)}>
                  <span className="ellipsis">{draft.title}</span>
                  <small>{draftMeta(draft, false)}</small>
                </button>
                <IconButton label="حذف المسودة" onClick={() => desk.removeDraft(draft.id)}>
                  <Icon name="trash" size="sm" />
                </IconButton>
              </div>
            ))}
          </div>
        </div>
      </Sheet>

      <Sheet
        open={desk.settingsOpen}
        onClose={() => desk.setSettingsOpen(false)}
        aria-labelledby="mg-settings-t"
        className="col"
        style={SHEET_STYLE}
      >
        <header className="row" style={{ justifyContent: "space-between", padding: "6px 20px 12px" }}>
          <h2 id="mg-settings-t" className="t-title">
            الضبط
          </h2>
        </header>
        <div className="m-scroll col" style={{ padding: "0 20px", gap: "12px" }}>
          <SettingsRows desk={desk} />
        </div>
      </Sheet>
    </>
  );
}

function MobWriting({ desk }: { desk: GenerateDesk }) {
  const style = desk.run?.style ?? desk.style;
  const host = desk.run?.url ? urlHost(desk.run.url) : "";
  return (
    <>
      <header className="m-bar">
        <span className="m-bar__title" style={{ paddingInlineStart: "8px" }}>
          {host ? `${STYLE_LABEL[style]} من ${host}` : STYLE_LABEL[style]}
        </span>
        <Badge variant="ai">يكتب…</Badge>
      </header>
      <main className="m-scroll col" style={{ padding: "20px 16px", gap: "16px" }}>
        <AiPanel as="section" glow className="col" style={{ padding: "22px 20px", gap: "18px" }} aria-live="polite">
          <span className="ai-mark t-ai" style={{ fontSize: "14px" }}>
            المحرّر يكتب {STYLE_DEFINITE[style]}
          </span>
          <PulseLine preset="320x44" />
          <AiSteps steps={writingSteps(desk, "mob")} />
        </AiPanel>
        <div className="doc col" style={{ padding: "20px", gap: "12px" }}>
          <Skeleton height="24px" width="90%" />
          <Skeleton height="14px" width="55%" />
          <Skeleton height="13px" width="100%" style={{ marginTop: "8px" }} />
          <Skeleton height="13px" width="96%" />
          <Skeleton height="13px" width="88%" />
          <Skeleton height="13px" width="60%" />
        </div>
      </main>
      <div className="m-cta">
        <Button variant="ghost" block style={{ color: "var(--breaking)" }} onClick={desk.cancel}>
          إلغاء
        </Button>
      </div>
    </>
  );
}

function MobDone({ desk, draft }: { desk: GenerateDesk; draft: GenerateDraft }) {
  const dir = draft.language === "en" ? "ltr" : "rtl";
  return (
    <>
      <header className="m-bar">
        <IconButton label="رجوع للتعيين" icon="arrow-back" onClick={desk.backToForm} />
        <Badge variant="ai">{STYLE_LABEL[draft.style]}</Badge>
        {draft.sourceMode && <Badge variant="teal">{SOURCE_MODE_LABEL[draft.sourceMode]}</Badge>}
        <span className="grow" />
        <IconButton label="تنزيل" icon="download" onClick={() => desk.download(draft)} />
      </header>
      <main className="m-scroll" style={{ padding: "16px" }}>
        <article key={draft.id} className="doc typeset col" style={{ padding: "0 0 18px", gap: "2px" }}>
          <div className="ai-strip" />
          <div className="col" style={{ padding: "14px 20px 0", gap: "2px" }}>
            <p className="t-meta num" style={{ marginBottom: "4px" }}>
              {lengthLine(draft)}
            </p>
            <div className="block" style={BLOCK_STYLE}>
              <div className="block__label">
                العنوان
                <CopyButton done={desk.copied === "title"} onClick={(control) => desk.copyBlock("title", draft.title, control)} />
              </div>
              <h1 className="t-display" style={{ fontSize: "22px" }} lang={draft.language} dir={dir}>
                {draft.title}
              </h1>
            </div>
            {draft.dek && (
              <div className="block" style={BLOCK_STYLE}>
                <div className="block__label">المقدمة</div>
                <p style={{ fontWeight: 500, fontSize: "16px", lineHeight: 1.7, color: "var(--ink-2)" }} lang={draft.language} dir={dir}>
                  {draft.dek}
                </p>
              </div>
            )}
            <div className="block" style={BLOCK_STYLE}>
              <div className="block__label">النص</div>
              <div className="t-body col" style={{ color: "var(--ink)", gap: "12px", fontSize: "16px" }} lang={draft.language} dir={dir}>
                {paragraphs(draft.body).map((text, index) => (
                  <p key={index}>{text}</p>
                ))}
              </div>
            </div>
          </div>
        </article>
      </main>
      <div className="m-cta">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <Link className="btn btn--quiet btn--sm" to="/translate" state={{ source: packCopy(draft) }} style={{ minHeight: "42px" }}>
            ترجم
          </Link>
          <Button
            variant="ai"
            size="sm"
            style={{ minHeight: "42px" }}
            loading={desk.social.pending}
            disabled={desk.social.blocked}
            onClick={() => desk.social.start(packCopy(draft), draft.language)}
          >
            حوّله لمنشور
          </Button>
        </div>
        <Button variant="ink" block size="lg" onClick={(event) => desk.copyAll(draft, event.currentTarget)}>
          <Icon name="copy" />
          نسخ {STYLE_DEFINITE[draft.style]} كاملاً
        </Button>
      </div>
    </>
  );
}
