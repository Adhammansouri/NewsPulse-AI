// Editorial state of the newsroom studio (story → format → draft → revisions). Moved out of NewsPage unchanged
// in behaviour, except S04 §8: generation no longer locks the wire. Opening another story mid-generation
// abandons the run on screen; it still completes and lands in the archive, and the editor is told so.
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CarouselOptions, NewsFeedItem, NewsStoryFormat, NewsSummarizeData, NewsSummarizeRequest } from "@newsplus/shared";
import {
  getEditorialConversation,
  listEditorialConversations,
  listEditorialMemory,
  restoreEditorialVersion,
  reviseEditorialConversation,
  updateEditorialMemory,
} from "@/services/editorialService";
import { summarizeNews } from "@/services/newsService";
import { copyText } from "@/services/toolErrors";
import { useToast } from "@/ui/Toast";
import { formatSummaryClipboard } from "../newsFormat";
import { readBriefingPins, unpinBriefingItems } from "../wire/briefingPins";
import { COPY } from "../wire/copy";

export type EditorialPane = "draft" | "revision";
type Format = NewsSummarizeData["format"];
type SummarizeRun = { run: number; body: NewsSummarizeRequest };

export function useEditorialDesk({
  selected,
  onOpenItem,
  onShowDesk,
}: {
  /** The story open in the studio (null = none / briefing). */
  selected: NewsFeedItem | null;
  /** An archived conversation was opened: show its story in the wire. */
  onOpenItem: (itemId: string) => void;
  /** Mobile: switch to the story screen. */
  onShowDesk: () => void;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [editorialPane, setEditorialPane] = useState<EditorialPane>("draft");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<Format>("desk");
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

  /** The summarize run whose result belongs on screen; older runs finish in the background. */
  const runSeqRef = useRef(0);
  const activeRunRef = useRef<number | null>(null);
  const onOpenItemRef = useRef(onOpenItem);
  useEffect(() => {
    onOpenItemRef.current = onOpenItem;
  });

  const summarizeMutation = useMutation({
    mutationFn: ({ body }: SummarizeRun) => summarizeNews(body),
    // Mutation-level callbacks: they still run for a run abandoned by `reset()`.
    onSuccess(data, { run, body }) {
      if (body.briefing && body.itemIds?.length) unpinBriefingItems(body.itemIds);
      void queryClient.invalidateQueries({ queryKey: ["editorial-conversations"] });
      if (run !== activeRunRef.current) {
        if (data.conversationId) toast.show(COPY.previousDraftReady);
        return;
      }
      setEditorialPane("draft");
      if (!data.conversationId) return;
      setConversationId(data.conversationId);
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
    mutationFn: ({
      id,
      status,
      instruction: next,
    }: {
      id: string;
      status?: "approved" | "rejected" | "disabled";
      instruction?: string;
    }) => updateEditorialMemory(id, { status, instruction: next }),
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ["editorial-conversation", conversationId] });
      void queryClient.invalidateQueries({ queryKey: ["editorial-memory"] });
    },
  });

  const detail = conversationDetailQuery.data;
  const summary = detail?.copy ?? summarizeMutation.data;
  const conversationLoading = Boolean(conversationId) && conversationDetailQuery.isFetching && !detail?.copy;
  const showEditorial = Boolean(summary) || conversationLoading;
  const busy =
    summarizeMutation.isPending || reviseMutation.isPending || restoreMutation.isPending || memoryMutation.isPending;
  // The wire shows its own feed / sources errors (Main-error); the studio shows the editorial ones.
  const error =
    summarizeMutation.error ??
    conversationDetailQuery.error ??
    reviseMutation.error ??
    restoreMutation.error ??
    memoryMutation.error;
  const resultFormat: Format =
    summary?.format ?? (summarizeMutation.variables?.body.briefing ? "briefing" : selectedFormat);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    if (!detail) return;
    setSelectedFormat(detail.format);
    if (detail.itemId) onOpenItemRef.current(detail.itemId);
    if (detail.copy.carousel) {
      const { slides, style, density, mark } = detail.copy.carousel;
      setCarouselOptions({ slides: slides.length, style, density, mark });
    }
  }, [detail]);

  function storyRequest(format: Format, item: NewsFeedItem | null = selected): NewsSummarizeRequest {
    if (format === "briefing") {
      const itemIds = readBriefingPins();
      return { briefing: true, language: "ar", ...(itemIds.length > 0 ? { itemIds } : {}) };
    }
    return {
      itemId: detail?.itemId ?? item?.id,
      language: "ar",
      format,
      ...(format === "carousel" ? { carousel: carouselOptions } : {}),
    };
  }

  function start(body: NewsSummarizeRequest) {
    setCopied(false);
    setCopyError(false);
    const run = ++runSeqRef.current;
    activeRunRef.current = run;
    summarizeMutation.mutate({ run, body });
  }

  function runSummarize(body: NewsSummarizeRequest) {
    if (busy) return;
    start(body);
  }

  /** Leaves the run on screen to finish in the background (S04 §8) and clears the studio. */
  function resetStory() {
    activeRunRef.current = null;
    summarizeMutation.reset();
    reviseMutation.reset();
    restoreMutation.reset();
    memoryMutation.reset();
    setConversationId(null);
    setInstruction("");
    setCopied(false);
    setCopyError(false);
    setEditorialPane("draft");
  }

  /** A story picked in the wire (never blocked by a running generation). */
  function openStory() {
    resetStory();
    setSelectedFormat((current) => (current === "briefing" ? "desk" : current));
  }

  /** «موجز الساعة»: the briefing of the top headlines, pinned stories first. */
  function startBriefing() {
    resetStory();
    setSelectedFormat("briefing");
    start(storyRequest("briefing"));
  }

  /** Swipe «اكتب منشور»: the story with «منشور سوشيال» selected, generating at once. */
  function startSocial(item: NewsFeedItem) {
    resetStory();
    setSelectedFormat("social");
    start({ itemId: item.id, language: "ar", format: "social" });
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

  function selectFormat(format: Format) {
    setSelectedFormat(format);
    setCopied(false);
  }

  function generateSummary() {
    if (!selected && selectedFormat !== "briefing") return;
    setCopied(false);
    runSummarize(storyRequest(selectedFormat));
  }

  function runStoryFormat(format: NewsStoryFormat) {
    if (!detail?.itemId && !selected) return;
    setSelectedFormat(format);
    runSummarize(storyRequest(format));
  }

  /** Format switch on a finished draft (the old desk's «switch» bar). */
  function switchFormat(next: Format) {
    activeRunRef.current = null;
    summarizeMutation.reset();
    setConversationId(null);
    if (next === "briefing") runSummarize(storyRequest("briefing"));
    else runStoryFormat(next);
  }

  /** «خبر آخر»: back to the story and its formats. */
  function closeDraft() {
    activeRunRef.current = null;
    summarizeMutation.reset();
    setConversationId(null);
    setCopied(false);
    setInstruction("");
  }

  function submitRevision() {
    if (busy || !conversationId || !instruction.trim()) return;
    reviseMutation.mutate({ id: conversationId, text: instruction.trim() });
  }

  function quickRevision(value: string) {
    setInstruction(value);
    if (conversationId) reviseMutation.mutate({ id: conversationId, text: value });
  }

  function openConversation(id: string) {
    if (busy) return;
    resetStory();
    setConversationId(id);
    setDrawerOpen(false);
    onShowDesk();
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setConversationQuery("");
  }

  return {
    // state
    summary,
    detail,
    conversationId,
    conversationLoading,
    showEditorial,
    busy,
    error,
    resultFormat,
    selectedFormat,
    carouselOptions,
    editorialPane,
    instruction,
    copied,
    copyError,
    drawerOpen,
    conversationQuery,
    conversations: conversationListQuery.data?.items ?? [],
    conversationsLoading: conversationListQuery.isFetching,
    memory: memoryQuery.data?.rules ?? [],
    drawerError: conversationListQuery.error ?? memoryQuery.error ?? memoryMutation.error,
    // actions
    setCarouselOptions,
    setEditorialPane,
    setInstruction,
    setDrawerOpen,
    setConversationQuery,
    selectFormat,
    generateSummary,
    runStoryFormat,
    switchFormat,
    closeDraft,
    onCopy,
    submitRevision,
    quickRevision,
    restore: (versionId: string) => conversationId && restoreMutation.mutate({ id: conversationId, versionId }),
    saveMemory: (id: string, next?: string) =>
      memoryMutation.mutate(next === undefined ? { id, status: "approved" } : { id, status: "approved", instruction: next }),
    dismissMemory: (id: string) => memoryMutation.mutate({ id, status: "rejected" }),
    disableMemory: (id: string) => memoryMutation.mutate({ id, status: "disabled" }),
    openConversation,
    closeDrawer,
    openStory,
    startBriefing,
    startSocial,
  };
}

export type EditorialDesk = ReturnType<typeof useEditorialDesk>;
