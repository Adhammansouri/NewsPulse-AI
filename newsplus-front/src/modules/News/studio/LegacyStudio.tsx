// TRANSITIONAL (S04 → S05/S06): the pre-Pulse story preview + editorial desk, moved out of NewsPage as-is and
// shown in the legacy content area next to the new wire. S05 (story / formats) and S06 (draft) replace it.
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowSquareOut,
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
import { ConversationDrawer } from "../components/editorial/ConversationDrawer";
import { EditorialDraft } from "../components/editorial/EditorialDraft";
import { RevisionThread } from "../components/editorial/RevisionThread";
import { formatRelative, formatStamp, hasArabic, newsRecency, STORY_FORMATS, storyFormatMeta } from "../newsFormat";
import { SourceMark, SourceMarkStack } from "../SourceMark";
import { hostFromUrl } from "../sourceLogos";
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
  itemCount,
  mobile,
  onBack,
}: {
  desk: EditorialDesk;
  selected: NewsFeedItem | null;
  /** Headlines in the wire (the briefing needs some). */
  itemCount: number;
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
                            mode="switch"
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
              ) : (
                <>
                  {error ? <DeskError error={error} /> : null}

                  {selected ? (
                    <article className={["news-story-card", `is-${newsRecency(selected.publishedAt)}`].join(" ")}>
                      <div className="news-story-copy">
                        <div className="news-story-card-meta">
                          <div className="news-feed-source">
                            <SourceMarkStack sources={selected.sources} size={24} />
                            {selected.sources[0] ? (
                              <span className="news-source-name">{selected.sources[0].name}</span>
                            ) : null}
                            {selected.sources.length > 1 ? (
                              <span className="news-cluster">+{selected.sources.length - 1}</span>
                            ) : null}
                          </div>
                          <div className="news-feed-meta">
                            <time
                              className={`news-time is-${newsRecency(selected.publishedAt)}`}
                              dateTime={selected.publishedAt}
                              title={formatStamp(selected.publishedAt)}
                            >
                              {formatRelative(selected.publishedAt)}
                            </time>
                          </div>
                        </div>

                        <h2 className="news-story-title" dir={hasArabic(selected.title) ? "rtl" : "ltr"}>
                          {selected.title}
                        </h2>

                        {selected.excerpt ? (
                          <div className="news-story-brief">
                            <p className="news-story-kicker">من المصدر</p>
                            <p className="news-story-excerpt" dir={hasArabic(selected.excerpt) ? "rtl" : "ltr"}>
                              {selected.excerpt}
                            </p>
                          </div>
                        ) : (
                          <p className="news-story-excerpt is-empty">لا يتوفر موجز من المصدر. افتح الرابط الأصلي.</p>
                        )}

                        {selected.sources.length > 0 ? (
                          <ul className="news-story-origin">
                            {selected.sources.map((source) => {
                              const host = hostFromUrl(source.url);
                              return (
                                <li key={`${source.id}-${source.url}`}>
                                  <a href={source.url} target="_blank" rel="noreferrer">
                                    <SourceMark id={source.id} name={source.name} url={source.url} size={24} />
                                    <span className="news-story-origin-copy">
                                      <span>اقرأ في {source.name}</span>
                                      {host ? <span className="news-story-origin-host">{host}</span> : null}
                                    </span>
                                    <ArrowSquareOut size={14} weight="regular" aria-hidden="true" />
                                  </a>
                                </li>
                              );
                            })}
                          </ul>
                        ) : null}
                      </div>

                      <div className="news-desk-actions">
                        <DeskFormatBar
                          mode="picker"
                          selected={desk.selectedFormat}
                          busy={busy}
                          briefingDisabled={busy || itemCount === 0}
                          showHint
                          carouselOptions={desk.carouselOptions}
                          onCarouselOptions={desk.setCarouselOptions}
                          onSelectFormat={desk.selectFormat}
                        />
                      </div>
                    </article>
                  ) : (
                    !busy &&
                    !error && (
                      <div className="news-desk-empty">
                        <p>اختر خبراً من العناوين لعرضه هنا ثم اطلب ملخصاً تحريرياً.</p>
                      </div>
                    )
                  )}
                </>
              )}
            </div>

            {desk.copyError && (
              <p className="newsroom-copy-error" role="alert">
                تعذّر النسخ. يمكنك تحديد النص ونسخه يدوياً.
              </p>
            )}
            {!showEditorial && selected && (
              <div className="newsroom-generate-dock">
                <p>
                  <span>الصيغة المختارة</span>
                  <strong>{storyFormatMeta(desk.selectedFormat).label}</strong>
                </p>
                <button
                  type="button"
                  className="news-btn-primary"
                  disabled={busy || (desk.selectedFormat === "briefing" && itemCount === 0)}
                  onClick={desk.generateSummary}
                >
                  {busy ? (
                    <CircleNotch className="news-spin" size={18} aria-hidden="true" />
                  ) : (
                    <FileText size={18} aria-hidden="true" />
                  )}
                  {busy ? "جارٍ إعداد المحتوى…" : "توليد المحتوى"}
                </button>
              </div>
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
        <ConversationDrawer
          busy={busy}
          open={desk.drawerOpen}
          search={desk.conversationQuery}
          conversations={desk.conversations}
          memory={desk.memory}
          activeId={conversationId}
          listLoading={desk.conversationsLoading}
          error={desk.drawerError ? toolErrorMessage(desk.drawerError) : undefined}
          onSearch={desk.setConversationQuery}
          onClose={desk.closeDrawer}
          onSelect={desk.openConversation}
          onDisableMemory={desk.disableMemory}
        />
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

function DeskFormatBar({
  mode,
  selected,
  busy,
  briefingDisabled,
  showHint = false,
  carouselOptions,
  onCarouselOptions,
  onApplyCarousel,
  onSelectFormat,
}: {
  mode: "picker" | "switch";
  selected: NewsSummarizeData["format"];
  busy: boolean;
  briefingDisabled: boolean;
  showHint?: boolean;
  carouselOptions?: CarouselOptions;
  onCarouselOptions?: (next: CarouselOptions) => void;
  onApplyCarousel?: () => void;
  onSelectFormat: (format: NewsSummarizeData["format"]) => void;
}) {
  const hintId = showHint ? "news-format-hint-story" : "news-format-hint-result";
  const meta = storyFormatMeta(selected);
  const isPicker = mode === "picker";
  const choices = [...STORY_FORMATS, { id: "briefing" as const, label: "موجز", hint: "أعلى 8 عناوين في الغرفة" }];

  return (
    <div className={`news-format-bar ${showHint ? "" : "is-compact"} ${isPicker ? "is-picker" : "is-switch"}`}>
      {showHint ? (
        <p className="news-format-caption" id={hintId}>
          <span>اختر صيغة المحتوى</span>
          <span>للخبر أو لموجز العناوين</span>
        </p>
      ) : (
        <span className="sr-only" id={hintId}>
          {meta.hint}
        </span>
      )}

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
                  {isPicker && <span className="newsroom-format-hint">{option.hint}</span>}
                </span>
                {isPicker && active && <Check className="newsroom-format-check" size={14} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </div>
      {selected === "carousel" && carouselOptions && onCarouselOptions ? (
        isPicker ? (
          <CarouselControls options={carouselOptions} busy={busy} showApply={false} onChange={onCarouselOptions} />
        ) : (
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
        )
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
