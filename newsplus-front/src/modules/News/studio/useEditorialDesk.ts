// Editorial state of the newsroom studio (story → format → generating → draft → revisions).
// S04 §8: generation never locks the wire; opening another story mid-generation abandons the run on screen,
// it still completes and lands in the archive. S05: the run lives in the app-lifetime draft-run store
// (draftRuns.ts) — «إلغاء» aborts it, leaving the screen keeps it going, and the format / carousel options the
// editor picked are remembered (formatPrefs.ts).
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type {
  CarouselOptions,
  EditorialConversationDetail,
  EditorialMemoryStatus,
  NewsFeedItem,
  NewsStoryFormat,
  NewsSummarizeData,
  NewsSummarizeRequest,
} from "@newsplus/shared";
import { useAiCooldown } from "@/hooks/useAiCooldown";
import { useUnsentDraft } from "@/hooks/useUnsentDraft";
import {
  getEditorialConversation,
  listEditorialMemory,
  restoreEditorialVersion,
  reviseEditorialConversation,
  updateEditorialMemory,
} from "@/services/editorialService";
import { toolErrorKind } from "@/services/toolErrors";
import { takeUnsentDraft } from "@/services/unsentDrafts";
import type { ConflictInfo } from "@/ui/ErrorSurface";
import { useToast } from "@/ui/Toast";
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
import { showRuleSavedToast } from "./archive/useArchive";
import { DRAFT_COPY } from "./draft/copy";
import { restoredToast } from "./draft/restoreToast";
import { readCarouselOptions, readLastFormat, writeCarouselOptions, writeLastFormat } from "./formatPrefs";
import { studioLink } from "./studioLink";

type Format = NewsSummarizeData["format"];
/** The run this studio shows while it is generating. */
type ActiveRun = { id: number; body: NewsSummarizeRequest };

/** What «الجلسة انتهت» keeps of the draft view (S10): the conversation and the dock's unsent text. */
type UnsentEditorial = { conversationId: string; instruction: string };

/** The number of the conversation's current version. */
function currentNumber(detail: EditorialConversationDetail): number | null {
  return detail.versions.find((version) => version.id === detail.currentVersionId)?.number ?? detail.versions.at(-1)?.number ?? null;
}

