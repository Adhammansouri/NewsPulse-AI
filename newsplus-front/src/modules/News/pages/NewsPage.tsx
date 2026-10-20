import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowClockwise,
  ArrowRight,
  ArrowSquareOut,
  Chats,
  FileText,
  LinkSimple,
  Newspaper,
  PencilSimple,
  WarningCircle,
} from "@phosphor-icons/react";
import type { CarouselOptions, NewsFeedItem, NewsLanguage, NewsSummarizeData } from "@newsplus/shared";
import { QuotaNotice } from "@/components/QuotaNotice";
import { CopyButton } from "@/components/ui/CopyButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Segmented } from "@/components/ui/Segmented";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { useNewsFeed } from "@/hooks/useNewsFeed";
import { readDeskHandoff } from "@/services/deskHandoff";
import {
  getEditorialConversation,
  listEditorialConversations,
  listEditorialMemory,
  restoreEditorialVersion,
  reviseEditorialConversation,
  updateEditorialMemory,
} from "@/services/editorialService";
import { getNewsSources, summarizeNews } from "@/services/newsService";
import { isOpenAIQuotaError, toolErrorMessage } from "@/services/toolErrors";
import { formatRelative } from "@/utils/format";
import { SourceMark, SourceMarkStack } from "../SourceMark";
import { hostFromUrl } from "../sourceLogos";
import {
  formatStamp,
  formatSummaryClipboard,
  hasArabic,
  isBreaking,
  matchesTimeFilter,
  matchesTopicFilter,
  newsRecency,
  storyFormatMeta,
  timeFilterCounts,
  topicFilterCounts,
  type TimeFilter,
  type TopicFilter,
} from "../newsFormat";
import { ConversationDrawer } from "../components/editorial/ConversationDrawer";
import { EditorialDraft } from "../components/editorial/EditorialDraft";
import { RevisionThread } from "../components/editorial/RevisionThread";
import { FormatCards, FormatSwitch } from "../components/FormatPicker";
import { NewsToolbar, type FeedFilters } from "../components/NewsToolbar";
import { WireRow, WireSkeleton } from "../components/WireRow";
import "../newsroom.css";

type Format = NewsSummarizeData["format"];
type EditorTab = "draft" | "chat";

const DEFAULT_CAROUSEL: CarouselOptions = { slides: 4, style: "cinematic", density: "banner", mark: true };

