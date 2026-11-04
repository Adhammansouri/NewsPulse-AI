// State of the «ترجمة» screen, shared by DeskTranslate and MobTranslate: the source (text or article URL),
// the auto-detected direction with the swap override, the translate call, and the done/stale result.
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { TranslateData, TranslateLanguage, TranslateRequest } from "@newsplus/shared";
import { useSocialPost } from "@/modules/Generate/useSocialPost";
import { incrementDailyStat } from "@/services/dailyStats";
import type { DeskHandoffState } from "@/services/deskHandoff";
import { copyText } from "@/services/toolErrors";
import { translateContent } from "@/services/translateService";
import { useToast } from "@/ui/Toast";
import {
  LANGUAGE_NAME,
  TEXT_MAX,
  URL_MAX,
  detectLanguage,
  otherLanguage,
  type SourceKind,
} from "./translateDesk";

/** The last translation and the exact source it was made from (editing the source makes it stale). */
export type TranslateResult = { data: TranslateData; kind: SourceKind; input: string };

type Variables = { request: TranslateRequest; kind: SourceKind; input: string };

/** «نسخ الترجمة» → «تم النسخ» for 1.5s (DeskTranslate). */
const COPIED_MS = 1500;
const WHOLE_URL = /^https?:\/\/\S+$/i;

export function useTranslateDesk(handoff: DeskHandoffState | null) {
  const toast = useToast();
  const social = useSocialPost();
  const initialSource = handoff?.source?.trim() ?? "";
  const [kind, setKindState] = useState<SourceKind>(() => (WHOLE_URL.test(initialSource) ? "url" : "text"));
  const [text, setText] = useState(() => (WHOLE_URL.test(initialSource) ? "" : (handoff?.source ?? "")));
  const [url, setUrl] = useState(() => (WHOLE_URL.test(initialSource) ? initialSource : ""));
  /** «تبديل الاتجاه» on the current source; it lapses once the source changes language. */
  const [override, setOverride] = useState<{ key: string; target: TranslateLanguage } | null>(null);
  const [result, setResult] = useState<TranslateResult | null>(null);
  const [copied, setCopied] = useState(false);
  /** Mobile: the source card is open for editing. */
  const [editing, setEditing] = useState(false);

  const mutation = useMutation({
    mutationFn: ({ request }: Variables) => translateContent(request),
    onSuccess: (data, { kind: sentKind, input }) => {
      setResult({ data, kind: sentKind, input });
      setCopied(false);
      setEditing(false);
      incrementDailyStat("translations");
    },
  });

  const detected = kind === "text" ? detectLanguage(text) : null;
  const directionKey = kind === "url" ? "url" : (detected ?? "none");
  if (override && override.key !== directionKey) setOverride(null);
  const autoTarget: TranslateLanguage = kind === "url" || detected === "en" ? "ar" : "en";
  const target = override?.key === directionKey ? override.target : autoTarget;
  const from = kind === "url" && result?.kind === "url" && result.data.sourceLanguage !== "other"
    ? result.data.sourceLanguage
    : otherLanguage(target);

  const input = (kind === "url" ? url : text).trim();
  const urlValid = WHOLE_URL.test(url.trim());
  const limit = kind === "url" ? URL_MAX : TEXT_MAX;
  const tooLong = input.length > limit;
  const pending = mutation.isPending;
  const stale = Boolean(result && result.input !== input);
  const phase: "empty" | "busy" | "done" = pending ? "busy" : result ? "done" : "empty";
  const canSubmit = Boolean(input) && !tooLong && (kind === "text" || urlValid) && !pending;

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), COPIED_MS);
    return () => window.clearTimeout(timer);
  }, [copied]);

  function submit() {
    if (!canSubmit) return;
    const request: TranslateRequest = kind === "url" ? { url: input, target } : { text: input, target };
    mutation.mutate({ request, kind, input });
  }

  /** نص / رابط: a fresh start in the other mode (DeskTranslate `setText` / `setUrl`). */
  function setKind(next: SourceKind) {
    if (next === kind || pending) return;
    setKindState(next);
    setResult(null);
    setEditing(false);
    mutation.reset();
  }

  /**
   * «تبديل الاتجاه». With a translation on screen it becomes the new source (its language is then detected,
   * so the direction flips by itself); otherwise the direction flips until the source changes language.
   */
  function swap() {
    if (pending) return;
    if (result) {
      setKindState("text");
      setText(result.data.translated);
      setOverride(null);
      setResult(null);
      setEditing(false);
    } else {
      setOverride({ key: directionKey, target: otherLanguage(target) });
    }
    mutation.reset();
  }

  async function copyTranslation() {
    if (!result) return;
    try {
      await copyText(result.data.translated);
      setCopied(true);
    } catch {
      toast.show("تعذّر النسخ", { icon: "error-circle" });
    }
  }

  const buttonLabel = pending
    ? "جاري الترجمة…"
    : stale
      ? "أعد الترجمة"
      : result
        ? "ترجم مرة أخرى"
        : kind === "url"
          ? "استخرج وترجم"
          : `ترجم إلى ${LANGUAGE_NAME[target]}`;

  const limitHint =
    tooLong
      ? `المصدر يتجاوز ${limit.toLocaleString("ar-EG")} حرف. ${kind === "url" ? "استخدم رابطاً أقصر أو الصق نص المقال." : "قسّم النص إلى أجزاء كاملة للترجمة."}`
      : null;

  return {
    kind,
    setKind,
    text,
    setText,
    url,
    setUrl,
    urlValid,
    detected,
    from,
    target,
    swap,
    input,
    tooLong,
    limitHint,
    canSubmit,
    submit,
    pending,
    phase,
    stale,
    result,
    error: mutation.error,
    buttonLabel,
    copied,
    copyTranslation,
    editing,
    setEditing,
    startPost: () => result && social.start(result.data.translated, result.data.targetLanguage),
    socialPending: social.pending,
  };
}

export type TranslateDesk = ReturnType<typeof useTranslateDesk>;
