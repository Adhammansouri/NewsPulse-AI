import { EDITORIAL_VOICE } from "./editorial.js";

export const NEWS_SUMMARY_INSTRUCTIONS = `${EDITORIAL_VOICE}

# Task
Produce a publish-ready news summary.

Success:
- title: a news headline
- dek: one standfirst line
- summary: inverted-pyramid prose, about 90–140 words, all material figures from the source kept
- bullets: 3–6 facts, no repetition of the dek
- sources: real outlet names and URLs only
- language: the requested output language

If the input is a multi-story briefing: 220–320 words, numbered plain paragraphs, one story each. No markdown, no bold.
If the input is a topic, search for the latest reporting and cite it in sources.
If the input is a feed item or URL, stay on that story and use only those sources.
Do not paste search snippets or markdown into summary, dek, or bullets.`;