export default function NewsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isDesktop = useIsDesktop();
  const [params, setParams] = useSearchParams();
  const handoff = readDeskHandoff(location.state);

  // The URL says what is open: ?item=<headline>&c=<conversation>. Back/forward just work.
  const itemParam = params.get("item") ?? handoff?.itemId ?? null;
  const conversationId = params.get("c");

  const [sourceId, setSourceId] = useState("all");
  const [langFilter, setLangFilter] = useState<"all" | NewsLanguage>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [topicFilter, setTopicFilter] = useState<TopicFilter>("all");
  const [search, setSearch] = useState("");
  const query = useDebouncedValue(search.trim(), 350);

  const [pinned, setPinned] = useState<NewsFeedItem | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<Format>("desk");
  const [carouselOptions, setCarouselOptions] = useState<CarouselOptions>(DEFAULT_CAROUSEL);
  const [tab, setTab] = useState<EditorTab>("draft");
  const [instruction, setInstruction] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [conversationQuery, setConversationQuery] = useState("");
  const [newIds, setNewIds] = useState<string[]>([]);

  const feedScrollRef = useRef<HTMLDivElement>(null);
  const workRef = useRef<HTMLElement>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const snapshotKeyRef = useRef("");

  const sourcesQuery = useQuery({ queryKey: ["news-sources"], queryFn: getNewsSources });
  const feedQuery = useNewsFeed(sourceId, query);

  const patchParams = useCallback(
    (patch: Record<string, string | null>, replace = true) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(patch)) {
            if (value === null) next.delete(key);
            else next.set(key, value);
          }
          return next;
        },
        { replace },
      );
    },
    [setParams],
  );

  const summarizeMutation = useMutation({
    mutationFn: summarizeNews,
    onSuccess(data) {
      setTab("draft");
      if (!data.conversationId) return;
      patchParams({ c: data.conversationId });
      void queryClient.invalidateQueries({ queryKey: ["editorial-conversations"] });
      void queryClient.invalidateQueries({ queryKey: ["editorial-conversation", data.conversationId] });
    },
  });

  const conversationDetailQuery = useQuery({
    queryKey: ["editorial-conversation", conversationId],
    queryFn: () => getEditorialConversation(conversationId as string),
    enabled: Boolean(conversationId),
  });

  const conversationListQuery = useQuery({
    queryKey: ["editorial-conversations", conversationQuery],
    queryFn: () => listEditorialConversations(conversationQuery),
    enabled: drawerOpen,
  });

  const memoryQuery = useQuery({
    queryKey: ["editorial-memory"],
    queryFn: () => listEditorialMemory("approved"),
    enabled: drawerOpen,
  });

  const reviseMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => reviseEditorialConversation(id, text),
    onSuccess(data) {
      setInstruction("");
      queryClient.setQueryData(["editorial-conversation", data.conversation.id], data.conversation);
      void queryClient.invalidateQueries({ queryKey: ["editorial-conversations"] });
      void queryClient.invalidateQueries({ queryKey: ["editorial-memory"] });
    },
    onError() {
      void queryClient.invalidateQueries({ queryKey: ["editorial-conversation", conversationId] });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: ({ id, versionId }: { id: string; versionId: string }) => restoreEditorialVersion(id, versionId),
    onSuccess(data) {
      setTab("draft");
      queryClient.setQueryData(["editorial-conversation", data.conversation.id], data.conversation);
      void queryClient.invalidateQueries({ queryKey: ["editorial-conversations"] });
    },
  });

  const memoryMutation = useMutation({
    mutationFn: ({ id, status, instruction: next }: { id: string; status?: "approved" | "rejected" | "disabled"; instruction?: string }) =>
      updateEditorialMemory(id, { status, instruction: next }),
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ["editorial-conversation", conversationId] });
      void queryClient.invalidateQueries({ queryKey: ["editorial-memory"] });
    },
  });

  // ---- Feed derivation --------------------------------------------------
  const sources = sourcesQuery.data?.sources ?? [];

  const scopedItems = useMemo(() => {
    const all = feedQuery.data?.items ?? [];
    if (sourceId !== "all" || langFilter === "all") return all;
    const allowed = new Set(sources.filter((source) => source.language === langFilter).map((source) => source.id));
    return all.filter((item) => item.sources.some((source) => allowed.has(source.id)));
  }, [feedQuery.data?.items, langFilter, sourceId, sources]);

  const timeCounts = useMemo(() => timeFilterCounts(scopedItems), [scopedItems]);
  const timedItems = useMemo(() => scopedItems.filter((item) => matchesTimeFilter(item.publishedAt, timeFilter)), [scopedItems, timeFilter]);
  const topicCounts = useMemo(() => topicFilterCounts(timedItems), [timedItems]);
  const items = useMemo(() => timedItems.filter((item) => matchesTopicFilter(item.topic, topicFilter)), [timedItems, topicFilter]);

  // The open story outlives refreshes: cluster ids can change, so we keep a snapshot.
  const fromFeed = itemParam ? items.find((item) => item.id === itemParam) ?? null : null;
  const selected = fromFeed ?? (pinned && (!itemParam || pinned.id === itemParam) ? pinned : null);

  useEffect(() => {
    if (fromFeed) setPinned(fromFeed);
  }, [fromFeed]);

  useEffect(() => {
    // Desktop shows a story straight away; phones wait for a tap.
    if (!isDesktop || itemParam || pinned || conversationId) return;
    if (items[0]) setPinned(items[0]);
  }, [isDesktop, itemParam, pinned, conversationId, items]);

  // ---- Derived work state ----------------------------------------------
  const detail = conversationDetailQuery.data;
  const summary: NewsSummarizeData | undefined = detail?.copy ?? summarizeMutation.data;
  const opening = Boolean(conversationId) && conversationDetailQuery.isLoading && !summary;
  const hasDraft = Boolean(summary);
  const busy = summarizeMutation.isPending || reviseMutation.isPending || restoreMutation.isPending || memoryMutation.isPending;
  const workError =
    summarizeMutation.error ?? conversationDetailQuery.error ?? reviseMutation.error ?? restoreMutation.error ?? memoryMutation.error;
  const resultFormat: Format = summary?.format ?? selectedFormat;
  const pendingFormat: Format = summarizeMutation.variables?.briefing ? "briefing" : (summarizeMutation.variables?.format ?? selectedFormat);
  const workOpen = Boolean(itemParam || conversationId);
  const mobileOpen = !isDesktop && workOpen;

  // Keep selection/format in step with a loaded conversation.
  useEffect(() => {
    if (!detail) return;
    setSelectedFormat(detail.format);
    if (detail.itemId && detail.itemId !== params.get("item")) patchParams({ item: detail.itemId });
    if (detail.copy.carousel) {
      const { slides, style, density, mark } = detail.copy.carousel;
      setCarouselOptions({ slides: slides.length, style, density, mark });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail]);

  useEffect(() => {
    if (!handoff?.input) return;
    navigate("/generate", { replace: true, state: { prompt: handoff.input, source: "news", style: "brief" } });
  }, [handoff?.input, navigate]);

  // New-arrival tracking: only announce items that appear while the filters stay the same.
  const snapshotKey = `${sourceId}|${langFilter}|${timeFilter}|${topicFilter}|${query}`;
  useEffect(() => {
    const ids = items.map((item) => item.id);
    if (snapshotKeyRef.current !== snapshotKey) {
      snapshotKeyRef.current = snapshotKey;
      seenIdsRef.current = new Set(ids);
      setNewIds([]);
      return;
    }
    if (ids.length === 0) return;
    if (seenIdsRef.current.size === 0) {
      seenIdsRef.current = new Set(ids);
      return;
    }
    const incoming = ids.filter((id) => !seenIdsRef.current.has(id));
    if (incoming.length === 0) return;
    for (const id of incoming) seenIdsRef.current.add(id);
    setNewIds((prev) => [...incoming, ...prev.filter((id) => ids.includes(id) && !incoming.includes(id))]);
  }, [items, snapshotKey]);

  useEffect(() => {
    if (mobileOpen) workRef.current?.focus({ preventScroll: true });
  }, [mobileOpen]);

  function revealNew() {
    const first = newIds[0];
    setNewIds([]);
    if (!first) return;
    window.requestAnimationFrame(() => {
      const node = feedScrollRef.current?.querySelector(`[data-headline-id="${CSS.escape(first)}"]`);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      node?.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
    });
  }

  // ---- Actions ----------------------------------------------------------
  function resetWork() {
    summarizeMutation.reset();
    reviseMutation.reset();
    restoreMutation.reset();
    memoryMutation.reset();
    setInstruction("");
    setTab("draft");
  }

  function selectHeadline(item: NewsFeedItem) {
    if (busy) return;
    resetWork();
    setPinned(item);
    setNewIds((prev) => prev.filter((id) => id !== item.id));
    setSelectedFormat((current) => (current === "briefing" ? "desk" : current));
    patchParams({ item: item.id, c: null }, isDesktop);
  }

  function closeWork() {
    const id = itemParam;
    patchParams({ item: null, c: null }, false);
    resetWork();
    if (id) {
      window.requestAnimationFrame(() => {
        feedScrollRef.current?.querySelector<HTMLElement>(`[data-headline-id="${CSS.escape(id)}"]`)?.focus({ preventScroll: true });
      });
    }
  }

  function backToStory() {
    if (busy) return;
    resetWork();
    patchParams({ c: null });
  }

  function storyRequest(format: Format): Parameters<typeof summarizeNews>[0] {
    if (format === "briefing") return { briefing: true, language: "ar" };
    return {
      itemId: detail?.itemId ?? selected?.id,
      language: "ar",
      format,
      ...(format === "carousel" ? { carousel: carouselOptions } : {}),
    };
  }

  function generate(format: Format = selectedFormat) {
    if (busy) return;
    if (format !== "briefing" && !(detail?.itemId ?? selected)) return;
    setSelectedFormat(format);
    summarizeMutation.mutate(storyRequest(format));
  }

  function rewrite(format: Format) {
    if (busy) return;
    const request = storyRequest(format); // read the item id before the conversation is detached
    reviseMutation.reset();
    restoreMutation.reset();
    patchParams({ c: null });
    setSelectedFormat(format);
    summarizeMutation.mutate(request);
  }

  function submitRevision(text = instruction) {
    const value = text.trim();
    if (busy || !conversationId || !value) return;
    reviseMutation.mutate({ id: conversationId, text: value });
  }

  function changeFilters(patch: Partial<FeedFilters>) {
    if (patch.query !== undefined) setSearch(patch.query);
    if (patch.language !== undefined) setLangFilter(patch.language);
    if (patch.source !== undefined) setSourceId(patch.source);
    if (patch.time !== undefined) setTimeFilter(patch.time);
    if (patch.topic !== undefined) setTopicFilter(patch.topic);
  }

  function clearFilters() {
    setTimeFilter("all");
    setTopicFilter("all");
    setLangFilter("all");
    setSourceId("all");
    setSearch("");
  }

  const feedError = feedQuery.error ?? sourcesQuery.error;
  const refreshing = feedQuery.isFetching && !feedQuery.isLoading;

  return (
    <div className="nr" data-work={workOpen ? "open" : "closed"}>
      <header className="nr-head">
        <div className="nr-title">
          <h1 className="page-title">غرفة الأخبار</h1>
          <p className="nr-lede">تابع المصادر، صُغ الخبر، وراجعه مع المحرّر.</p>
        </div>
        <div className="nr-tools">
          <p className="nr-status" aria-live="polite">
            <span className={`dot ${feedQuery.isError ? "is-danger" : "is-live"}`} aria-hidden="true" />
            {feedQuery.isLoading ? "جارٍ التحميل" : `${items.length} عنوان`}
            {feedQuery.data?.fetchedAt ? <span className="nr-updated" title={formatStamp(feedQuery.data.fetchedAt)}>· {formatRelative(feedQuery.data.fetchedAt)}</span> : null}
          </p>
          <button type="button" className="icon-btn" aria-label="تحديث العناوين" disabled={feedQuery.isFetching} onClick={() => void feedQuery.refetch()}>
            <ArrowClockwise size={20} className={refreshing ? "nr-spin" : undefined} aria-hidden="true" />
          </button>
          <button type="button" className="btn btn-quiet btn-sm" onClick={() => setDrawerOpen(true)} aria-haspopup="dialog" aria-label="المحادثات المحفوظة">
            <Chats size={18} aria-hidden="true" />
            <span className="nr-history-label">المحادثات</span>
          </button>
        </div>
      </header>

      <NewsToolbar
        filters={{ query: search, language: langFilter, source: sourceId, time: timeFilter, topic: topicFilter }}
        sources={sources}
        timeCounts={timeCounts}
        topicCounts={topicCounts}
        onChange={changeFilters}
      />

      <div className="nr-body">
        <section className="nr-feed" aria-label="العناوين" aria-busy={feedQuery.isLoading} inert={mobileOpen || undefined}>
          {newIds.length > 0 ? (
            <button type="button" className="nr-new" onClick={revealNew}>
              {newIds.length} {newIds.length === 1 ? "خبر جديد" : "أخبار جديدة"}
            </button>
          ) : null}
          <div className="nr-feed-scroll" ref={feedScrollRef}>
            {feedError ? <DeskError error={feedError} /> : null}
            {feedQuery.isLoading ? <WireSkeleton rows={7} /> : null}
            {!feedQuery.isLoading && !feedError && items.length === 0 ? (
              <EmptyState
                icon={<Newspaper size={26} />}
                title="لا عناوين بهذه التصفية"
                action={<button type="button" className="btn btn-quiet btn-sm" onClick={clearFilters}>مسح التصفية</button>}
              >
                غيّر الوقت أو الموضوع أو المصدر، أو امسح كلمة البحث.
              </EmptyState>
            ) : null}
            {items.length > 0 ? (
              <div className="wire">
                {items.map((item) => (
                  <WireRow
                    key={item.id}
                    item={item}
                    active={selected?.id === item.id && (isDesktop || workOpen)}
                    arrived={newIds.includes(item.id)}
                    disabled={busy}
                    onSelect={() => selectHeadline(item)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section
          className="nr-work"
          ref={workRef}
          tabIndex={-1}
          aria-label="التحرير"
          inert={!isDesktop && !workOpen ? true : undefined}
        >
          <div className="nr-work-bar">
            <button type="button" className="icon-btn nr-back" aria-label="العودة إلى العناوين" onClick={closeWork}>
              <ArrowRight size={20} className="flip-rtl-back" aria-hidden="true" />
            </button>
            <p className="nr-work-title">
              {hasDraft ? <PencilSimple size={18} aria-hidden="true" /> : <FileText size={18} aria-hidden="true" />}
              {hasDraft ? storyFormatMeta(resultFormat).label : "الخبر"}
            </p>
            <div className="nr-work-actions">
              {hasDraft && summary ? (
                <>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={backToStory} disabled={busy}>
                    الخبر الأصلي
                  </button>
                  <CopyButton className="btn btn-quiet btn-sm" label="نسخ" disabled={busy} getText={() => formatSummaryClipboard(summary)} toastMessage="تم نسخ المسودة" />
                </>
              ) : null}
            </div>
          </div>

          {hasDraft && conversationId ? (
            <div className="nr-tabs">
              <Segmented
                value={tab}
                onChange={setTab}
                ariaLabel="أدوات التحرير"
                block
                options={[
                  { id: "draft", label: "المسودة" },
                  { id: "chat", label: "المحرّر" },
                ]}
              />
            </div>
          ) : null}

          {hasDraft || opening ? (
            <div className={`nr-editor ${hasDraft && conversationId ? "has-chat" : ""} tab-${tab}`}>
              <div className="nr-draft" id="news-draft">
                <div className="nr-scroll">
                  {workError ? <DeskError error={workError} /> : null}
                  {summary ? (
                    <FormatSwitch
                      selected={resultFormat}
                      busy={busy}
                      briefingDisabled={busy}
                      carouselOptions={carouselOptions}
                      onCarouselOptions={setCarouselOptions}
                      onApplyCarousel={() => rewrite("carousel")}
                      onSelect={rewrite}
                    />
                  ) : null}
                  {opening ? (
                    <Working label="جارٍ فتح المحادثة…" />
                  ) : summarizeMutation.isPending ? (
                    <Working label={`جارٍ كتابة ${storyFormatMeta(pendingFormat).label}…`} />
                  ) : summary ? (
                    <div className={reviseMutation.isPending || restoreMutation.isPending ? "nr-doc is-busy" : "nr-doc"} aria-busy={busy}>
                      <EditorialDraft key={summary.versionId ?? summary.title} data={summary} format={resultFormat} />
                    </div>
                  ) : null}
                </div>
              </div>

              {conversationId && summary ? (
                <RevisionThread
                  id="news-revision"
                  messages={detail?.messages ?? []}
                  versions={detail?.versions ?? []}
                  currentVersionId={detail?.currentVersionId ?? summary.versionId ?? ""}
                  pendingMemory={detail?.pendingMemory ?? []}
                  instruction={instruction}
                  busy={busy}
                  format={resultFormat}
                  onInstructionChange={setInstruction}
                  onSubmit={() => submitRevision()}
                  onQuickAction={(value) => submitRevision(value)}
                  onRestore={(versionId) => restoreMutation.mutate({ id: conversationId, versionId })}
                  onMemorySave={(id) => memoryMutation.mutate({ id, status: "approved" })}
                  onMemoryEdit={(id, next) => memoryMutation.mutate({ id, status: "approved", instruction: next })}
                  onMemoryDismiss={(id) => memoryMutation.mutate({ id, status: "rejected" })}
                />
              ) : null}
            </div>
          ) : summarizeMutation.isPending ? (
            <div className="nr-scroll">
              <Working label={`جارٍ كتابة ${storyFormatMeta(pendingFormat).label}…`} />
            </div>
          ) : (
            <StoryPanel
              story={selected}
              error={workError}
              selectedFormat={selectedFormat}
              carouselOptions={carouselOptions}
              busy={busy}
              hasItems={items.length > 0}
              missing={Boolean(itemParam) && !selected && !feedQuery.isLoading}
              onFormat={setSelectedFormat}
              onCarousel={setCarouselOptions}
              onGenerate={() => generate()}
            />
          )}
        </section>
      </div>

      <ConversationDrawer
        busy={busy}
        open={drawerOpen}
        search={conversationQuery}
        conversations={conversationListQuery.data?.items ?? []}
        memory={memoryQuery.data?.rules ?? []}
        activeId={conversationId}
        listLoading={conversationListQuery.isFetching}
        error={conversationListQuery.error || memoryQuery.error || memoryMutation.error ? toolErrorMessage(conversationListQuery.error ?? memoryQuery.error ?? memoryMutation.error) : undefined}
        onSearch={setConversationQuery}
        onClose={() => {
          setDrawerOpen(false);
          setConversationQuery("");
        }}
        onSelect={(id) => {
          if (busy) return;
          resetWork();
          setDrawerOpen(false);
          setConversationQuery("");
          patchParams({ c: id }, false);
        }}
        onDisableMemory={(id) => memoryMutation.mutate({ id, status: "disabled" })}
      />
    </div>
  );
}

function Working({ label }: { label: string }) {
  return (
    <div className="nr-working" role="status" aria-live="polite">
      <p className="working">
        <span className="working-dots" aria-hidden="true"><i /><i /><i /></span>
        {label}
      </p>
      <div className="ink-lines" aria-hidden="true">
        <span /><span /><span /><span /><span />
      </div>
    </div>
  );
}

function DeskError({ error }: { error: unknown }) {
  if (isOpenAIQuotaError(error)) return <QuotaNotice />;
  return (
    <div className="notice is-error" role="alert">
      <WarningCircle size={20} weight="fill" aria-hidden="true" />
      <div>{toolErrorMessage(error)}</div>
    </div>
  );
}

function StoryPanel({
  story,
  error,
  selectedFormat,
  carouselOptions,
  busy,
  hasItems,
  missing,
  onFormat,
  onCarousel,
  onGenerate,
}: {
  story: NewsFeedItem | null;
  error: unknown;
  selectedFormat: Format;
  carouselOptions: CarouselOptions;
  busy: boolean;
  hasItems: boolean;
  missing: boolean;
  onFormat: (format: Format) => void;
  onCarousel: (next: CarouselOptions) => void;
  onGenerate: () => void;
}) {
  const briefing = selectedFormat === "briefing";
  const canGenerate = !busy && (briefing ? hasItems : Boolean(story));

  return (
    <>
      <div className="nr-scroll">
        {error ? <DeskError error={error} /> : null}

        {story ? (
          <article className={`story is-${newsRecency(story.publishedAt)}`}>
            <div className="story-meta">
              <SourceMarkStack sources={story.sources} size={24} />
              <span className="story-source">
                {story.sources[0]?.name}
                {story.sources.length > 1 ? ` +${story.sources.length - 1}` : ""}
              </span>
              {isBreaking(story) ? <span className="badge badge-live">عاجل</span> : null}
              <time dateTime={story.publishedAt} title={formatStamp(story.publishedAt)}>{formatRelative(story.publishedAt)}</time>
            </div>
            <h2 className="story-title" dir={hasArabic(story.title) ? "rtl" : "ltr"}>{story.title}</h2>
            {story.excerpt ? (
              <p className="story-excerpt" dir={hasArabic(story.excerpt) ? "rtl" : "ltr"}>{story.excerpt}</p>
            ) : (
              <p className="hint">لا يتوفر موجز من المصدر. افتح الرابط الأصلي لقراءة الخبر.</p>
            )}
            {story.sources.length > 0 ? (
              <ul className="story-origins">
                {story.sources.map((source) => {
                  const host = hostFromUrl(source.url);
                  return (
                    <li key={`${source.id}-${source.url}`}>
                      <a href={source.url} target="_blank" rel="noreferrer">
                        <SourceMark id={source.id} name={source.name} url={source.url} size={22} />
                        <span>
                          <strong>اقرأ في {source.name}</strong>
                          {host ? <small dir="ltr">{host}</small> : null}
                        </span>
                        <ArrowSquareOut size={16} aria-hidden="true" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </article>
        ) : (
          <EmptyState icon={<Newspaper size={26} />} title={missing ? "الخبر لم يعد في القائمة" : "اختر خبراً للبدء"}>
            {missing
              ? "قد يكون خرج من نافذة المصادر أو غيّرت التصفية. اختر خبراً آخر، أو ولّد موجز الغرفة."
              : "اختر عنواناً من القائمة لتعرض تفاصيله وتكتبه بالصيغة المناسبة."}
          </EmptyState>
        )}

        <div className="story-formats">
          <h3 className="story-formats-title">اكتب الخبر بصيغة</h3>
          <FormatCards
            selected={selectedFormat}
            busy={busy}
            briefingDisabled={!hasItems}
            carouselOptions={carouselOptions}
            onCarouselOptions={onCarousel}
            onSelect={onFormat}
          />
        </div>

        <Link to="/generate" state={{ prompt: story?.sources[0]?.url ?? "", source: "news", style: "brief" }} className="story-link">
          <LinkSimple size={18} aria-hidden="true" />
          لديك رابط آخر؟ الصقه في صفحة التوليد
        </Link>
      </div>

      <div className="nr-dock">
        <p className="nr-dock-pick">
          <span>الصيغة</span>
          <strong>{storyFormatMeta(selectedFormat).label}</strong>
        </p>
        <button type="button" className="btn btn-primary" disabled={!canGenerate} onClick={onGenerate}>
          {busy ? <span className="spinner" aria-hidden="true" /> : <PencilSimple size={18} aria-hidden="true" />}
          {busy ? "جارٍ الإعداد…" : "ولّد المحتوى"}
        </button>
      </div>
    </>
  );
}
