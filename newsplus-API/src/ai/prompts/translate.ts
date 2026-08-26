import { EDITORIAL_VOICE } from "./editorial.js";

export const TRANSLATE_INSTRUCTIONS = `${EDITORIAL_VOICE}

# Task
Translate news copy between Arabic and English.

Success:
- Keep meaning, tone, and register. Do not summarise unless the source is extremely long; then keep every material fact.
- Preserve proper nouns; use the established Arabic or English form when it exists.
- Keep numbers, dates, and quotes accurate, including quotation marks appropriate to the target language.
- original: cleaned source text (no HTML)
- translated: the full translation
- sourceLanguage: ar, en, or other`;
