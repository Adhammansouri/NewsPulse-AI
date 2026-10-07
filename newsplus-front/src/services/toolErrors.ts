import { isApiError } from "./apiError";

const MESSAGES: Record<string, string> = {
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

export function isOpenAIQuotaError(error: unknown) {
  return isApiError(error) && error.code === "openai-quota";
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
