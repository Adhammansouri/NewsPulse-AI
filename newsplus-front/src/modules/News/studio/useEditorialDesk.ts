// Editorial state of the newsroom studio (story → format → generating → draft → revisions).
// S04 §8: generation never locks the wire; opening another story mid-generation abandons the run on screen,
// it still completes and lands in the archive. S05: the run lives in the app-lifetime draft-run store
// (draftRuns.ts) — «إلغاء» aborts it, leaving the screen keeps it going, and the format / carousel options the
// editor picked are remembered (formatPrefs.ts).
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type { CarouselOptions, NewsFeedItem, NewsStoryFormat, NewsSummarizeData, NewsSummarizeRequest } from "@newsplus/shared";
import {
  getEditorialConversation,
  listEditorialConversations,
  listEditorialMemory,
  restoreEditorialVersion,
  reviseEditorialConversation,
  updateEditorialMemory,
} from "@/services/editorialService";
import { copyText } from "@/services/toolErrors";
import { useToast } from "@/ui/Toast";
import { formatSummaryClipboard } from "../newsFormat";
import { readBriefingPins } from "../wire/briefingPins";
import {
  abandonDraftRun,
  cancelDraftRun,
  draftRunInfo,
  readDraftRun,
  startDraftRun,
  useDraftRunState,
  watchDraftRun,
} from "./draftRuns";
import { readCarouselOptions, readLastFormat, writeCarouselOptions, writeLastFormat } from "./formatPrefs";
import { studioLink } from "./studioLink";

export type EditorialPane = "draft" | "revision";
type Format = NewsSummarizeData["format"];
/** The run this studio shows while it is generating. */
type ActiveRun = { id: number; body: NewsSummarizeRequest };

function requestFormat(body: NewsSummarizeRequest): Format {
  return body.briefing ? "briefing" : (body.format ?? "desk");
}

