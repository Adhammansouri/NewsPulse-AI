import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowClockwise,
  ArrowLeft,
  ArrowSquareOut,
  Chats,
  Check,
  CircleNotch,
  Copy,
  LinkSimple,
  FileText,
  ListBullets,
  Compass,
  ShareNetwork,
  VideoCamera,
  Images,
  Stack,
  Newspaper,
  WarningCircle,
} from "@phosphor-icons/react";
import { useNewsFeed } from "@/hooks/useNewsFeed";
import { readDeskHandoff } from "@/services/deskHandoff";
import { getNewsSources, summarizeNews } from "@/services/newsService";
import {
  getEditorialConversation,
  listEditorialConversations,
  listEditorialMemory,
  restoreEditorialVersion,
  reviseEditorialConversation,
  updateEditorialMemory,
} from "@/services/editorialService";
import { QuotaNotice } from "@/components/QuotaNotice";
import { copyText, isOpenAIQuotaError, toolErrorMessage } from "@/services/toolErrors";
import type { CarouselOptions, NewsFeedItem, NewsLanguage, NewsStoryFormat, NewsSummarizeData } from "@newsplus/shared";
import { SourceMark, SourceMarkStack } from "../SourceMark";
import { hostFromUrl } from "../sourceLogos";
import {
  formatRelative,
  formatStamp,
  formatSummaryClipboard,
  hasArabic,
  matchesTimeFilter,
  matchesTopicFilter,
  newsRecency,
  STORY_FORMATS,
  storyFormatMeta,
  TIME_FILTERS,
  timeFilterCounts,
  TOPIC_FILTERS,
  topicFilterCounts,
  type TimeFilter,
  type TopicFilter,
} from "../newsFormat";
import { ConversationDrawer } from "../components/editorial/ConversationDrawer";
import { EditorialDraft } from "../components/editorial/EditorialDraft";
import { RevisionThread } from "../components/editorial/RevisionThread";
import { NewsFilters, type FeedFilters } from "../components/NewsFilters";
import "../newsroom.css";
type LangFilter = "all" | NewsLanguage;
type MobilePane = "feed" | "desk";
type EditorialPane = "draft" | "revision";

const FORMAT_ICONS = { desk: FileText, bulletin: Newspaper, facts: ListBullets, context: Compass, social: ShareNetwork, video: VideoCamera, carousel: Images, briefing: Stack };

