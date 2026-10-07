import type {
  CarouselArc,
  CarouselDensity,
  CarouselSlide,
  CarouselSlideRole,
  CarouselStyle,
} from "@newsplus/shared";

export const CAROUSEL_ROLES = [
  "hook",
  "counter",
  "evidence",
  "stake",
  "quote",
  "scope",
  "means",
  "condition",
  "beat",
  "closer",
] as const satisfies readonly CarouselSlideRole[];

export const CAROUSEL_FORMAT_SPEC = `File as a SOCIAL CAROUSEL (كاروسيل). One Instagram post, several text slides a designer will place on a real photograph. You only write the words. You do not describe a picture. Spell every Arabic word correctly.`;

const ARC_GUIDE = `Pick one spine from the evidence, then fill every slide with a different sourced fact.
- dispute: hook (the accusation), counter (the other side), evidence (what was actually published or done), stake (the institutional or legal consequence). Drop or add beats to match the slide count. Never repeat a sentence.
- statement: quote (the attributed line), scope (what it covers), means (how they say they can do it), condition (the if/then). The quote is the poster line, not a paraphrase.
- sequence: beat, beat, closer. The last slide is the line a reader would screenshot.

Each slide has three layers, all filled:
Headline: 4–10 words. The large white line. Actor + verb + the news. Do not open with the outlet name. No emoji, no "عاجل", no "لن تصدق", no hashtag.
Banner: 2–5 words. The colored punch under the headline. This is where a public cultural frame goes when the evidence matches a pattern the audience already names. Serial killing of women may use ريا وسكينة. The frame is a headline device, not a new fact. If no frame fits, the punch is the question or phrase a reader would screenshot.
Attribution: one or two short sentences, max 28 words, the sourced facts that sit small under the punch. Not a credit line. The outlet name is already on the card.`;

export function carouselPlanAssignment(input: {
  language: "ar" | "en";
  slides: number;
  style: CarouselStyle;
}) {
  const punch = input.style === "frame" ? "The banner is the red punch on a card." : "The banner is the cyan punch on a story cover.";

  return `Output language for headline, banner, attribution, caption, and hashtags: ${input.language}.
Slide count: exactly ${input.slides}.
${punch}
Every slide fills headline, banner, and attribution. None of them is empty.
${ARC_GUIDE}

Caption: the Instagram caption under the post, not a slide. First line: one sentence, 18–35 words, the line posted under the photo. Then 3–5 fact lines, each on its own line, each starting with "• ". No emoji, no greeting, no "شاركونا", no hashtag inside the caption.
Hashtags: exactly 3, one per array item, specific to this story, Arabic without spaces. Never #أخبار #عاجل #ترند #news #breaking #viral.`;
}

export const CAROUSEL_PLAN_INSTRUCTIONS = `You are the social-carousel desk. File the words a designer will set on photographs. Honour the assignment. Use only the evidence packet. Do not describe images.

# Fields
- arc: dispute, statement, or sequence.
- caption: the public caption, lead line then fact lines.
- hashtags: exactly 3.
- slides: one object per slide, in reading order. role, headline, banner, attribution.

# Facts
Attribute claims. Do not launder a ministry, a company, or a family into the narrator. Do not invent a quote, a number, a victim, or a name to earn a cultural nickname. If the evidence does not support a later beat, stop the arc early by using a remaining sourced fact, not a moral.

# Gold vs reject
Gold cover: headline العثور على الجثة رقم 10 يرعب جنوب أفريقيا / banner ريا وسكينة / the counts and dates stay in attribution and the caption.
Gold punch when no nickname fits: لغز مرعب
Reject: ريا وسكينة on a football match, or a body count that is not in the evidence.
Reject hook: عاجل | لن تصدق ما فعله البيت الأبيض
Gold statement line: هيغسيث: إذا أطلقتم النار على سفننا سندمر ناقلاتكم
Reject statement line: تصريح ناري يشعل المنطقة`;

export function carouselRevisionInstructions(input: {
  language: "ar" | "en";
  slides: number;
  style: CarouselStyle;
}) {
  return `${CAROUSEL_PLAN_INSTRUCTIONS}

# Revision
Return a FULL new slide plan, never a diff.
${carouselPlanAssignment(input)}
Keep sourced facts. "بدون اضافات" rewrites lines in place and adds zero facts, names, numbers, or scenes.
The editor instruction never overrides the evidence. You only rewrite the words.

# Standing memory candidate
Propose memory only for a reusable headline habit, such as using a public cultural frame as the colored punch when the pattern matches. No proper names from this story. Otherwise memoryPropose false and the memory strings empty.`;
}

export type CarouselPromptSlide = Pick<CarouselSlide, "headline" | "banner" | "attribution" | "scene">;

export function carouselExpectedText(slide: CarouselPromptSlide, density: CarouselDensity) {
  const lines = [slide.headline.trim()];
  if (density === "banner" && slide.banner.trim()) lines.push(slide.banner.trim());
  if (density === "line" && slide.attribution.trim()) lines.push(slide.attribution.trim());
  return lines.filter(Boolean);
}

export function buildCarouselImagePrompt(input: {
  style: CarouselStyle;
  density: CarouselDensity;
  styleLock: string;
  slide: CarouselPromptSlide;
  index: number;
  total: number;
}) {
  const scene = input.slide.scene.trim().slice(0, 500);
  const quiet =
    input.style === "cinematic"
      ? "Keep the upper half darker and visually quiet: open sky, shadow, or a simple backdrop. Put the subject in the lower half."
      : "Put the subject in the upper two thirds. Let the lower third fall into shadow.";

  return [
    "Create one vertical photograph, aspect ratio 4:5. A single photographic scene for a news carousel. Not a poster, not a collage, not a screenshot.",
    `SERIES LOCK, identical on every slide of this post: ${input.styleLock.trim()}`,
    `This is slide ${input.index + 1} of ${input.total}. Same world as the series lock.`,
    quiet,
    input.density === "headline"
      ? "Leave the quiet area empty for one headline. Do not draw that headline."
      : "Leave the quiet area empty for a headline and one short line under it. Do not draw that type.",
    `SCENE, no letters inside the scene: ${scene}`,
    "Forbidden: any letters, numbers, logos, watermarks, captions, subtitles, signage, frames, borders, colored bars, Arabic script, Latin words, Instagram chrome.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function mergeCarouselSlides(
  previous: CarouselSlide[] | undefined,
  incoming: Array<Pick<CarouselSlide, "role" | "headline" | "banner" | "attribution" | "scene">>,
): CarouselSlide[] {
  return incoming.map((slide, index) => {
    const headline = slide.headline.trim();
    const banner = slide.banner.trim();
    const attribution = slide.attribution.trim();
    const scene = "";
    const prev = previous?.[index];
    const sameText =
      prev && prev.headline === headline && prev.banner === banner && prev.attribution === attribution;

    if (prev?.assetId && sameText) {
      return { ...prev, role: slide.role, headline, banner, attribution, scene: prev.scene, index, status: "ready" };
    }

    return {
      index,
      role: slide.role,
      headline,
      banner,
      attribution,
      scene,
      status: "ready",
    };
  });
}

export function arcLabel(arc: CarouselArc) {
  if (arc === "dispute") return "نزاع";
  if (arc === "statement") return "تصريح";
  return "تسلسل";
}
