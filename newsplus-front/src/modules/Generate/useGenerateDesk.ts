// State of the «توليد» screen, shared by DeskGenerate and MobGenerate: the assignment form, the write call,
// the result on screen, the drafts on this device and the copy/download/handoff actions.
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type {
  GenerateLanguage,
  GenerateLength,
  GenerateRequest,
  GenerateStyle,
  GenerateTone,
} from "@newsplus/shared";
import { isApiError } from "@/services/apiError";
import type { DeskHandoffState } from "@/services/deskHandoff";
import { generateContent } from "@/services/generateService";
import { copyText } from "@/services/toolErrors";
import { useToast } from "@/ui/Toast";
import { relativeTimeAr } from "@/utils/arabic";
import {
  ANGLE_MAX,
  ANGLES,
  ASSIGNMENT_MAX,
  ASSIGNMENT_MIN,
  LANGUAGES,
  LENGTHS,
  SOURCE_MODE_LABEL,
  STYLE_DEFINITE,
  TONES,
  angleAdjective,
  assignmentPrompt,
  clearDrafts,
  deleteDraft,
  downloadCopy,
  packCopy,
  pushDraft,
  readDrafts,
  splitHandoff,
  urlHost,
  urlLooksBroken,
  wordCount,
  wordsPhrase,
  type GenerateDraft,
} from "./generateDesk";
import { useSocialPost } from "./useSocialPost";

export type SourceMode = "auto" | "search";
export type CopiedBlock = "title" | "dek" | null;

/** What was sent, so the writing state describes the run in flight (not the form, which may change). */
type Run = { url: string; notes: string; style: GenerateStyle; angle: string; mode: SourceMode };
type Variables = { body: GenerateRequest; run: Run; signal: AbortSignal };

/** The writing steps move on like the DeskGenerate board (0.7s, 1.5s); the last one stays until the reply. */
const STEP_DELAYS = [700, 1500] as const;
const COPIED_MS = 1900;

