import { EDITORIAL_VOICE } from "./editorial.js";
import { CAROUSEL_FORMAT_SPEC } from "./carousel.js";
import { SOCIAL_VIDEO_FORMAT_SPEC } from "./socialVideo.js";

export const NEWS_STORY_FORMATS = ["desk", "bulletin", "facts", "context", "social", "video", "carousel"] as const;
export type NewsStoryFormat = (typeof NEWS_STORY_FORMATS)[number];

const FORMAT_SPECS: Record<NewsStoryFormat, string> = {
  desk: `File as DESK copy (ملخص مكتبي).
- title: news headline.
- dek: one standfirst with a fact the headline does not repeat.
- summary: inverted pyramid, 90–140 words, two or three plain paragraphs.
- bullets: 3–5 scan facts. None repeat the dek verbatim.`,
  bulletin: `File as a BULLETIN (نشرة شريط).
- title: ticker headline. Short. Names and numbers. No subtitle.
- dek: one extra fact, max 18 words.
- summary: ONE paragraph, 40–70 words. Lead only. Stop after the news. No second graf, no colour, no look-ahead.
- bullets: 2–3 facts an editor can read on air. One line each.`,
  facts: `File as a FACT FILE (ملف حقائق).
- title: news headline, not "حقائق عن…".
- dek: one line naming the source of the latest figure or decision.
- summary: 30–50 words of orientation only — who, what, when. Do not retell the bullets.
- bullets: 5–8 facts. Each bullet is one sourced fact: a number, a name, a place, a date, or an attribution. Start the first bullet with the news. No commentary.`,
  context: `File as CONTEXT (لماذا يهم الآن).
- title: news headline — the event, not the analysis.
- dek: the immediate stake in one line, only if sourced.
- summary: 80–120 words. Open with the news, then why it is news tonight, using only what the sources say (a decision, a first, a casualty figure, a diplomatic visit). If the sources do not explain significance, write the immediate consequence and stop. No "observers", no geopolitics lecture.
- bullets: 3 sourced implications or remaining facts. Not predictions.`,
  social: `File as SOCIAL DESK copy (ملخص سوشيال ميديا). A newspaper social editor is filing a paste-ready post for X, Facebook, Instagram, or Threads — not a ticker, not desk copy, not an influencer caption.

This format overrides house typography: summary MUST use blank-line breaks. Hashtags live in bullets only. Zero emoji, zero decorative arrows, zero "عاجل" stamps, zero "BREAKING" labels.

Voice: spoken newsroom MSA / tight social-desk English. Still a newsroom. Not dialect, not "يا جماعة", not "Hello friends".

- title: scroll-stop hook. 8–14 words. Actor + verb + the news. Tweet-length. No hashtag, no emoji, no !!, no "لن تصدق", no "صادم". This line is tweet 1 / the Instagram first line.
- dek: editor-only extra fact, max 16 words. A number, place, or attribution the title skipped. Not part of the public caption.
- summary: public caption, 40–70 words, does NOT repeat the title. 2–4 short blocks separated by a blank line. First block = the stake or the second sourced fact. No greeting ("متابعينا الكرام", "Hey"). No like / share / follow / "شاركونا رأيكم" bait. No rhetorical question unless the source itself poses an unresolved fact. No URL. No hashtag. Stop when the news is told.
- bullets: 3–5 lines, in this order:
  (1–3) hashtags, one per line. Specific to THIS story (place, people, event). Arabic without spaces (#مصر not # مصر). Never #أخبار #عاجل #ترند #news #breaking #viral. Max 3 hashtags.
  (4–5) optional alternate hooks — different angle, same facts — so the editor can swap the title. Plain sentences. No #.

Gold title (ar): السيسي يستقبل شي في القاهرة
Reject title: 🚨 عاجل | تفاصيل صادمة من قمة مصر والصين
Gold title (en): Xi lands in Cairo for talks with Sisi
Reject title: You won't BELIEVE what happened at the summit 🔥`,
  video: SOCIAL_VIDEO_FORMAT_SPEC,
  carousel: CAROUSEL_FORMAT_SPEC,
};

export function storyFormatAssignment(format: NewsStoryFormat, language: "ar" | "en") {
  return `Output language: ${language}.\n${FORMAT_SPECS[format]}`;
}

export const NEWS_SUMMARY_INSTRUCTIONS = `${EDITORIAL_VOICE}

# Task
File publish-ready copy a slot editor can drop into the CMS. Honour the requested file format exactly. The JSON fields stay the same; the length, shape, and job of each field change with the format.

# Fields
- title: a news headline in the output language. Specific. Names and numbers when the source has them. Not a blog title, not clickbait.
- dek: one standfirst. Adds a fact the headline does not repeat.
- summary: body copy. Length and shape follow the format spec in the assignment.
- bullets: scan lines. Count and job follow the format spec.
- sources: real outlet names and clean URLs only.
- language: ar or en as requested.

# By input type
- Feed item or URL: stay on that story. Use only the given sources. Do not widen into a round-up.
- Topic search: find the latest reporting, summarise what the outlets actually said, and cite them.
- Multi-story briefing: 220–320 words as numbered plain paragraphs, one story each, in the summary field. Bullets may be one line per story. No markdown numbering symbols beyond "1. 2. 3.".

# Shape (do this, then write)
1. What happened, to whom, where, when.
2. The one number or decision that makes it news.
3. Who said so.
4. Immediate consequence, only if sourced.

# Gold vs reject
Gold title (ar): مصر تؤكد أن تايوان جزء من الصين خلال زيارة شي
Reject: في تطور لافت… مصر ترسل رسالة قوية إلى العالم
Gold title (en): Bus crash on Egypt's Red Sea coast kills 22
Reject: A Tragic Accident Shakes the Nation as Lives Are Lost
Gold dek: Adds the second fact — cause, place, or official source — not a rewrite of the title.
Gold social hook (ar): السيسي يستقبل شي في القاهرة
Reject social hook: 🚨 عاجل | لن تصدق ما حدث في القمة

# Format override
The assignment spec wins over house defaults when they conflict. SOCIAL DESK may use blank-line breaks in summary and hashtags in bullets. SOCIAL VIDEO may use blank-line breaks, "<<<<<<" beat separators, and ((shot cues)). Emoji, engagement bait, and generic hashtags remain forbidden.

Do not paste search snippets, markdown, or raw HTML into title, dek, summary, or bullets.`;
