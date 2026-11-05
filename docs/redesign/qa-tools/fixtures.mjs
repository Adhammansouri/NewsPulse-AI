const now = Date.now();
const ago = (m) => new Date(now - m * 60000).toISOString();
export const sources = [
  { id: "bbc-ar", name: "BBC News عربي", language: "ar" },
  { id: "aljazeera-ar", name: "الجزيرة نت", language: "ar" },
  { id: "alarabiya", name: "العربية", language: "ar" },
  { id: "sky-arabia", name: "سكاي نيوز عربية", language: "ar" },
  { id: "asharq", name: "الشرق للأخبار", language: "ar" },
  { id: "al-ain", name: "العين الإخبارية", language: "ar" },
  { id: "reuters", name: "Reuters", language: "en" },
  { id: "bbc-en", name: "BBC News", language: "en" },
  { id: "ap", name: "AP News", language: "en" },
];
const S = (id) => { const s = sources.find((x) => x.id === id); return { id, name: s.name, url: `https://example.com/${id}/story` }; };
export const items = [
  { id: "n1", title: "البنك المركزي يثبت أسعار الفائدة للمرة الثالثة على التوالي وسط ترقب لبيانات التضخم", excerpt: "قررت لجنة السياسة النقدية الإبقاء على أسعار الفائدة دون تغيير، مشيرة إلى أن معدلات التضخم ما زالت أعلى من المستهدف رغم تراجعها خلال الربع الأخير.", publishedAt: ago(3), breaking: true, topic: "economy", sources: [S("alarabiya"), S("sky-arabia"), S("asharq")] },
  { id: "n2", title: "اجتماع طارئ لوزراء الخارجية العرب لبحث تطورات الأوضاع الإقليمية", excerpt: "يعقد وزراء الخارجية العرب اجتماعاً طارئاً مساء اليوم لبحث آخر التطورات، بحسب ما أعلنت الأمانة العامة.", publishedAt: ago(11), breaking: false, topic: "politics", sources: [S("aljazeera-ar"), S("bbc-ar")] },
  { id: "n3", title: "Global oil prices climb after OPEC+ signals extended output cuts", excerpt: "Brent crude rose more than 2% after the group said it would keep supply curbs in place through the first quarter.", publishedAt: ago(26), breaking: false, topic: "economy", sources: [S("reuters"), S("ap")] },
  { id: "n4", title: "منتخب مصر يعلن قائمة المعسكر المقبل استعداداً لتصفيات كأس العالم", excerpt: "أعلن الجهاز الفني قائمة تضم 26 لاعباً مع عودة عدد من المحترفين بعد التعافي من الإصابة.", publishedAt: ago(48), breaking: false, topic: "sports", sources: [S("al-ain")] },
  { id: "n5", title: "دراسة: الذكاء الاصطناعي يختصر زمن تشخيص بعض أمراض القلب إلى النصف", excerpt: "أظهرت دراسة نُشرت في دورية علمية أن نموذجاً للتعلم الآلي حقق دقة مقاربة للأطباء المتخصصين.", publishedAt: ago(95), breaking: false, topic: "health", sources: [S("bbc-ar")] },
  { id: "n6", title: "UN agency warns of funding gap as winter approaches in displacement camps", excerpt: "The agency said it had received less than half of the funding needed for its winter response plan.", publishedAt: ago(140), breaking: false, topic: "politics", sources: [S("bbc-en")] },
  { id: "n7", title: "إطلاق أول قمر صناعي عربي لرصد جودة الهواء من محطة فضائية", excerpt: "انطلق القمر الصناعي في مهمة تمتد خمس سنوات لقياس الملوثات فوق المدن الكبرى.", publishedAt: ago(220), breaking: false, topic: "science", sources: [S("sky-arabia"), S("al-ain")] },
  { id: "n8", title: "مهرجان القاهرة السينمائي يكشف عن أفلام المسابقة الرسمية لدورته الجديدة", excerpt: "تضم المسابقة 16 فيلماً من 14 دولة، بينها ثلاثة أفلام عربية في عرضها العالمي الأول.", publishedAt: ago(300), breaking: false, topic: "culture", sources: [S("asharq")] },
  { id: "n9", title: "شركات التقنية الكبرى تواجه قواعد جديدة لحماية بيانات المستخدمين في أوروبا", excerpt: "تدخل القواعد حيز التنفيذ مطلع العام المقبل وتفرض غرامات قد تصل إلى 6% من الإيرادات.", publishedAt: ago(410), breaking: false, topic: "tech", sources: [S("aljazeera-ar")] },
  { id: "n10", title: "ارتفاع الصادرات غير النفطية بنسبة 12% خلال الربع الثالث", excerpt: "قالت الهيئة العامة للإحصاء إن الارتفاع جاء مدفوعاً بالمنتجات الكيماوية والبلاستيكية.", publishedAt: ago(520), breaking: false, topic: "economy", sources: [S("alarabiya")] },
];
export const summary = {
  title: "المركزي يثبت الفائدة للمرة الثالثة.. والأسواق تترقب التضخم",
  dek: "اللجنة أبقت أسعار الفائدة دون تغيير وقالت إن التضخم ما زال أعلى من المستهدف.",
  summary: "قررت لجنة السياسة النقدية بالبنك المركزي الإبقاء على أسعار الفائدة دون تغيير للمرة الثالثة على التوالي، وفق بيان صدر عقب اجتماعها الدوري. وأرجعت اللجنة قرارها إلى أن معدلات التضخم ما زالت أعلى من المستهدف رغم تراجعها خلال الربع الأخير، مؤكدة أنها ستواصل متابعة البيانات قبل أي تحرك.",
  bullets: ["ثالث تثبيت متتالٍ لأسعار الفائدة", "التضخم تراجع لكنه أعلى من المستهدف", "اللجنة تربط أي تحرك بالبيانات المقبلة"],
  sources: [{ name: "العربية", url: "https://example.com/a" }, { name: "سكاي نيوز عربية", url: "https://example.com/b" }],
  language: "ar", format: "desk", conversationId: "c1", versionId: "v2", versionNumber: 2,
};
export const conversation = {
  id: "c1", title: summary.title, format: "desk", itemId: "n1", updatedAt: ago(2), createdAt: ago(6), versionCount: 2,
  currentVersionId: "v2", copy: summary,
  messages: [
    { id: "m1", role: "user", content: "صياغة مكتبية", createdAt: ago(6) },
    { id: "m2", role: "assistant", content: "جاهزة", createdAt: ago(6) },
    { id: "m3", role: "user", content: "اختصر دون إضافات", createdAt: ago(3) },
    { id: "m4", role: "assistant", content: "اختصرت الفقرة الثانية وحافظت على الأرقام والإسناد.", createdAt: ago(3) },
  ],
  versions: [{ id: "v1", number: 1, createdAt: ago(6), instruction: "" }, { id: "v2", number: 2, createdAt: ago(3), instruction: "اختصر دون إضافات" }],
  pendingMemory: [],
};
export const generate = { title: "التثبيت الثالث: لماذا يتمسك المركزي بالحذر؟", dek: "قرار متوقع، لكن رسائله للأسواق أهم من الرقم نفسه.", body: "أبقى البنك المركزي على أسعار الفائدة دون تغيير للمرة الثالثة على التوالي.\n\nويأتي القرار في وقت تراجعت فيه معدلات التضخم، لكنها لا تزال أعلى من النطاق المستهدف، ما يدفع صانعي السياسة إلى انتظار مزيد من البيانات.\n\nويرى محللون أن البيان حمل إشارات إلى أن أي خفض محتمل لن يكون قبل منتصف العام المقبل.", language: "ar", sourceMode: "page" };
// S13 / S14 / S15: the story panel's timeline, «وضع العاجل», the digest and presence (NewTimeline, NewBreaking, NewDigest).
export const timeline = {
  entries: [
    { sourceId: "alarabiya", at: ago(14), headline: "المركزي يبقي الفائدة دون تغيير", tag: "first", isNew: false },
    { sourceId: "sky-arabia", at: ago(10), headline: "التضخم ٣٫١٪ وما زال فوق المستهدف", tag: "number", isNew: false },
    { sourceId: "asharq", at: ago(4), headline: "المحافظ: «أي تحرك مقبل مرهون بالبيانات»", tag: "quote", isNew: false },
    { sourceId: "reuters", at: ago(1), headline: "Markets react to a third straight hold", tag: "reaction", isNew: true },
  ],
  conflicts: [{ field: "نسبة التضخم", values: [{ sourceId: "sky-arabia", value: "٣٫١٪" }, { sourceId: "reuters", value: "٢٫٩٪" }], safeWording: "حوالي ٣٪" }],
  agreed: [{ text: "تثبيت الفائدة للمرة الثالثة", sourceCount: 4 }, { text: "التضخم فوق المستهدف", sourceCount: 3 }, { text: "أي تحرك مرتبط بالبيانات", sourceCount: 2 }],
  confirmedBy: 4,
};
export const breaking = {
  post: "عاجل | البنك المركزي يثبت أسعار الفائدة للمرة الثالثة على التوالي. التفاصيل تتبع.\n#عاجل #البنك_المركزي",
  ticker: "عاجل: المركزي يثبّت الفائدة للمرة الثالثة على التوالي",
  alert: "المركزي يثبّت الفائدة للمرة الثالثة. اضغط للتفاصيل",
  ms: 4200,
};
export const digest = {
  items: [
    { itemId: "n1", title: "المركزي يثبت الفائدة للمرة الثالثة والأسواق تنتظر التضخم", reason: "٣ مصادر · الأكثر تحديثاً" },
    { itemId: "n4", title: "منتخب مصر يعلن قائمة المعسكر مع عودة المحترفين", reason: "مصدرين · متوقع يتفاعل عليه الجمهور" },
  ],
  summaryText: "المركزي يثبت الفائدة للمرة الثالثة، ومنتخب مصر يعلن قائمة المعسكر.",
  sourceCount: 5,
};
