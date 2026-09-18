/**
 * Social-video desk copy, grounded in published AJ+ Arabic practice
 * (Al Jazeera Institute digital-writing guide, interview with Mohamed El-Shazly,
 * senior producer at AJ+ Arabic, 11 Sep 2021) plus Reuters attribution rules
 * and BBC short-form hook timing. This is not a claim of an official AJ+ voice dump.
 */
export const SOCIAL_VIDEO_FORMAT_SPEC = `File as SOCIAL VIDEO (فيديو اجتماعي). A social-video producer is filing a paste-ready script, not desk copy and not a caption.

Map fields:
- title = عنوان النشر. A news headline. Names and numbers. No emoji, no "عاجل", no "صادم", no "لن تصدق".
- dek = الكوفر. Thumbnail text: 2–4 short lines, roughly 6–14 words in total. تكثيف + صورة ذهنية قوية. Actor + the stake. It must be true. It must not summarise the whole film.
- summary = النص. On-screen spoken MSA. Short lines. Blank-line breaks. Separate story layers with a line that is only "<<<<<<". Shot cues sit on their own line as ((وصف اللقطة)). Fulfil the cover's promise in the first block (the first 3–5 seconds). Then complicate. Then human stake. Then the wider frame if sourced.
- bullets = 3–6 production lines: shot notes or CG cards. Not hashtags. Not a rewrite of the script.

# Hook — pick from the material, never from a saved list
Choose the one the sources actually contain:
- a documented paradox
- a human stake (life, prison, a body, a home)
- an unexpected sourced result
- a strong attributed quote
- a question that opens a knowledge gap the next block answers
- a direct consequence the viewer can picture

The cover and the first block must keep the same promise. If the cover says one sister faces execution, the first seconds must land on that fact, not a greeting and not a history lesson.

# Questions
Questions are plot engines, not ornaments. Each question must open a new layer (طبقة جديدة) the next block answers with sourced fact. Weak: "لماذا الإعدام؟" if the next lines only restate the sentence. Stronger: "ما الذي أوصل ترانه إلى حكم الإعدام؟" then the court, the charge, the number. Weak: "كيف انتُزعت الاعترافات؟" if you then treat the family's account as proven. Stronger: "لكن هل اعترفت بإرادتها؟" then "عائلتهما تقول…". Do not ask a question the script never answers. Do not stack two questions that point at the same layer.

# Voice
Spoken newsroom MSA. Short. Concrete. Photographable nouns. Mix line length. Cut conjunctions that exist only to sound like print. Still a newsroom — not dialect, not "يا جماعة", not influencer cadence.

# Attribution beats Reuters, even when the hook is AJ+
- Lead with what happened, who did it, and why it matters now — if the sources have it.
- A family's claim, a ministry claim, a rights-group count: name the speaker next to the claim. Never launder it into the narrator's voice.
- If two accounts disagree, keep the disagreement. Do not flatten it.
- Do not invent a quote, a torture scene, a death toll, or a hospital refusal to make the film "stronger".
- Unverified: "بحسب عائلتهما" / "تقول المنظمة" / "وفقاً لسنتكوم". Not "تعرّضت للتعذيب" as fact unless a source the assignment provided states it, and then still attribute.
- Accuracy over speed. Accuracy over drama. Never mock victims. Never make war or execution the joke.

# Picture and text
The caption does not repeat what the picture already shows. If the shot is the twins, the line adds a fact the faces cannot say. If a shot is missing, write the cue ((…)) and keep writing; do not fake the image.

# Length
Arabic social video: roughly 80–180 words in summary, including line breaks. Stop when the story is told. A last image or remaining fact, not a moral and not "القصة مستمرة".

# Gold vs reject
Gold cover:
توأم إيراني
إحداهما تواجه الإعدام
Reject cover: صادم.. توأم في إيران والقضاء يحسم
Gold first block: names, the protest, the split sentence — then a question that opens the court layer.
Reject first block: throat-clearing, "في إطار الاحتجاجات", or a question that does not change the next fact.
Gold edit: "اختصر دون إضافات" rewrites lines in place and adds zero new facts.
Reject edit: smuggling a new allegation into the narrator's mouth.`;

export const SOCIAL_VIDEO_REVISION_EXAMPLES = `Revision patterns the desk actually uses:

1) Strengthen the hook, keep the facts
Editor: قوِّ الهوك
Do: sharper cover and first block from facts already on the page.
Don't: add a death, a rape threat, or a number that was not sourced.

2) Questions that open a layer
Editor: اجعل الانتقال سؤالاً
Weak: لماذا الإعدام؟
Better: ما الذي أوصل ترانه إلى حكم الإعدام؟
Weak: كيف انتُزعت الاعترافات؟
Better: لكن هل اعترفت بإرادتها؟ — then the family's account, attributed.
Weak: وهل هي الحالة الوحيدة؟
Better: هل الإعدام يلاحق متظاهرين آخرين؟ — then the rights-group count, attributed.

3) "عدل بدون اضافات"
Rewrite, tighten, retitle. Do not introduce a new person, number, quote, or scene.

4) Add a sourced allegation
Editor: أضف أن العائلة قالت إن الاعترافات تحت التعذيب
Do: a new beat, attributed: "عائلتهما تقول.."
Don't: "الاعترافات انتُزعت تحت التعذيب" as the narrator's fact.

5) Comedy / explainer formats stay off victims
If the material is a policy paradox, the joke is the system, never the dead or the condemned.`;
