/** Strip model artifacts and leftover LLM cadence that should never reach the desk UI. */

const MARKDOWN_LINK = /\[([^\]]+)\]\((https?:[^)\s]+)\)/g;
const BARE_URL_PAREN = /\s*\(https?:\/\/[^\s)]+\)/g;
const UTM_OPENAI = /[?&]utm_source=openai[^&\s)]*/gi;
const BOLD = /\*\*([^*]+)\*\*/g;
const DOMAIN_PAREN = /\s*\((?:www\.)?(?:[a-z0-9-]+\.)+[a-z]{2,}\)/gi;
const HEADING_MARKERS = /^#{1,6}\s+/gm;
const BULLET_MARKERS = /^[ \t]*[-*•]\s+/gm;

const ENGLISH_TELLS = [
  /\bit'?s important to note that\s+/gi,
  /\bit is important to note that\s+/gi,
  /\bit'?s worth noting that\s+/gi,
  /\bit is worth noting that\s+/gi,
  /\bin a significant development,?\s+/gi,
  /\bin a surprising turn of events,?\s+/gi,
  /\bin a surprising turn,?\s+/gi,
  /\bas an ai language model,?\s+/gi,
  /\blet'?s dive in[:.]?\s+/gi,
  /\bat the end of the day,?\s+/gi,
  /\bthe coming days will (?:tell|reveal)[^.]*\.?/gi,
  /\btime will tell[^.]*\.?/gi,
  /\bobservers are watching[^.]*\.?/gi,
];

const ARABIC_TELLS = [
  /من المهم أن نذكر أن[ّ]?\s+/g,
  /من المهم أن نلاحظ أن[ّ]?\s+/g,
  /لا يخفى على أحد أن[ّ]?\s+/g,
  /في تطور لافت،?\s+/g,
  /في تطور مفاجئ،?\s+/g,
  /تبقى الأيام المقبلة كفيلة[^.。]*[.。]?/g,
  /لا يمكن إنكار أن[ّ]?\s+/g,
];

function stripTells(text: string) {
  let next = text;
  for (const pattern of ENGLISH_TELLS) next = next.replace(pattern, "");
  for (const pattern of ARABIC_TELLS) next = next.replace(pattern, "");
  return next;
}

export function scrubDeskProse(text: string) {
  return stripTells(text)
    .replace(MARKDOWN_LINK, "$1")
    .replace(BARE_URL_PAREN, "")
    .replace(UTM_OPENAI, "")
    .replace(BOLD, "$1")
    .replace(DOMAIN_PAREN, "")
    .replace(HEADING_MARKERS, "")
    .replace(BULLET_MARKERS, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
