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
  MagnifyingGlass,
  FileText,
  Newspaper,
  WarningCircle,
  X,
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
import type { CarouselOptions, NewsFeedItem, NewsLanguage, NewsSource, NewsStoryFormat, NewsSummarizeData } from "@newsplus/shared";
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
type LangFilter = "all" | NewsLanguage;
type MobilePane = "feed" | "desk";

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
  const [selectedId, setSelectedId] = useState<string | null>(
    () => handoff?.itemId ?? searchParams.get("item"),
  );
  const [copied, setCopied] = useState(false);
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
      queryClient.setQueryData(["editorial-conversation", data.conversation.id], data.conversation);
      void queryClient.invalidateQueries({ queryKey: ["editorial-conversations"] });
      void queryClient.invalidateQueries({ queryKey: ["editorial-memory"] });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: ({ id, versionId }: { id: string; versionId: string }) => restoreEditorialVersion(id, versionId),
    onSuccess(data) {
      setCopied(false);
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
    const node = feedScrollRef.current?.querySelector(`[data-headline-id="${CSS.escape(first)}"]`);
    node?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function runSummarize(body: Parameters<typeof summarizeNews>[0]) {
    setCopied(false);
    summarizeMutation.mutate(body);
  }

  async function onCopy(data: NewsSummarizeData) {
    try {
      await copyText(formatSummaryClipboard(data));
      setCopied(true);
    } catch {
      setCopied(false);
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
      itemId: selected?.id,
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
    if (!selected) return;
    setSelectedFormat(format);
    runSummarize(storyRequest(format));
  }

  function selectLanguage(next: LangFilter) {
    setLangFilter(next);
    setSourceId("all");
  }

  function selectSource(id: string, language: NewsLanguage) {
    setSourceId(id);
    setLangFilter(language);
  }

  function selectHeadline(id: string) {
    setSelectedId(id);
    setNewIds((prev) => prev.filter((itemId) => itemId !== id));
    summarizeMutation.reset();
    setConversationId(null);
    setInstruction("");
    setMobilePane("desk");
    setSelectedFormat((current) => (current === "briefing" ? "desk" : current));
  }

  function submitRevision() {
    if (!conversationId || !instruction.trim()) return;
    reviseMutation.mutate({ id: conversationId, text: instruction.trim() });
  }

  useEffect(() => {
    const detail = conversationDetailQuery.data;
    if (!detail) return;
    setSelectedFormat(detail.format);
    if (detail.itemId) setSelectedId(detail.itemId);
  }, [conversationDetailQuery.data]);

  return (
    <div className="news-desk">
      <header className="news-desk-head">
        <div className="news-kicker">
          <span className="news-pulse" aria-hidden="true" />
          <Newspaper size={16} weight="regular" aria-hidden="true" />
          <span>غرفة الأخبار</span>
        </div>
        <div className="news-desk-head-row">
          <div>
            <h1 className="news-title">ملخص الأخبار</h1>
            <p className="news-lede">اختر خبراً أو موضوعاً، واطلب ملخصاً تحريرياً جاهزاً للنشر.</p>
          </div>
          <div className="news-live">
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

      <div className="news-toolbar">
        <div className="news-filter-bar">
          <div className="news-seg news-seg--lang" role="group" aria-label="تصفية اللغة">
            {(
              [
                { id: "all", label: "الكل" },
                { id: "ar", label: "عربي" },
                { id: "en", label: "English" },
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                className={`news-seg-btn ${langFilter === option.id ? "is-active" : ""}`}
                aria-pressed={langFilter === option.id}
                onClick={() => selectLanguage(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <label className="news-search" htmlFor="news-query">
            <MagnifyingGlass size={16} weight="regular" aria-hidden="true" />
            <span className="sr-only">بحث في العناوين</span>
            <input
              id="news-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث في العناوين..."
            />
            {query ? (
              <button type="button" className="news-icon-btn" aria-label="مسح البحث" onClick={() => setQuery("")}>
                <X size={14} weight="bold" />
              </button>
            ) : null}
          </label>
        </div>

        <div className="news-seg news-seg--time" role="group" aria-label="تصفية الوقت">
          {TIME_FILTERS.map((option) => {
            const count = timeCounts[option.id];
            const empty = option.id !== "all" && count === 0;
            return (
              <button
                key={option.id}
                type="button"
                className={`news-seg-btn ${timeFilter === option.id ? "is-active" : ""} ${empty ? "is-empty" : ""}`}
                aria-pressed={timeFilter === option.id}
                aria-label={`${option.hint}، ${count} عنوان`}
                title={option.hint}
                onClick={() => setTimeFilter(option.id)}
              >
                {option.label}
                <span className="news-seg-count">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="news-topic-rail" role="listbox" aria-label="تصفية الموضوع">
          {TOPIC_FILTERS.map((option) => {
            const count = topicCounts[option.id];
            const empty = option.id !== "all" && count === 0;
            return (
              <button
                key={option.id}
                type="button"
                className={`news-chip ${topicFilter === option.id ? "is-active" : ""} ${empty ? "is-empty" : ""}`}
                aria-pressed={topicFilter === option.id}
                aria-label={`${option.label}، ${count} عنوان`}
                disabled={empty}
                onClick={() => setTopicFilter(option.id)}
              >
                {option.label}
                <span className="news-seg-count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {visibleSources.length > 0 && (
        <div className="news-source-rail max-md:hidden" role="listbox" aria-label="المصادر">
          <button
            type="button"
            className={`news-chip ${sourceId === "all" ? "is-active" : ""}`}
            aria-pressed={sourceId === "all"}
            onClick={() => setSourceId("all")}
          >
            كل المصادر
          </button>
          {visibleSources.map((source) => (
            <SourceChip
              key={source.id}
              source={source}
              active={sourceId === source.id}
              onSelect={() => selectSource(source.id, source.language)}
            />
          ))}
        </div>
      )}

      <div className="news-pane-tabs md:hidden" role="tablist" aria-label="أقسام الغرفة">
        <button
          type="button"
          role="tab"
          aria-selected={mobilePane === "feed"}
          className={mobilePane === "feed" ? "is-active" : ""}
          onClick={() => setMobilePane("feed")}
        >
          <Newspaper size={16} aria-hidden="true" />
          العناوين
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobilePane === "desk"}
          className={mobilePane === "desk" ? "is-active" : ""}
          onClick={() => setMobilePane("desk")}
        >
          <FileText size={16} aria-hidden="true" />
          الملخص
        </button>
      </div>

      <div className={`news-panes ${showEditorial ? "is-editorial" : ""}`}>
        <section className={`news-pane ${mobilePane === "feed" ? "" : "max-md:hidden"}`} aria-label="العناوين">
          <div className="news-pane-bar">
            <p className="news-pane-label">العناوين</p>
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
          <div className="news-pane-scroll" ref={feedScrollRef}>
            {feedQuery.isLoading && (
              <p className="news-state">
                <CircleNotch className="news-spin" size={18} aria-hidden="true" />
                جاري جلب العناوين...
              </p>
            )}
            {!feedQuery.isLoading && items.length === 0 && (
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
                justArrived={newIds.includes(item.id)}
                onSelect={() => selectHeadline(item.id)}
              />
            ))}
          </div>
        </section>

        <section
          className={`news-pane news-desk-pane ${showEditorial ? "is-editorial" : ""} ${mobilePane === "desk" ? "" : "max-md:hidden"}`}
          aria-label="الملخص"
        >
          <div className="news-pane-bar news-desk-bar">
            <p className="news-pane-label">{showEditorial ? "غرفة التحرير" : "الملخص"}</p>
            <div className="news-desk-bar-tools">
              {busy ? (
                <p className="news-desk-busy" aria-live="polite">
                  <CircleNotch className="news-spin" size={14} aria-hidden="true" />
                  جاري الكتابة...
                </p>
              ) : null}
              <button
                type="button"
                className="news-btn-secondary news-conversations-btn"
                onClick={() => setDrawerOpen(true)}
              >
                <Chats size={15} aria-hidden="true" />
                المحادثات
              </button>
            </div>
          </div>

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
                    <div className="news-editorial-stage">
                      <div className="news-editorial-main">
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
                            <SourceMarkStack sources={selected.sources} size={18} />
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
                            <p className="news-story-kicker">عن الخبر</p>
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
                                    <SourceMark id={source.id} name={source.name} url={source.url} size={16} />
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
                          onGenerate={generateSummary}
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
        open={drawerOpen}
        search={conversationQuery}
        conversations={conversationListQuery.data?.items ?? []}
        memory={memoryQuery.data?.rules ?? []}
        activeId={conversationId}
        listLoading={conversationListQuery.isFetching}
        onSearch={(value) => setConversationQuery(value)}
        onClose={() => {
          setDrawerOpen(false);
          setConversationQuery("");
        }}
        onSelect={(id) => {
          setConversationId(id);
          summarizeMutation.reset();
          setCopied(false);
          setInstruction("");
          setDrawerOpen(false);
          setMobilePane("desk");
        }}
        onDisableMemory={(id) => memoryMutation.mutate({ id, status: "disabled" })}
      />
    </div>
  );
}

function DeskError({ error }: { error: unknown }) {
  if (isOpenAIQuotaError(error)) return <QuotaNotice />;
  return (
    <p className="news-state is-error">
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
  onGenerate,
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
  onGenerate?: () => void;
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
          <span>شكل التلخيص</span>
          <span>{meta.hint}</span>
        </p>
      ) : (
        <span className="sr-only" id={hintId}>
          {meta.hint}
        </span>
      )}

      <div className="news-format-toolbar">
        <div className="news-seg news-seg--formats" role="group" aria-label="شكل التلخيص" aria-describedby={hintId}>
          {choices.map((option) => {
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
                {busy && active ? <CircleNotch className="news-spin" size={12} aria-hidden="true" /> : null}
                {option.label}
              </button>
            );
          })}
        </div>

        {isPicker && onGenerate ? (
          <button
            type="button"
            className="news-btn-primary news-format-generate"
            disabled={busy || (selected === "briefing" && briefingDisabled)}
            onClick={onGenerate}
          >
            {busy ? <CircleNotch className="news-spin" size={16} aria-hidden="true" /> : null}
            {busy ? "جاري التوليد..." : "توليد"}
          </button>
        ) : null}
      </div>
      {selected === "carousel" && carouselOptions && onCarouselOptions ? (
        <CarouselControls
          options={carouselOptions}
          busy={busy}
          showApply={mode === "switch"}
          onChange={onCarouselOptions}
          onApply={onApplyCarousel}
        />
      ) : null}
    </div>
  );
}

function CarouselControls({
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

function SourceChip({
  source,
  active,
  onSelect,
}: {
  source: NewsSource;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`news-chip ${active ? "is-active" : ""}`}
      aria-pressed={active}
      onClick={onSelect}
    >
      <SourceMark id={source.id} name={source.name} size={16} />
      {source.name}
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
  onSelect,
}: {
  item: NewsFeedItem;
  active: boolean;
  justArrived: boolean;
  onSelect: () => void;
}) {
  const recency = newsRecency(item.publishedAt);
  const primarySource = item.sources[0];

  return (
    <button
      type="button"
      id={`news-headline-${item.id}`}
      data-headline-id={item.id}
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
          <SourceMarkStack sources={item.sources} size={16} />
          {primarySource ? (
            <span className="news-source-name">{primarySource.name}</span>
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

      <p className="news-feed-title" dir={hasArabic(item.title) ? "rtl" : "ltr"}>
        {item.title}
      </p>
    </button>
  );
}