function isAbort(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

export function useGenerateDesk(handoff: DeskHandoffState | null) {
  const toast = useToast();
  const social = useSocialPost();
  const initial = useMemo(() => splitHandoff(handoff?.prompt || handoff?.input), [handoff?.prompt, handoff?.input]);

  const [url, setUrlState] = useState(initial.url);
  const [notes, setNotesState] = useState(initial.notes);
  /** The mobile «رابط أو موضوع» text as typed (url + notes are derived from it); null → show url + notes. */
  const [sourceText, setSourceTextState] = useState<string | null>(null);
  const [style, setStyle] = useState<GenerateStyle>(handoff?.style ?? (initial.url ? "brief" : "article"));
  const [language, setLanguage] = useState<GenerateLanguage>("ar");
  const [length, setLength] = useState<GenerateLength>("standard");
  const [tone, setTone] = useState<GenerateTone>("desk");
  const [angle, setAngle] = useState("");

  const [drafts, setDrafts] = useState<GenerateDraft[]>(readDrafts);
  const [activeId, setActiveId] = useState<string | null>(null);
  /** Mobile: the form, or the finished draft (MobGenerate-done). */
  const [mobileView, setMobileView] = useState<"form" | "result">("form");
  const [draftsOpen, setDraftsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState<CopiedBlock>(null);
  const [run, setRun] = useState<Run | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const submittingRef = useRef(false);

  const mutation = useMutation({
    mutationFn: ({ body, signal }: Variables) => generateContent(body, signal),
    onSuccess: (data, { body, run: sent }) => {
      const next = pushDraft({
        ...data,
        // «ابحث عن الخبر» sends the URL as a search lead: the server reports `notes`, the run was a search.
        sourceMode: sent.mode === "search" ? "search" : data.sourceMode,
        style: body.style,
        source: sent.url || sent.notes.slice(0, 80),
        angle: sent.angle || undefined,
      });
      setDrafts(next);
      setActiveId(next[0]?.id ?? null);
      setMobileView("result");
    },
    onSettled: () => {
      submittingRef.current = false;
    },
  });

  const pending = mutation.isPending;
  const error = mutation.error && !isAbort(mutation.error) ? mutation.error : null;
  /** The site refused the page (fetch blocked, private network, unreachable): DeskGenerate-error. */
  const urlRejected = Boolean(error && isApiError(error) && error.code === "url-blocked" && run?.url);

  const host = urlHost(url);
  const brokenUrl = urlLooksBroken(url);
  const prompt = assignmentPrompt(url, notes);
  const tooLong = prompt.length > ASSIGNMENT_MAX || angle.trim().length > ANGLE_MAX;
  const hasSource = Boolean((url.trim() && host) || notes.trim());
  const canSubmit = prompt.length >= ASSIGNMENT_MIN && !tooLong && hasSource && !brokenUrl;
  const isEmpty = !url.trim() && !notes.trim();
  const active = drafts.find((draft) => draft.id === activeId) ?? null;
  const angleIsChip = (ANGLES as readonly string[]).includes(angle);

  // Writing progress: step 1 → 2 → 3, then the last step stays active until the reply.
  useEffect(() => {
    if (!pending) return;
    setStep(0);
    const timers = STEP_DELAYS.map((delay, index) => window.setTimeout(() => setStep(index + 1), delay));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [pending]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(null), COPIED_MS);
    return () => window.clearTimeout(timer);
  }, [copied]);

  /** Editing the URL clears the «رابط مرفوض» state. */
  function clearRejection() {
    if (urlRejected) mutation.reset();
  }

  function setUrl(value: string) {
    setUrlState(value);
    setSourceTextState(null);
    clearRejection();
  }

  function setNotes(value: string) {
    setNotesState(value);
    setSourceTextState(null);
  }

  /** Mobile: one field for a link or a topic (a leading URL is the source, the rest are notes). */
  function setSourceText(value: string) {
    const next = splitHandoff(value);
    setSourceTextState(value);
    setUrlState(next.url);
    setNotesState(next.notes);
    clearRejection();
  }

  function submit(mode: SourceMode = "auto") {
    if (pending || submittingRef.current || !canSubmit) return;
    const sent: Run = { url: url.trim(), notes: notes.trim(), style, angle: angle.trim(), mode };
    const controller = new AbortController();
    abortRef.current = controller;
    submittingRef.current = true;
    setRun(sent);
    setCopied(null);
    setDraftsOpen(false);
    mutation.mutate({
      body: {
        prompt: assignmentPrompt(sent.url, sent.notes, mode),
        style,
        language,
        length,
        tone,
        angle: sent.angle || undefined,
      },
      run: sent,
      signal: controller.signal,
    });
  }

  const submitRef = useRef(submit);
  submitRef.current = submit;

  // Ctrl/⌘ + Enter writes from anywhere on the screen (the `kbd` on the CTA).
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.key !== "Enter") return;
      event.preventDefault();
      submitRef.current();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /** Mobile «إلغاء»: drop the draft being written and go back to the form. */
  function cancel() {
    abortRef.current?.abort();
    abortRef.current = null;
    submittingRef.current = false;
    mutation.reset();
    setMobileView("form");
  }

  /** «الصق النص»: drop the refused URL and write from pasted text instead. */
  function pasteInstead() {
    setUrlState("");
    setSourceTextState(null);
    mutation.reset();
  }

  function openDraft(id: string) {
    setActiveId(id);
    setDraftsOpen(false);
    setCopied(null);
    setMobileView("result");
  }

  function removeDraft(id: string) {
    setDrafts(deleteDraft(id));
    if (id === activeId) {
      setActiveId(null);
      setMobileView("form");
    }
  }

  function removeAllDrafts() {
    setDrafts(clearDrafts());
    setActiveId(null);
    setDraftsOpen(false);
    setMobileView("form");
  }

  async function copyBlock(key: Exclude<CopiedBlock, null>, value: string) {
    try {
      await copyText(value);
      setCopied(key);
    } catch {
      toast.show("تعذّر النسخ", { icon: "error-circle" });
    }
  }

  async function copyAll(draft: GenerateDraft) {
    try {
      await copyText(packCopy(draft));
      toast.show(`نُسخ ${STYLE_DEFINITE[draft.style]} كاملاً`);
    } catch {
      toast.show("تعذّر النسخ", { icon: "error-circle" });
    }
  }

  const settingsSummary = [
    LANGUAGES.find((item) => item.id === language)?.label,
    LENGTHS.find((item) => item.id === length)?.label,
    TONES.find((item) => item.id === tone)?.label,
    angle.trim(),
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    // form
    url,
    notes,
    sourceText: sourceText ?? [url, notes].filter(Boolean).join("\n"),
    setUrl,
    setNotes,
    setSourceText,
    style,
    setStyle,
    language,
    setLanguage,
    length,
    setLength,
    tone,
    setTone,
    angle,
    angleIsChip,
    setAngle,
    toggleAngle: (value: string) => setAngle((current) => (current === value ? "" : value)),
    settingsSummary,
    host,
    brokenUrl,
    tooLong,
    canSubmit,
    isEmpty,
    submit,
    // run
    pending,
    run,
    step,
    error,
    urlRejected,
    cancel,
    pasteInstead,
    searchInstead: () => submit("search"),
    // result + drafts
    active,
    activeId,
    drafts,
    mobileView,
    backToForm: () => setMobileView("form"),
    openDraft,
    removeDraft,
    removeAllDrafts,
    draftsOpen,
    setDraftsOpen,
    settingsOpen,
    setSettingsOpen,
    // actions
    copied,
    copyBlock,
    copyAll,
    download: (draft: GenerateDraft) => downloadCopy(draft, draft.style),
    social,
  };
}

export type GenerateDesk = ReturnType<typeof useGenerateDesk>;

/**
 * «من الصفحة · ٥١٠ كلمة · الآن» (desktop popover) or «من الصفحة · الآن» (mobile sheet). Yesterday reads «أمس»
 * without the clock, as on the drafts boards.
 */
export function draftMeta(draft: GenerateDraft, withWords: boolean): string {
  const relative = relativeTimeAr(new Date(draft.at).toISOString());
  const time = relative.startsWith("أمس") ? "أمس" : relative;
  return [
    draft.sourceMode ? SOURCE_MODE_LABEL[draft.sourceMode] : "",
    withWords ? wordsPhrase(wordCount(draft.title, draft.dek, draft.body)) : "",
    time,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** «كتبه المحرّر من مقال skynewsarabia.com · زاوية اقتصادية». */
export function provenance(draft: GenerateDraft): string {
  const host = urlHost(draft.source);
  const origin =
    draft.sourceMode === "page" && host
      ? `من مقال ${host}`
      : draft.sourceMode
        ? SOURCE_MODE_LABEL[draft.sourceMode]
        : "";
  const lead = origin ? `كتبه المحرّر ${origin}` : "كتبه المحرّر";
  return draft.angle ? `${lead} · زاوية ${angleAdjective(draft.angle)}` : lead;
}