export function useEditorialDesk({
  selected,
  onOpenItem,
  onShowDesk,
}: {
  /** The story open in the studio (null = none / briefing). */
  selected: NewsFeedItem | null;
  /** An archived conversation was opened: show its story. */
  onOpenItem: (itemId: string, conversationId: string) => void;
  /** Mobile: switch to the screen that shows the draft. */
  onShowDesk: () => void;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const [editorialPane, setEditorialPane] = useState<EditorialPane>("draft");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<Format>(readLastFormat);
  const [carouselOptions, setCarouselOptionsState] = useState<CarouselOptions>(readCarouselOptions);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [conversationQuery, setConversationQuery] = useState("");

  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null);
  /** The finished run's draft, kept here once the run is done (the cache collects it later). */
  const [runResult, setRunResult] = useState<NewsSummarizeData | null>(null);
  const [runError, setRunError] = useState<Error | null>(null);
  /** «أعد المحاولة» sends the failed request again. */
  const [lastBody, setLastBody] = useState<NewsSummarizeRequest | null>(null);
  const runState = useDraftRunState(queryClient, activeRun?.id ?? null);

  const onOpenItemRef = useRef(onOpenItem);
  useEffect(() => {
    onOpenItemRef.current = onOpenItem;
  });

  // While this studio shows the run, it is the one to turn the result into a draft (no toast).
  const activeRunId = activeRun?.id ?? null;
  useEffect(() => (activeRunId === null ? undefined : watchDraftRun(activeRunId)), [activeRunId]);

  // The run settled while on screen: keep its outcome here and let it go.
  useEffect(() => {
    if (!activeRun || !runState) return;
    if (runState.status === "success" && runState.data) {
      const data = runState.data;
      setRunResult(data);
      setEditorialPane("draft");
      setActiveRun(null);
      if (data.conversationId) {
        setConversationId(data.conversationId);
        void queryClient.invalidateQueries({ queryKey: ["editorial-conversation", data.conversationId] });
      }
    } else if (runState.status === "error") {
      setRunError(runState.error);
      setActiveRun(null);
    }
  }, [activeRun, runState, queryClient]);

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

  // Always on: the studio's «ذاكرة الفريق: N قواعد تُطبَّق تلقائياً» counts the approved rules.
  const memoryQuery = useQuery({
    queryKey: ["editorial-memory"],
    queryFn: () => listEditorialMemory("approved"),
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
  // Between the run settling and the effect above, read the outcome straight from the run.
  const finished = runState?.status === "success" ? runState.data : undefined;
  const failed = runState?.status === "error" ? runState.error : null;
  const generating = runState?.status === "pending" || runState?.status === "idle";
  const summary = detail?.copy ?? runResult ?? finished;
  const conversationLoading = Boolean(conversationId) && conversationDetailQuery.isFetching && !detail?.copy;
  const showEditorial = Boolean(summary) || conversationLoading;
  const busy = generating || reviseMutation.isPending || restoreMutation.isPending || memoryMutation.isPending;
  /** The last generation failed (the studio shows it with «أعد المحاولة»). */
  const generateError = runError ?? failed;
  // The wire shows its own feed / sources errors (Main-error); the studio shows the editorial ones.
  const error =
    generateError ??
    conversationDetailQuery.error ??
    reviseMutation.error ??
    restoreMutation.error ??
    memoryMutation.error;
  const resultFormat: Format = summary?.format ?? (activeRun ? requestFormat(activeRun.body) : selectedFormat);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    if (!detail) return;
    setSelectedFormat(detail.format);
    if (detail.itemId) onOpenItemRef.current(detail.itemId, detail.id);
    if (detail.copy.carousel) {
      const { slides, style, density, mark } = detail.copy.carousel;
      const next = { slides: slides.length, style, density, mark };
      writeCarouselOptions(next);
      setCarouselOptionsState(next);
    }
  }, [detail]);

  function setCarouselOptions(next: CarouselOptions) {
    writeCarouselOptions(next);
    setCarouselOptionsState(next);
  }

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

  /** «افتح» on the «المسودة جاهزة» toast: the story's studio (mobile redirects to its screen) adopts the run. */
  function openFinishedRun(id: number) {
    navigate(studioLink(draftRunInfo(id)?.itemId ?? null), { state: { draftRunId: id } });
  }

  function start(body: NewsSummarizeRequest) {
    setCopied(false);
    setCopyError(false);
    setRunError(null);
    setRunResult(null);
    setLastBody(body);
    const id = startDraftRun(queryClient, {
      body,
      info: {
        format: requestFormat(body),
        itemId: body.briefing ? null : (body.itemId ?? null),
        slides: body.carousel?.slides ?? carouselOptions.slides,
      },
      notify: { toast, open: openFinishedRun },
    });
    setActiveRun({ id, body });
  }

  function runSummarize(body: NewsSummarizeRequest) {
    if (busy) return;
    start(body);
  }

  /** Clears the studio. A run still generating finishes in the background (S04 §8: into the archive). */
  function resetStory() {
    if (activeRun) abandonDraftRun(activeRun.id);
    setActiveRun(null);
    setRunResult(null);
    setRunError(null);
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
    setSelectedFormat((current) => (current === "briefing" ? readLastFormat() : current));
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

  /** «إلغاء» (Main-generating, MobGenerating): abort the request and go back to the formats. */
  function cancelRun() {
    if (activeRun) cancelDraftRun(activeRun.id);
    setActiveRun(null);
  }

  /** Leave the generating screen without cancelling: the draft arrives with the «المسودة جاهزة» toast. */
  function detachRun() {
    setActiveRun(null);
  }

  /** «افتح»: show a finished run as this studio's draft. */
  function adoptRun(id: number): boolean {
    const state = readDraftRun(queryClient, id);
    if (state?.status !== "success" || !state.data) return false;
    const data = state.data;
    resetStory();
    setRunResult(data);
    setSelectedFormat(data.format);
    if (data.conversationId) setConversationId(data.conversationId);
    return true;
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

  /** A format tile: remembered as the last chosen format (S05 §1). */
  function selectFormat(format: Format) {
    setSelectedFormat(format);
    setCopied(false);
    if (format !== "briefing") writeLastFormat(format);
  }

  function generateSummary() {
    if (!selected && selectedFormat !== "briefing") return;
    setCopied(false);
    runSummarize(storyRequest(selectedFormat));
  }

  /** «أعد المحاولة» after a failed generation. */
  function retry() {
    if (lastBody) runSummarize(lastBody);
  }

  function runStoryFormat(format: NewsStoryFormat) {
    if (!detail?.itemId && !selected) return;
    setSelectedFormat(format);
    runSummarize(storyRequest(format));
  }

  /** Format switch on a finished draft (the old desk's «switch» bar). */
  function switchFormat(next: Format) {
    setRunResult(null);
    setConversationId(null);
    if (next === "briefing") runSummarize(storyRequest("briefing"));
    else runStoryFormat(next);
  }

  /** «خبر آخر»: back to the story and its formats. */
  function closeDraft() {
    setRunResult(null);
    setConversationId(null);
    setCopied(false);
    setInstruction("");
    setSelectedFormat((current) => (current === "briefing" ? readLastFormat() : current));
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

  const memory = memoryQuery.data?.rules ?? [];

  return {
    // state
    summary,
    detail,
    conversationId,
    conversationLoading,
    showEditorial,
    busy,
    error,
    generating,
    generateError,
    /** Format of the run being written. */
    runFormat: activeRun ? requestFormat(activeRun.body) : null,
    /** Slide count of the carousel being written. */
    runSlides: activeRun?.body.carousel?.slides ?? carouselOptions.slides,
    /** When the run on screen was sent (epoch ms; the steps' cosmetic timing). */
    runStartedAt: runState?.submittedAt || null,
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
    memory,
    /** Approved team-memory rules (`GET /editorial/memory`). */
    approvedRules: memory.filter((rule) => rule.status === "approved").length,
    drawerError: conversationListQuery.error ?? memoryQuery.error ?? memoryMutation.error,
    // actions
    setCarouselOptions,
    setEditorialPane,
    setInstruction,
    setDrawerOpen,
    setConversationQuery,
    selectFormat,
    generateSummary,
    retry,
    cancelRun,
    detachRun,
    adoptRun,
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
