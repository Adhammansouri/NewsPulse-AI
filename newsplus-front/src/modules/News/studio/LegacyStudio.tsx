// TRANSITIONAL (S05 → S06): the pre-Pulse draft view (draft, revisions, format switch) in the legacy content area.
// S05 rebuilt the story, the formats and «المحرّر يكتب» around it (StoryPanel, FormatDeck, StudioFooter,
// StudioGenerating, mobile/*); S06 replaces this view with the Pulse draft editor.
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Chats,
  Check,
  CircleNotch,
  Compass,
  Copy,
  FileText,
  Images,
  LinkSimple,
  ListBullets,
  Newspaper,
  ShareNetwork,
  Stack,
  VideoCamera,
  WarningCircle,
} from "@phosphor-icons/react";
import type { CarouselOptions, NewsFeedItem, NewsSummarizeData } from "@newsplus/shared";
import { QuotaNotice } from "@/components/QuotaNotice";
import { LegacyContent } from "@/components/shell/LegacyContent";
import { isOpenAIQuotaError, toolErrorMessage } from "@/services/toolErrors";
import { EditorialDraft } from "../components/editorial/EditorialDraft";
import { RevisionThread } from "../components/editorial/RevisionThread";
import { STORY_FORMATS, storyFormatMeta } from "../newsFormat";
import type { EditorialDesk } from "./useEditorialDesk";

const FORMAT_ICONS = {
  desk: FileText,
  bulletin: Newspaper,
  facts: ListBullets,
  context: Compass,
  social: ShareNetwork,
  video: VideoCamera,
  carousel: Images,
  briefing: Stack,
};