/** Version restores (chips and the «رجعت للنسخة» undo), so the toast's undo can check one is running. */
const RESTORE_KEY = ["editorial-restore"];

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
  const [selectedFormat, setSelectedFormat] = useState<Format>(readLastFormat);
  const [carouselOptions, setCarouselOptionsState] = useState<CarouselOptions>(readCarouselOptions);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null);
  /** The finished run's draft, kept here once the run is done (the cache collects it later). */
  const [runResult, setRunResult] = useState<NewsSummarizeData | null>(null);
  const [runError, setRunError] = useState<Error | null>(null);
  /** «أعد المحاولة» sends the failed request again. */
  const [lastBody, setLastBody] = useState<NewsSummarizeRequest | null>(null);
  const runState = useDraftRunState(queryClient, activeRun?.id ?? null);
  /** S10: the AI rate-limit cooldown — every AI action here waits for it. */
  const cooldown = useAiCooldown();
  /** S10 409: the server's newer version, fetched without replacing the draft on screen until «اعرض ن{n}». */
  const [conflict, setConflict] = useState<{ conversationId: string; detail: EditorialConversationDetail } | null>(null);

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

  // Always on: the studio's «ذاكرة الفريق: N قواعد تُطبَّق تلقائياً» counts the approved rules.
  const memoryQuery = useQuery({
    queryKey: ["editorial-memory"],
    queryFn: () => listEditorialMemory("approved"),
  });

  const reviseMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => reviseEditorialConversation(id, text),
    onSuccess(data) {
      queryClient.setQueryData(["editorial-conversation", data.conversation.id], data.conversation);
      void queryClient.invalidateQueries({ queryKey: ["editorial-conversations"] });
      void queryClient.invalidateQueries({ queryKey: ["editorial-memory"] });
      const saved = currentNumber(data.conversation);
      if (saved !== null) toast.show(DRAFT_COPY.versionSavedToast(saved));
    },
    onError(error, { id }) {
      if (toolErrorKind(error) === "conflict") {
        // States «المسودة اتعدّلت من مكان تاني»: learn the newer version, keep this one on screen until «اعرض ن{n}».
        setConflict(null);
        getEditorialConversation(id).then(
          (detail) => setConflict({ conversationId: id, detail }),
          () => void queryClient.invalidateQueries({ queryKey: ["editorial-conversation", id] }),
        );
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ["editorial-conversation", conversationId] });
    },
  });

  const restoreMutation = useMutation({
    mutationKey: RESTORE_KEY,
    mutationFn: ({ id, versionId }: { id: string; versionId: string; undoTo?: string; undo?: boolean }) =>
      restoreEditorialVersion(id, versionId),
    onSuccess(data, { id, versionId, undoTo, undo }) {
      queryClient.setQueryData(["editorial-conversation", data.conversation.id], data.conversation);
      void queryClient.invalidateQueries({ queryKey: ["editorial-conversations"] });
      if (undo) {
        const saved = currentNumber(data.conversation);
        if (saved !== null) toast.show(DRAFT_COPY.versionSavedToast(saved));
        return;
      }
      const source = data.conversation.versions.find((version) => version.id === versionId)?.number;
      if (source === undefined) return;
      // «رجعت للنسخة ١» + «تراجع»: the undo restores the version that was current before.
      restoredToast(
        toast,
        source,
        undoTo
          ? () => {
              // Read live: this closure outlives the render it was made in.
              if (queryClient.isMutating({ mutationKey: RESTORE_KEY }) === 0) restoreMutation.mutate({ id, versionId: undoTo, undo: true });
            }
          : undefined,
      );
    },
  });

  const memoryMutation = useMutation({
    mutationFn: ({
      id,
      status,
      instruction: next,
    }: {
      id: string;
      status?: EditorialMemoryStatus;
      instruction?: string;
      /** The suggestion's wording before «احفظ للفريق»: «تراجع» puts it back. */
      suggested?: string;
    }) => updateEditorialMemory(id, { status, instruction: next }),
    onSuccess(_rule, { id, status, suggested }) {
      void queryClient.invalidateQueries({ queryKey: ["editorial-conversation", conversationId] });
      void queryClient.invalidateQueries({ queryKey: ["editorial-memory"] });
      if (status === "approved" && suggested !== undefined) {
        showRuleSavedToast(toast, () => memoryMutation.mutate({ id, status: "pending", instruction: suggested }));
      }
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
  /** AI actions also wait for the rate-limit cooldown (restore, memory and browsing don't). */
  const aiBlocked = busy || cooldown.active;
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
  /** The revision request on its way / the one that failed (MobDraft-revising / MobDraft-error). */
  const pendingInstruction = reviseMutation.isPending ? (reviseMutation.variables?.text ?? null) : null;
  const failedInstruction = reviseMutation.isError ? (reviseMutation.variables?.text ?? null) : null;

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
    if (cooldown.active) return;
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
    if (aiBlocked) return;
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
    setConflict(null);
    setConversationId(null);
    setInstruction("");
  }

  /** A story picked in the wire (never blocked by a running generation). */
  function openStory() {
    resetStory();
    setSelectedFormat((current) => (current === "briefing" ? readLastFormat() : current));
  }

  /** «موجز الساعة»: the briefing of the top headlines, pinned stories first. */
  function startBriefing() {
    if (cooldown.active) return;
    resetStory();
    setSelectedFormat("briefing");
    start(storyRequest("briefing"));
  }

  /** Swipe «اكتب منشور»: the story with «منشور سوشيال» selected, generating at once. */
  function startSocial(item: NewsFeedItem) {
    if (cooldown.active) return;
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

  /** A format tile: remembered as the last chosen format (S05 §1). */
  function selectFormat(format: Format) {
    setSelectedFormat(format);
    if (format !== "briefing") writeLastFormat(format);
  }

  function generateSummary() {
    if (!selected && selectedFormat !== "briefing") return;
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

  /** A finished draft written again in another format (or the carousel with new settings), for the same story. */
  function switchFormat(next: Format) {
    setRunResult(null);
    setConversationId(null);
    if (next === "briefing") runSummarize(storyRequest("briefing"));
    else runStoryFormat(next);
  }

  /** «الخبر» / «تحويل الصيغة»: back to the story and its formats, the draft's format still chosen. */
  function closeDraft() {
    setRunResult(null);
    setConversationId(null);
    setInstruction("");
    setSelectedFormat((current) => (current === "briefing" ? readLastFormat() : current));
  }

  /** Sends a revision: every one is saved as a new version (`POST /editorial/conversations/:id/revise`). */
  function revise(text: string) {
    const value = text.trim();
    if (aiBlocked || !conversationId || !value) return;
    setConflict(null);
    reviseMutation.mutate({ id: conversationId, text: value });
  }

  /** The dock: Enter / «إرسال». The request shows in the thread while the editor works, so the field empties. */
  function submitRevision() {
    if (aiBlocked || !conversationId || !instruction.trim()) return;
    revise(instruction);
    setInstruction("");
  }

  /** «أعد المحاولة» (MobDraft-error): the saved request again. */
  function retryRevision() {
    const failed = reviseMutation.variables;
    if (!aiBlocked && failed) reviseMutation.mutate(failed);
  }

  /** An older version chip: the API copies it into a new version (`POST /editorial/conversations/:id/restore`). */
  function restore(versionId: string) {
    if (busy || !conversationId) return;
    restoreMutation.mutate({ id: conversationId, versionId, undoTo: detail?.currentVersionId });
  }

  /** «اعرض ن{n}» (409): show the newer version; the request that hit the conflict goes back to the dock. */
  function showConflict() {
    if (!conflict) return;
    queryClient.setQueryData(["editorial-conversation", conflict.conversationId], conflict.detail);
    void queryClient.invalidateQueries({ queryKey: ["editorial-conversation", conflict.conversationId] });
    const text = reviseMutation.variables?.text;
    reviseMutation.reset();
    setConflict(null);
    if (text) setInstruction(text);
  }

  function openConversation(id: string) {
    if (busy) return;
    resetStory();
    setConversationId(id);
    setDrawerOpen(false);
    onShowDesk();
  }

  // S10 401: «الجلسة انتهت» keeps the dock's unsent text (or the request the expiry refused) with its conversation…
  useUnsentDraft("editorial", (): UnsentEditorial | null => {
    const text = instruction.trim() ? instruction : reviseMutation.isError ? (reviseMutation.variables?.text ?? "") : "";
    return conversationId && text.trim() ? { conversationId, instruction: text } : null;
  });
  // …and after signing in, this screen reopens that conversation with the text back in the dock (once).
  const openConversationRef = useRef(openConversation);
  openConversationRef.current = openConversation;
  useEffect(() => {
    const saved = takeUnsentDraft<UnsentEditorial>("editorial");
    if (!saved?.conversationId) return;
    openConversationRef.current(saved.conversationId);
    setInstruction(saved.instruction);
  }, []);

  function closeDrawer() {
    setDrawerOpen(false);
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
    /** S10: the AI rate-limit cooldown is running — AI buttons are disabled. */
    aiCooldown: cooldown.active,
    error,
    /** Opening a saved conversation, restoring a version or a memory decision failed. */
    draftError: conversationDetailQuery.error ?? restoreMutation.error ?? memoryMutation.error,
    revising: reviseMutation.isPending,
    restoring: restoreMutation.isPending,
    pendingInstruction,
    failedInstruction,
    reviseError: reviseMutation.error,
    /** 409 on a revision: the newer version and «اعرض ن{n}» (null until it is known). */
    conflict:
      conflict && conflict.conversationId === conversationId
        ? ({ version: currentNumber(conflict.detail) ?? 0, onShow: showConflict } satisfies ConflictInfo)
        : null,
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
    instruction,
    drawerOpen,
    /** Approved team-memory rules (`GET /editorial/memory`). */
    approvedRules: memory.filter((rule) => rule.status === "approved").length,
    // actions
    setCarouselOptions,
    setInstruction,
    setDrawerOpen,
    selectFormat,
    generateSummary,
    retry,
    cancelRun,
    detachRun,
    adoptRun,
    runStoryFormat,
    switchFormat,
    closeDraft,
    revise,
    submitRevision,
    retryRevision,
    restore,
    saveMemory: (id: string, next?: string) => {
      const suggested = detail?.pendingMemory.find((rule) => rule.id === id)?.instruction;
      memoryMutation.mutate(
        next === undefined ? { id, status: "approved", suggested } : { id, status: "approved", instruction: next, suggested },
      );
    },
    dismissMemory: (id: string) => memoryMutation.mutate({ id, status: "rejected" }),
    openConversation,
    closeDrawer,
    openStory,
    startBriefing,
    startSocial,
  };
}

export type EditorialDesk = ReturnType<typeof useEditorialDesk>;