export default function NewsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const handoff = readDeskHandoff(location.state);
  const [sourceId, setSourceId] = useState("all");
  const [langFilter, setLangFilter] = useState<LangFilter>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [topicFilter, setTopicFilter] = useState<TopicFilter>("all");
  const [query, setQuery] = useState("");
  const [mobilePane, setMobilePane] = useState<MobilePane>("feed");
  const [editorialPane, setEditorialPane] = useState<EditorialPane>("draft");
  const [selectedId, setSelectedId] = useState<string | null>(
    () => handoff?.itemId ?? searchParams.get("item"),
  );
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<NewsSummarizeData["format"]>("desk");
  const [carouselOptions, setCarouselOptions] = useState<CarouselOptions>({
    slides: 4,
    style: "cinematic",
    density: "banner",
    mark: true,
  });
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [conversationQuery, setConversationQuery] = useState("");
  const [newIds, setNewIds] = useState<string[]>([]);
  const feedScrollRef = useRef<HTMLDivElement>(null);
  const deskPaneRef = useRef<HTMLElement>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const snapshotKeyRef = useRef("all|all|all|all|");

  const sourcesQuery = useQuery({
    queryKey: ["news-sources"],
    queryFn: getNewsSources,
  });

  const feedQuery = useNewsFeed(sourceId, query);

  const summarizeMutation = useMutation({
    mutationFn: summarizeNews,
    onSuccess(data) {
      setEditorialPane("draft");
      if (!data.conversationId) return;
      setConversationId(data.conversationId);
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
    enabled: drawerOpen || Boolean(conversationId),
  });

  const memoryQuery = useQuery({
    queryKey: ["editorial-memory"],
    queryFn: () => listEditorialMemory("approved"),
    enabled: drawerOpen || Boolean(conversationId),
  });

  const reviseMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => reviseEditorialConversation(id, text),
    onSuccess(data) {
      setInstruction("");
      setCopied(false);
      setCopyError(false);
      setEditorialPane("draft");
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
      setCopied(false);
      setEditorialPane("draft");
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

  const sources = sourcesQuery.data?.sources ?? [];
  const arabicSources = sources.filter((source) => source.language === "ar");
  const englishSources = sources.filter((source) => source.language === "en");
  const visibleSources = langFilter === "ar" ? arabicSources : langFilter === "en" ? englishSources : [];

  const scopedItems = useMemo(() => {
    const all = feedQuery.data?.items ?? [];
    if (sourceId !== "all" || langFilter === "all") return all;
    const allowed = new Set(visibleSources.map((source) => source.id));
    return all.filter((item) => item.sources.some((source) => allowed.has(source.id)));
  }, [feedQuery.data?.items, langFilter, sourceId, visibleSources]);

  const timeCounts = useMemo(() => timeFilterCounts(scopedItems), [scopedItems]);
  const timedItems = useMemo(
    () => scopedItems.filter((item) => matchesTimeFilter(item.publishedAt, timeFilter)),
    [scopedItems, timeFilter],
  );
  const topicCounts = useMemo(() => topicFilterCounts(timedItems), [timedItems]);

  const items = useMemo(
    () => timedItems.filter((item) => matchesTopicFilter(item.topic, topicFilter)),
    [timedItems, topicFilter],
  );

  const selected = useMemo(() => {
    const match = items.find((item) => item.id === selectedId);
    if (match) return match;
    if (summarizeMutation.isPending) return null;
    return items[0] ?? null;
  }, [items, selectedId, summarizeMutation.isPending]);

  const summary = conversationDetailQuery.data?.copy ?? summarizeMutation.data;
  const conversationLoading =
    Boolean(conversationId) && conversationDetailQuery.isFetching && !conversationDetailQuery.data?.copy;
  const showEditorial = Boolean(summary) || conversationLoading;
  const busy =
    summarizeMutation.isPending ||
    reviseMutation.isPending ||
    restoreMutation.isPending ||
    memoryMutation.isPending;
  const error =
    sourcesQuery.error ??
    feedQuery.error ??
    summarizeMutation.error ??
    conversationDetailQuery.error ??
    reviseMutation.error ??
    restoreMutation.error ??
    memoryMutation.error;
  const snapshotKey = `${sourceId}|${langFilter}|${timeFilter}|${topicFilter}|${query}`;
  const resultFormat = summary?.format ?? (summarizeMutation.variables?.briefing ? "briefing" : selectedFormat);

  useEffect(() => {
    if (mobilePane === "desk") deskPaneRef.current?.focus({ preventScroll: true });
  }, [mobilePane]);

  useEffect(() => {
    if (!handoff?.input) return;
    navigate("/generate", {
      replace: true,
      state: { prompt: handoff.input, source: "news", style: "brief" },
    });
  }, [handoff?.input, navigate]);

  useEffect(() => {
    if (busy || selectedId || items.length === 0) return;
    setSelectedId(items[0].id);
  }, [busy, items, selectedId]);

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

  function revealNewHeadlines() {
    const first = newIds[0];
    setNewIds([]);
    if (!first) return;
    setMobilePane("feed");
    window.requestAnimationFrame(() => {
      const node = feedScrollRef.current?.querySelector(`[data-headline-id="${CSS.escape(first)}"]`);
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      node?.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  function runSummarize(body: Parameters<typeof summarizeNews>[0]) {
    if (busy) return;
    setCopied(false);
    setCopyError(false);
    summarizeMutation.mutate(body);
  }

  async function onCopy(data: NewsSummarizeData) {
    try {
      await copyText(formatSummaryClipboard(data));
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopied(false);
      setCopyError(true);
    }
  }

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  function selectFormat(format: NewsSummarizeData["format"]) {
    setSelectedFormat(format);
    setCopied(false);
  }

  function storyRequest(format: NewsSummarizeData["format"]) {
    if (format === "briefing") return { briefing: true as const, language: "ar" as const };
    return {
      itemId: conversationDetailQuery.data?.itemId ?? selected?.id,
      language: "ar" as const,
      format,
      ...(format === "carousel" ? { carousel: carouselOptions } : {}),
    };
  }

  function generateSummary() {
    if (!selected && selectedFormat !== "briefing") return;
    setCopied(false);
    runSummarize(storyRequest(selectedFormat));
  }

  function runStoryFormat(format: NewsStoryFormat) {
    if (!conversationDetailQuery.data?.itemId && !selected) return;
    setSelectedFormat(format);
    runSummarize(storyRequest(format));
  }

  function changeFilters(patch: Partial<FeedFilters>) {
    if (patch.query !== undefined) setQuery(patch.query);
    if (patch.language !== undefined) setLangFilter(patch.language);
    if (patch.source !== undefined) setSourceId(patch.source);
    if (patch.time !== undefined) setTimeFilter(patch.time);
    if (patch.topic !== undefined) setTopicFilter(patch.topic);
  }

  function selectHeadline(id: string) {
    if (busy) return;
    setSelectedId(id);
    setNewIds((prev) => prev.filter((itemId) => itemId !== id));
    summarizeMutation.reset();
    reviseMutation.reset();
    restoreMutation.reset();
    memoryMutation.reset();
    setConversationId(null);
    setInstruction("");
    setCopied(false);
    setCopyError(false);
    setEditorialPane("draft");
    setMobilePane("desk");
    setSelectedFormat((current) => (current === "briefing" ? "desk" : current));
  }

  function submitRevision() {
    if (busy || !conversationId || !instruction.trim()) return;
    reviseMutation.mutate({ id: conversationId, text: instruction.trim() });
  }

  useEffect(() => {
    const detail = conversationDetailQuery.data;
    if (!detail) return;
    setSelectedFormat(detail.format);
    if (detail.itemId) setSelectedId(detail.itemId);
    if (detail.copy.carousel) {
      const { slides, style, density, mark } = detail.copy.carousel;
      setCarouselOptions({ slides: slides.length, style, density, mark });
    }
  }, [conversationDetailQuery.data]);

  return (
    <div className={`news-desk newsroom is-${mobilePane}`}>
      <header className="news-desk-head">
        <div className="news-kicker">
          <span className="news-pulse" aria-hidden="true" />
          <Newspaper size={16} weight="regular" aria-hidden="true" />
          <span>غرفة الأخبار</span>
        </div>
        <div className="news-desk-head-row">
          <div>
            <h1 className="news-title">غرفة الأخبار</h1>
            <p className="news-lede">تابع المصادر، وصُغ الخبر، وراجعه مع المحرّر.</p>
          </div>
          <div className="news-live">
            <button type="button" className="news-btn-secondary newsroom-history" onClick={() => setDrawerOpen(true)} aria-haspopup="dialog">
              <Chats size={18} aria-hidden="true" /><span>المحادثات</span>
            </button>
            <p className="news-count" aria-live="polite">
              {feedQuery.isFetching && !feedQuery.isLoading ? (
                <CircleNotch className="news-spin" size={14} aria-hidden="true" />
              ) : null}
              {feedQuery.isLoading ? "جاري التحميل" : `${items.length} عنوان`}
            </p>
            {feedQuery.dataUpdatedAt ? (
              <p className="news-updated" title={feedQuery.data?.fetchedAt ? formatStamp(feedQuery.data.fetchedAt) : undefined}>
                {feedQuery.data?.fetchedAt
                  ? formatRelative(feedQuery.data.fetchedAt)
                  : "—"}
              </p>
            ) : null}
            <button
              type="button"
              className="news-refresh"
              disabled={feedQuery.isFetching}
              aria-label="حدّث الآن"
              onClick={() => void feedQuery.refetch()}
            >
              <ArrowClockwise className={feedQuery.isFetching ? "news-spin" : undefined} size={15} aria-hidden="true" />
              <span className="news-refresh-label">تحديث</span>
            </button>
            {newIds.length > 0 ? (
              <button type="button" className="news-new-badge" onClick={revealNewHeadlines}>
                {newIds.length} جديدة
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <NewsFilters
        filters={{ query, language: langFilter, source: sourceId, time: timeFilter, topic: topicFilter }}
        sources={sources}
        timeCounts={timeCounts}
        topicCounts={topicCounts}
        onChange={changeFilters}
      />

      <div className="newsroom-pane-tabs" role="group" aria-label="أقسام الغرفة">
        <button type="button" aria-pressed={mobilePane === "feed"} aria-controls="news-feed-pane" className={mobilePane === "feed" ? "is-active" : ""} onClick={() => setMobilePane("feed")}>
          <Newspaper size={18} aria-hidden="true" />العناوين <span className="newsroom-tab-count">{items.length}</span>
        </button>
        <button type="button" aria-pressed={mobilePane === "desk"} aria-controls="news-desk-pane" className={mobilePane === "desk" ? "is-active" : ""} onClick={() => setMobilePane("desk")}>
          <FileText size={18} aria-hidden="true" />التحرير {showEditorial && <span className="newsroom-tab-dot" aria-label="توجد مسودة" />}
        </button>
      </div>

      <div className={`news-panes ${showEditorial ? "is-editorial" : ""}`}>
        <section id="news-feed-pane" className={`news-pane newsroom-feed-pane ${mobilePane === "feed" ? "" : "is-mobile-hidden"}`} aria-label="العناوين">
          <div className="news-pane-bar">
            <p className="news-pane-label"><Newspaper size={17} aria-hidden="true" />العناوين</p>
            <p className="news-pane-meta">
              {items.length}
              {timeFilter !== "all"
                ? ` · ${TIME_FILTERS.find((option) => option.id === timeFilter)?.label}`
                : ""}
              {topicFilter !== "all"
                ? ` · ${TOPIC_FILTERS.find((option) => option.id === topicFilter)?.label}`
                : ""}
            </p>
          </div>
          <div className="news-pane-scroll" ref={feedScrollRef} tabIndex={-1} aria-label="قائمة العناوين">
            {feedQuery.error || sourcesQuery.error ? <DeskError error={feedQuery.error ?? sourcesQuery.error} /> : null}
            {feedQuery.isLoading && (
              <p className="news-state">
                <CircleNotch className="news-spin" size={18} aria-hidden="true" />
                جاري جلب العناوين...
              </p>
            )}
            {!feedQuery.isLoading && !feedQuery.error && !sourcesQuery.error && items.length === 0 && (
              <div className="news-state news-state--empty">
                <p>لا توجد عناوين في هذه النافذة. غيّر الوقت أو الموضوع أو المصدر أو كلمة البحث.</p>
                {timeFilter !== "all" ? (
                  <button type="button" className="news-chip" onClick={() => setTimeFilter("all")}>
                    عرض كل الأوقات
                  </button>
                ) : null}
                {topicFilter !== "all" ? (
                  <button type="button" className="news-chip" onClick={() => setTopicFilter("all")}>
                    عرض كل المواضيع
                  </button>
                ) : null}
              </div>
            )}
            {items.map((item) => (
              <HeadlineRow
                key={item.id}
                item={item}
                active={selected?.id === item.id}
                disabled={busy}
                justArrived={newIds.includes(item.id)}
                onSelect={() => selectHeadline(item.id)}
              />
            ))}
          </div>
        </section>

        <section
          id="news-desk-pane"
          ref={deskPaneRef}
          tabIndex={-1}
          className={`news-pane news-desk-pane newsroom-desk-pane ${showEditorial ? "is-editorial" : ""} ${mobilePane === "desk" ? "" : "is-mobile-hidden"}`}
          aria-label="التحرير"
        >
          <div className="news-pane-bar news-desk-bar">
            <div className="newsroom-desk-heading">
              <button type="button" className="newsroom-back" aria-label="العودة إلى العناوين" onClick={() => setMobilePane("feed")}><ArrowLeft size={18} aria-hidden="true" /></button>
              <p className="news-pane-label"><FileText size={17} aria-hidden="true" />{showEditorial ? "المسودة والمحرّر" : "الخبر وأدوات الكتابة"}</p>
            </div>
            <div className="news-desk-bar-tools">
              {busy ? (
                <p className="news-desk-busy" aria-live="polite">
                  <CircleNotch className="news-spin" size={14} aria-hidden="true" />
                  جاري الكتابة...
                </p>
              ) : null}
              {!busy && <span className="news-pane-meta">{showEditorial ? storyFormatMeta(resultFormat).label : "معاينة المصدر"}</span>}
            </div>
          </div>

          {showEditorial && conversationId && (
            <div className="newsroom-editor-tabs" role="group" aria-label="أدوات التحرير">
              <button type="button" className={editorialPane === "draft" ? "is-active" : ""} aria-pressed={editorialPane === "draft"} aria-controls="news-editorial-draft" onClick={() => setEditorialPane("draft")}><FileText size={16} aria-hidden="true" />المسودة</button>
              <button type="button" className={editorialPane === "revision" ? "is-active" : ""} aria-pressed={editorialPane === "revision"} aria-controls="news-editorial-revision" onClick={() => setEditorialPane("revision")}><Chats size={16} aria-hidden="true" />تعديل النص <span className="newsroom-tab-note">والنسخ السابقة</span></button>
            </div>
          )}

          <div className="news-desk-main">
            <div className="news-pane-scroll news-desk-body">
              {showEditorial ? (
                conversationLoading && !summary ? (
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
                            carouselOptions={carouselOptions}
                            onCarouselOptions={setCarouselOptions}
                            onApplyCarousel={() => runStoryFormat("carousel")}
                            onSelectFormat={(next) => {
                              summarizeMutation.reset();
                              setConversationId(null);
                              if (next === "briefing") runSummarize({ briefing: true, language: "ar" });
                              else runStoryFormat(next);
                            }}
                          />
                          <div className="news-editorial-actions">
                            <button
                              type="button"
                              className="news-editorial-action"
                              onClick={() => void onCopy(summary)}
                              disabled={busy}
                              aria-label={copied ? "تم النسخ" : "نسخ المسودة"}
                              title={copied ? "تم النسخ" : "نسخ"}
                            >
                              {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
                              <span>{copied ? "تم النسخ" : "نسخ"}</span>
                            </button>
                            <button
                              type="button"
                              className="news-editorial-action"
                              onClick={() => {
                                summarizeMutation.reset();
                                setConversationId(null);
                                setCopied(false);
                                setInstruction("");
                              }}
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
                            copied={copied}
                            hideCopy
                            onCopy={() => void onCopy(summary)}
                          />
                          {error ? <DeskError error={error} /> : null}
                        </div>
                      </div>
                      {conversationId ? (
                        <RevisionThread
                          id="news-editorial-revision"
                          messages={conversationDetailQuery.data?.messages ?? []}
                          versions={conversationDetailQuery.data?.versions ?? []}
                          currentVersionId={conversationDetailQuery.data?.currentVersionId ?? summary.versionId ?? ""}
                          pendingMemory={conversationDetailQuery.data?.pendingMemory ?? []}
                          instruction={instruction}
                          busy={busy}
                          format={resultFormat}
                          onInstructionChange={setInstruction}
                          onSubmit={submitRevision}
                          onQuickAction={(value) => {
                            setInstruction(value);
                            if (conversationId) reviseMutation.mutate({ id: conversationId, text: value });
                          }}
                          onRestore={(versionId) => restoreMutation.mutate({ id: conversationId, versionId })}
                          onMemorySave={(id) => memoryMutation.mutate({ id, status: "approved" })}
                          onMemoryEdit={(id, next) => memoryMutation.mutate({ id, status: "approved", instruction: next })}
                          onMemoryDismiss={(id) => memoryMutation.mutate({ id, status: "rejected" })}
                        />
                      ) : null}
                    </div>
                  </div>
                ) : null
              ) : (
                <>
                  {error ? <DeskError error={error} /> : null}

                  {selected ? (
                    <article
                      className={[
                        "news-story-card",
                        `is-${newsRecency(selected.publishedAt)}`,
                      ].join(" ")}
                    >
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
                          selected={selectedFormat}
                          busy={busy}
                          briefingDisabled={busy || items.length === 0}
                          showHint
                          carouselOptions={carouselOptions}
                          onCarouselOptions={setCarouselOptions}
                          onSelectFormat={selectFormat}
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

            {copyError && <p className="newsroom-copy-error" role="alert">تعذّر النسخ. يمكنك تحديد النص ونسخه يدوياً.</p>}
            {!showEditorial && selected && (
              <div className="newsroom-generate-dock">
                <p><span>الصيغة المختارة</span><strong>{storyFormatMeta(selectedFormat).label}</strong></p>
                <button type="button" className="news-btn-primary" disabled={busy || (selectedFormat === "briefing" && items.length === 0)} onClick={generateSummary}>
                  {busy ? <CircleNotch className="news-spin" size={18} aria-hidden="true" /> : <FileText size={18} aria-hidden="true" />}
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
        onSearch={(value) => setConversationQuery(value)}
        onClose={() => {
          setDrawerOpen(false);
          setConversationQuery("");
        }}
        onSelect={(id) => {
          if (busy) return;
          setConversationId(id);
          summarizeMutation.reset();
          reviseMutation.reset();
          restoreMutation.reset();
          memoryMutation.reset();
          setCopied(false);
          setCopyError(false);
          setEditorialPane("draft");
          setInstruction("");
          setDrawerOpen(false);
          setMobilePane("desk");
        }}
        onDisableMemory={(id) => memoryMutation.mutate({ id, status: "disabled" })}
      />
      <p className="sr-only" role="status">{copied ? "تم نسخ المسودة" : ""}</p>
    </div>
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
  const choices = [
    ...STORY_FORMATS,
    { id: "briefing" as const, label: "موجز", hint: "أعلى 8 عناوين في الغرفة" },
  ];

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
                {busy && active ? <CircleNotch className="news-spin" size={18} aria-hidden="true" /> : <Icon size={18} aria-hidden="true" />}
                <span className="newsroom-format-copy"><span>{option.label}</span>{isPicker && <span className="newsroom-format-hint">{option.hint}</span>}</span>
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
            <CarouselControls options={carouselOptions} busy={busy} showApply onChange={onCarouselOptions} onApply={onApplyCarousel} />
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
          {([{ id: "headline", label: "عنوان" }, { id: "banner", label: "عنوان وشريط" }, { id: "line", label: "سطر توضيحي" }] as const).map((option) => <StyleButton key={option.id} active={options.density === option.id} disabled={busy} onClick={() => onChange({ ...options, density: option.id })}>{option.label}</StyleButton>)}
        </div>
      </div>
      <label className="newsroom-carousel-mark"><input type="checkbox" checked={options.mark} disabled={busy} onChange={(event) => onChange({ ...options, mark: event.target.checked })} />إظهار علامة Newsplus</label>
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
    <button type="button" className={`news-seg-btn ${active ? "is-active" : ""}`} aria-pressed={active} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

function RecencyMarks({ justArrived = false }: { justArrived?: boolean }) {
  if (!justArrived) return null;

  return (
    <span className="news-feed-badges">
      <span className="news-arrived">ظهر الآن</span>
    </span>
  );
}

function HeadlineRow({
  item,
  active,
  justArrived,
  disabled,
  onSelect,
}: {
  item: NewsFeedItem;
  active: boolean;
  justArrived: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const recency = newsRecency(item.publishedAt);
  const primarySource = item.sources[0];

  return (
    <button
      type="button"
      id={`news-headline-${item.id}`}
      data-headline-id={item.id}
      disabled={disabled}
      aria-pressed={active}
      className={[
        "news-feed-item",
        `is-${recency}`,
        active ? "is-active" : "",
        justArrived ? "is-arrived" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onSelect}
    >
      <div className="news-feed-row">
        <div className="news-feed-source">
          <SourceMarkStack sources={item.sources} size={24} />
          {primarySource ? (
            <bdi className="news-source-name">{primarySource.name}</bdi>
          ) : null}
          {item.sources.length > 1 ? (
            <span className="news-cluster">+{item.sources.length - 1}</span>
          ) : null}
        </div>
        <div className="news-feed-meta">
          <RecencyMarks justArrived={justArrived} />
          <time
            className={`news-time is-${recency}`}
            dateTime={item.publishedAt}
            title={formatStamp(item.publishedAt)}
          >
            {formatRelative(item.publishedAt)}
          </time>
        </div>
      </div>

      <p className="news-feed-title" dir={hasArabic(item.title) ? "rtl" : "ltr"} lang={hasArabic(item.title) ? "ar" : "en"}>
        {item.title}
      </p>
      <div className="newsroom-feed-bottom">
        <span className="newsroom-feed-tags">{item.breaking && <span className="newsroom-breaking">عاجل</span>}<span>{TOPIC_FILTERS.find((topic) => topic.id === item.topic)?.label ?? "أخرى"}</span></span>
        <span className="newsroom-read-label">عرض الخبر <ArrowLeft size={14} aria-hidden="true" /></span>
      </div>
    </button>
  );
}
