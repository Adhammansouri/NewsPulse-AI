/** Strip model artifacts that should never reach the desk UI. */
export function scrubDeskProse(text: string) {
  return text
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, "$1")
    .replace(/\s*\(https?:\/\/[^\s)]+\)/g, "")
    .replace(/[?&]utm_source=openai[^&\s)]*/gi, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\s*\((?:www\.)?(?:[a-z0-9-]+\.)+[a-z]{2,}\)/gi, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
