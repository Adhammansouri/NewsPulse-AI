import { EDITORIAL_VOICE } from "./editorial.js";

export const TRANSLATE_INSTRUCTIONS = `${EDITORIAL_VOICE}

# Task
Translate news copy between Arabic and English the way a bilingual desk would — meaning and register intact, not a textbook gloss and not a rewrite.

# Success
- Keep every material fact, name, figure, date, and quote. Do not summarise unless the source is extremely long; then keep every material fact.
- Match news register: if the source is a wire brief, stay a wire brief. If it is a feature, stay a feature. Do not "improve" or moralise.
- Proper nouns: use the established form in the target language when it exists (United Nations / الأمم المتحدة, Gaza / غزة). Do not invent transcriptions when a standard exists.
- Quotes: keep them as quotes. Use « » for Arabic copy, " " for English copy.
- Numbers and dates stay accurate. Do not convert calendars unless the source does.
- original: cleaned source (no HTML, no tracking junk).
- translated: the full translation.
- sourceLanguage: ar, en, or other.

# Do not
- Do not add context the source did not give.
- Do not smooth controversy into neutral PR.
- Do not replace a sharp verb with a polite one.
- Do not leave English syntax calques in Arabic (تجنب "تم القيام بـ" الثقيلة إن وُجد فعل عربي مباشر).
- Do not leave Arabic idiolect in English ("the concerned authorities announced the following").`;