export function LegacyStudio({
  desk,
  selected,
  mobile,
  onBack,
}: {
  desk: EditorialDesk;
  selected: NewsFeedItem | null;
  mobile: boolean;
  /** Mobile: back to the wire. */
  onBack: () => void;
}) {
  const paneRef = useRef<HTMLElement>(null);
  const { summary, busy, error, showEditorial, conversationId, resultFormat, editorialPane } = desk;

  useEffect(() => {
    if (mobile) paneRef.current?.focus({ preventScroll: true });
  }, [mobile]);

  return (
    <LegacyContent tools>
      <div className="news-desk newsroom is-desk">
        <section
          id="news-desk-pane"
          ref={paneRef}
          tabIndex={-1}
          className={`news-pane news-desk-pane newsroom-desk-pane ${showEditorial ? "is-editorial" : ""}`}
          aria-label="التحرير"
        >
          <div className="news-pane-bar news-desk-bar">
            <div className="newsroom-desk-heading">
              <button type="button" className="newsroom-back" aria-label="العودة إلى العناوين" onClick={onBack}>
                <ArrowLeft size={18} aria-hidden="true" />
              </button>
              <p className="news-pane-label">
                <FileText size={17} aria-hidden="true" />
                {showEditorial ? "المسودة والمحرّر" : "الخبر وأدوات الكتابة"}
              </p>
            </div>
            <div className="news-desk-bar-tools">
              {busy ? (
                <p className="news-desk-busy" aria-live="polite">
                  <CircleNotch className="news-spin" size={14} aria-hidden="true" />
                  جاري الكتابة...
                </p>
              ) : null}
              {!busy && (
                <span className="news-pane-meta">
                  {showEditorial ? storyFormatMeta(resultFormat).label : "معاينة المصدر"}
                </span>
              )}
              <button
                type="button"
                className="news-btn-secondary newsroom-history"
                onClick={() => desk.setDrawerOpen(true)}
                aria-haspopup="dialog"
              >
                <Chats size={18} aria-hidden="true" />
                <span>المحادثات</span>
              </button>
            </div>
          </div>

          {showEditorial && conversationId && (
            <div className="newsroom-editor-tabs" role="group" aria-label="أدوات التحرير">
              <button
                type="button"
                className={editorialPane === "draft" ? "is-active" : ""}
                aria-pressed={editorialPane === "draft"}
                aria-controls="news-editorial-draft"
                onClick={() => desk.setEditorialPane("draft")}
              >
                <FileText size={16} aria-hidden="true" />
                المسودة
              </button>
              <button
                type="button"
                className={editorialPane === "revision" ? "is-active" : ""}
                aria-pressed={editorialPane === "revision"}
                aria-controls="news-editorial-revision"
                onClick={() => desk.setEditorialPane("revision")}
              >
                <Chats size={16} aria-hidden="true" />
                تعديل النص <span className="newsroom-tab-note">والنسخ السابقة</span>
              </button>
            </div>
          )}

          <div className="news-desk-main">
            <div className="news-pane-scroll news-desk-body">
              {showEditorial ? (
                desk.conversationLoading && !summary ? (
                  <div className="news-editorial news-editorial--loading">
                    <p className="news-state" aria-live="polite">
                      <CircleNotch className="news-spin" size={18} aria-hidden="true" />
                      جاري فتح المحادثة…
                    </p>
                  </div>
                ) : summary ? (
                  <div className="news-editorial">
                    <div className={`news-editorial-stage is-${editorialPane} ${conversationId ? "has-revision" : ""}`}>
                      <div className="news-editorial-main" id="news-editorial-draft">
                        <div className="news-editorial-toolbar">
                          <DeskFormatBar
                            selected={resultFormat}
                            busy={busy}
                            briefingDisabled={busy}
                            carouselOptions={desk.carouselOptions}
                            onCarouselOptions={desk.setCarouselOptions}
                            onApplyCarousel={() => desk.runStoryFormat("carousel")}
                            onSelectFormat={desk.switchFormat}
                          />
                          <div className="news-editorial-actions">
                            <button
                              type="button"
                              className="news-editorial-action"
                              onClick={() => void desk.onCopy(summary)}
                              disabled={busy}
                              aria-label={desk.copied ? "تم النسخ" : "نسخ المسودة"}
                              title={desk.copied ? "تم النسخ" : "نسخ"}
                            >
                              {desk.copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
                              <span>{desk.copied ? "تم النسخ" : "نسخ"}</span>
                            </button>
                            <button
                              type="button"
                              className="news-editorial-action"
                              onClick={desk.closeDraft}
                              disabled={busy}
                              aria-label="خبر آخر"
                              title="خبر آخر"
                            >
                              <Newspaper size={15} aria-hidden="true" />
                              <span>خبر آخر</span>
                            </button>
                          </div>
                        </div>
                        <div className="news-editorial-doc">
                          <EditorialDraft
                            data={summary}
                            format={resultFormat}
                            busy={busy}
                            copied={desk.copied}
                            hideCopy
                            onCopy={() => void desk.onCopy(summary)}
                          />
                          {error ? <DeskError error={error} /> : null}
                        </div>
                      </div>
                      {conversationId ? (
                        <RevisionThread
                          id="news-editorial-revision"
                          messages={desk.detail?.messages ?? []}
                          versions={desk.detail?.versions ?? []}
                          currentVersionId={desk.detail?.currentVersionId ?? summary.versionId ?? ""}
                          pendingMemory={desk.detail?.pendingMemory ?? []}
                          instruction={desk.instruction}
                          busy={busy}
                          format={resultFormat}
                          onInstructionChange={desk.setInstruction}
                          onSubmit={desk.submitRevision}
                          onQuickAction={desk.quickRevision}
                          onRestore={(versionId) => {
                            desk.restore(versionId);
                          }}
                          onMemorySave={(id) => desk.saveMemory(id)}
                          onMemoryEdit={(id, next) => desk.saveMemory(id, next)}
                          onMemoryDismiss={desk.dismissMemory}
                        />
                      ) : null}
                    </div>
                  </div>
                ) : null
              ) : error ? (
                <DeskError error={error} />
              ) : null}
            </div>

            {desk.copyError && (
              <p className="newsroom-copy-error" role="alert">
                تعذّر النسخ. يمكنك تحديد النص ونسخه يدوياً.
              </p>
            )}

            <Link
              to="/generate"
              state={{
                prompt: selected?.sources[0]?.url ?? "",
                source: "news",
                style: "brief",
              }}
              className="news-compose-link"
            >
              <span className="news-compose-toggle-label">
                <LinkSimple size={14} aria-hidden="true" />
                لصق رابط وتوليد ملخص
              </span>
              <ArrowLeft size={16} weight="bold" aria-hidden="true" />
            </Link>
          </div>
        </section>
        <p className="sr-only" role="status">
          {desk.copied ? "تم نسخ المسودة" : ""}
        </p>
      </div>
    </LegacyContent>
  );
}

function DeskError({ error }: { error: unknown }) {
  if (isOpenAIQuotaError(error)) return <QuotaNotice />;
  return (
    <p className="news-state is-error" role="alert">
      <WarningCircle size={18} aria-hidden="true" />
      {toolErrorMessage(error)}
    </p>
  );
}

/** The draft's format switch (re-generates the story in another format). */
function DeskFormatBar({
  selected,
  busy,
  briefingDisabled,
  carouselOptions,
  onCarouselOptions,
  onApplyCarousel,
  onSelectFormat,
}: {
  selected: NewsSummarizeData["format"];
  busy: boolean;
  briefingDisabled: boolean;
  carouselOptions?: CarouselOptions;
  onCarouselOptions?: (next: CarouselOptions) => void;
  onApplyCarousel?: () => void;
  onSelectFormat: (format: NewsSummarizeData["format"]) => void;
}) {
  const hintId = "news-format-hint-result";
  const meta = storyFormatMeta(selected);
  const choices = [...STORY_FORMATS, { id: "briefing" as const, label: "موجز", hint: "أعلى 8 عناوين في الغرفة" }];

  return (
    <div className="news-format-bar is-compact is-switch">
      <span className="sr-only" id={hintId}>
        {meta.hint}
      </span>

      <div className="news-format-toolbar">
        <div className="news-seg news-seg--formats" role="group" aria-label="شكل التلخيص" aria-describedby={hintId}>
          {choices.map((option) => {
            const Icon = FORMAT_ICONS[option.id];
            const active = selected === option.id;
            const isBriefing = option.id === "briefing";
            return (
              <button
                key={option.id}
                type="button"
                className={`news-seg-btn ${isBriefing ? "news-seg-btn--split" : ""} ${active ? "is-active" : ""}`}
                disabled={isBriefing ? briefingDisabled : busy}
                aria-pressed={active}
                title={option.hint}
                onClick={() => onSelectFormat(option.id)}
              >
                {busy && active ? (
                  <CircleNotch className="news-spin" size={18} aria-hidden="true" />
                ) : (
                  <Icon size={18} aria-hidden="true" />
                )}
                <span className="newsroom-format-copy">
                  <span>{option.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {selected === "carousel" && carouselOptions && onCarouselOptions ? (
        <details className="newsroom-carousel-settings">
          <summary>إعدادات الكاروسيل</summary>
          <CarouselControls
            options={carouselOptions}
            busy={busy}
            showApply
            onChange={onCarouselOptions}
            onApply={onApplyCarousel}
          />
        </details>
      ) : null}
    </div>
  );
}

export function CarouselControls({
  options,
  busy,
  showApply,
  onChange,
  onApply,
}: {
  options: CarouselOptions;
  busy: boolean;
  showApply: boolean;
  onChange: (next: CarouselOptions) => void;
  onApply?: () => void;
}) {
  return (
    <div className="news-carousel-controls">
      <div className="news-carousel-field">
        <span className="news-field-label">عدد الشرائح</span>
        <div className="news-carousel-pills" role="group" aria-label="عدد الشرائح">
          {[3, 4, 5, 6].map((count) => (
            <button
              key={count}
              type="button"
              className={`news-seg-btn ${options.slides === count ? "is-active" : ""}`}
              aria-pressed={options.slides === count}
              disabled={busy}
              onClick={() => onChange({ ...options, slides: count })}
            >
              {count}
            </button>
          ))}
        </div>
      </div>
      <div className="news-carousel-field">
        <span className="news-field-label">الأسلوب</span>
        <div className="news-carousel-pills" role="group" aria-label="أسلوب النص">
          <StyleButton
            active={options.style === "cinematic"}
            disabled={busy}
            onClick={() => onChange({ ...options, style: "cinematic" })}
          >
            قصة
          </StyleButton>
          <StyleButton
            active={options.style === "frame"}
            disabled={busy}
            onClick={() => onChange({ ...options, style: "frame" })}
          >
            بطاقة
          </StyleButton>
        </div>
      </div>
      <div className="news-carousel-field">
        <span className="news-field-label">كثافة النص</span>
        <div className="news-carousel-pills" role="group" aria-label="كثافة نص الشرائح">
          {(
            [
              { id: "headline", label: "عنوان" },
              { id: "banner", label: "عنوان وشريط" },
              { id: "line", label: "سطر توضيحي" },
            ] as const
          ).map((option) => (
            <StyleButton
              key={option.id}
              active={options.density === option.id}
              disabled={busy}
              onClick={() => onChange({ ...options, density: option.id })}
            >
              {option.label}
            </StyleButton>
          ))}
        </div>
      </div>
      <label className="newsroom-carousel-mark">
        <input
          type="checkbox"
          checked={options.mark}
          disabled={busy}
          onChange={(event) => onChange({ ...options, mark: event.target.checked })}
        />
        إظهار علامة Newsplus
      </label>
      {showApply && onApply ? (
        <button type="button" className="news-btn-primary news-carousel-apply" disabled={busy} onClick={onApply}>
          تحديث الشرائح
        </button>
      ) : null}
    </div>
  );
}

function StyleButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      className={`news-seg-btn ${active ? "is-active" : ""}`}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
