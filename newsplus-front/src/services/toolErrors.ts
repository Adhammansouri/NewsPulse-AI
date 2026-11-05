import type { ToastApi } from "@/ui/Toast";
import { isApiError } from "./apiError";

const MESSAGES: Record<string, string> = {
  "conversation-changed": "المحادثة اتعدّلت أثناء تجهيز النسخة. حدّثها وراجع النسخة الأحدث، ثم أعد التعديل.",
  "openai-not-configured": "OpenAI غير مُعدّ على الخادم. أضف المفتاح ثم أعد المحاولة.",
  "openai-upstream": "تعذّر إكمال الطلب من نموذج الذكاء الاصطناعي. حاول مرة أخرى.",
  "too-many-requests": "وصلت للحد الأقصى من الطلبات. انتظر قليلاً ثم أعد المحاولة.",
  "openai-quota": "رصيد OpenAI خلص. اشحن الحساب ثم أعد المحاولة.",
  unauthorized: "انتهت الجلسة. سجّل الدخول مرة أخرى.",
  "invalid-request": "البيانات غير مكتملة أو غير صالحة.",
  "not-found": "المحادثة غير موجودة أو حُذفت.",
  "url-blocked": "هذا الرابط غير مسموح أو تعذّر جلبه.",
  "source-too-long": "المقال يتجاوز حد استخراج النص كاملاً. الصق النص وقسّمه إلى أجزاء للترجمة دون حذف.",
  "service-unavailable": "الخدمة غير متاحة حالياً.",
};

/** OpenAI billing, behind «اشحن الرصيد» (admins only, S10). */
export const OPENAI_BILLING_URL = "https://platform.openai.com/settings/organization/billing/overview";

/**
 * S10 system-state copy, verbatim from States.dc.html (`errors[]`, `toasts[]`) and MobSystem.dc.html.
 * Sample numbers on the boards («٢٤ طلب», «٤ دقائق», «ن٤») are interpolated by the surfaces.
 */
export const SYSTEM_COPY = {
  // AI upstream failure (States errors[1])
  failedTitle: "المحرّر ما قدرش يكمّل",
  failedText: "نموذج الذكاء الاصطناعي ما ردّش. اختيارك محفوظ.",
  retry: "أعد المحاولة",
  // OpenAI quota (States errors[2] · MobSystem quota)
  quotaTitle: "رصيد OpenAI خلص",
  quotaText: "التوليد متوقف لحد ما يتشحن الرصيد من صفحة الفوترة.",
  quotaSheetText: "المحرّر متوقف لحد ما يتشحن الرصيد. العناوين والمسودات المحفوظة شغالة عادي.",
  quotaCta: "اشحن الرصيد",
  quotaReport: "بلّغ مسؤول النظام",
  ok: "تمام",
  // AI rate limit (MobSystem ratelimit)
  rateTitle: "استراحة قصيرة للمحرّر",
  // Session expired (MobSystem session)
  sessionTitle: "الجلسة انتهت",
  sessionText: "سجّل الدخول تاني عشان تكمّل. المسودة اللي كنت شغال عليها محفوظة.",
  sessionCta: "سجّل الدخول",
  // Conversation conflict (States errors[6])
  conflictTitle: "المسودة اتعدّلت من مكان تاني",
  // Clipboard (States errors[7]; the toast with «حدّد النص» from the draft view)
  copyFailed: "تعذّر النسخ",
  selectText: "حدّد النص",
} as const;

export type ToolErrorKind =
  /** OpenAI credit ran out (402 `openai-quota`). */
  | "quota"
  /** 429 (the AI cooldown card shows it when the server sent `Retry-After`). */
  | "rate-limit"
  /** 401: the «الجلسة انتهت» dialog shows it. */
  | "session"
  /** 409 `conversation-changed`. */
  | "conflict"
  /** The AI call failed upstream (5xx) or never reached the server. */
  | "ai-failed"
  /** Any other refusal (4xx) with its own message. */
  | "message";

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

/** S10 §1: which designed surface an error from a tool call maps to. */
export function toolErrorKind(error: unknown): ToolErrorKind {
  if (!isApiError(error)) return isAbortError(error) ? "message" : "ai-failed";
  if (error.code === "openai-quota") return "quota";
  if (error.status === 429) return "rate-limit";
  if (error.status === 401) return "session";
  if (error.status === 409 && error.code === "conversation-changed") return "conflict";
  if (error.status >= 500) return "ai-failed";
  return "message";
}

export function isOpenAIQuotaError(error: unknown) {
  return isApiError(error) && error.code === "openai-quota";
}

/** A 429 the AI cooldown card covers (it carried `Retry-After`). */
export function isCooldownError(error: unknown) {
  return isApiError(error) && error.status === 429 && error.retryAfterSeconds !== undefined;
}

/**
 * Errors another surface already shows (the «الجلسة انتهت» dialog, the AI cooldown card): call sites that
 * would otherwise toast or inline the API message skip them.
 */
export function isSystemHandledError(error: unknown) {
  const kind = toolErrorKind(error);
  return kind === "session" || (kind === "rate-limit" && isCooldownError(error));
}

export function toolErrorMessage(error: unknown) {
  if (isApiError(error) && MESSAGES[error.code]) return MESSAGES[error.code];
  if (isApiError(error) && error.status === 401) return MESSAGES.unauthorized;
  if (error instanceof Error && error.message) return error.message;
  return "حدث خطأ غير متوقع. حاول مرة أخرى.";
}

export async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

/** Selects `node`'s text, or the part after `from` (a block's label), for a manual copy. */
export function selectText(node: HTMLElement | null, from?: Element | null) {
  const selection = window.getSelection();
  if (!node || !selection) return;
  const range = document.createRange();
  if (from && from.parentNode === node) {
    range.setStartAfter(from);
    range.setEnd(node, node.childNodes.length);
  } else {
    range.selectNodeContents(node);
  }
  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * The text a copy control stands for, to select by hand when the clipboard is refused: its `.block` (minus the
 * label), else the `article` of the screen part it sits in.
 */
export function selectCopySource(control: Element | null) {
  if (!control) return;
  const block = control.closest<HTMLElement>(".block");
  if (block) {
    selectText(block, block.querySelector(":scope > .block__label"));
    return;
  }
  for (let node = control.parentElement; node; node = node.parentElement) {
    const article = node.querySelector<HTMLElement>("article");
    if (article) {
      selectText(article);
      return;
    }
  }
}

/** «تعذّر النسخ» + «حدّد النص» (the draft view's clipboard toast, States errors[7]), for every copy action. */
export function showCopyFailed(toast: ToastApi, select: () => void) {
  toast.show(SYSTEM_COPY.copyFailed, {
    icon: "warning",
    action: { label: SYSTEM_COPY.selectText, onAction: select },
  });
}
