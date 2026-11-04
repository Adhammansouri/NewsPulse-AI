// Motion board (docs/redesign/design/reference/Motion.dc.html, QA target screens/Motion.jpg) inside the dev gallery.
// Markup, inline styles and copy are the board's; the animations are np4's (`typeset`, `arrive`, `tile__check`,
// `scrim` + `sheet`) and the np4 reduced-motion rule turns them all off. Headings sit one level lower than on the
// board because the gallery page already has its h1.
import { useEffect, useRef, useState } from "react";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { Panel } from "@/ui/Panel";
import { Segmented } from "@/ui/Segmented";
import { Sheet } from "@/ui/Sheet";

type WireRow = { t: string; src: string; time?: string; cls: string };

const WIRE_POOL: WireRow[] = [
  { t: "مجلس الأمن يعقد جلسة مغلقة مساء اليوم", src: "الجزيرة نت", cls: "is-breaking" },
  { t: "منصات التواصل تبدأ وسم المحتوى المولّد آلياً", src: "سكاي نيوز عربية", cls: "is-now" },
  { t: "ارتفاع الصادرات غير النفطية ١٢٪ في الربع الثالث", src: "العربية", cls: "is-now" },
];

const WIRE_BASE: WireRow[] = [
  { t: "البنك المركزي يثبت أسعار الفائدة للمرة الثالثة", src: "العربية +٢", time: "قبل ٣ د", cls: "is-now" },
  { t: "اجتماع طارئ لوزراء الخارجية العرب", src: "الجزيرة نت", time: "قبل ١١ د", cls: "is-now" },
  { t: "Oil prices climb after OPEC+ signal", src: "Reuters", time: "قبل ٢٦ د", cls: "is-hour" },
  { t: "منتخب مصر يعلن قائمة المعسكر", src: "العين", time: "قبل ٤٨ د", cls: "is-hour" },
];

const FORMATS = {
  social: { name: "منشور سوشيال", hint: "٤٠–٧٠ كلمة + وسوم", action: "اكتب المنشور" },
  video: { name: "سكريبت فيديو", hint: "هوك + نص + لقطات", action: "اكتب السكريبت" },
  carousel: { name: "كاروسيل", hint: "٤ شرائح + كابشن", action: "اكتب الشرائح" },
} as const;
type Format = keyof typeof FORMATS;

const RANGES = [
  { value: "all", label: "الكل" },
  { value: "hour", label: "ساعة" },
  { value: "today", label: "اليوم" },
] as const;
type Range = (typeof RANGES)[number]["value"];

const CARD = { display: "flex", flexDirection: "column", overflow: "hidden" } as const;
const CARD_HEAD = { padding: "18px 18px 12px", display: "flex", flexDirection: "column", gap: "4px" } as const;
const CARD_FOOT = { padding: "14px 18px" } as const;

export function MotionSection() {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "24px" }} aria-labelledby="ds-motion">
      <header>
        <h2 id="ds-motion" className="t-display">
          الحركة
        </h2>
        <p className="t-meta" style={{ fontSize: "14px" }}>
          أربع حركات فقط، وكلها ردّ على فعل. اضغط على أي زر لإعادة التشغيل.
        </p>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "16px" }}>
        <TypesetCard />
        <WireCard />
        <FormatCard />
        <SheetCard />
      </div>
    </section>
  );
}

function CardHead({ title, text }: { title: string; text: string }) {
  return (
    <div style={CARD_HEAD}>
      <h3 className="t-head">{title}</h3>
      <p className="t-meta">{text}</p>
    </div>
  );
}

/* ١ · typeset reveal: unmount, then remount 60ms later so every block replays its staggered entrance. */
function TypesetCard() {
  const [showType, setShowType] = useState(true);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  function replay() {
    setShowType(false);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setShowType(true), 60);
  }

  return (
    <Panel as="section" style={CARD}>
      <CardHead title="١ · المسودة تتجمّع" text="بعد التوليد: كل جزء يظهر بعد اللي قبله بـ٨٠ ms، مع إزالة ضبابية خفيفة." />
      <div style={{ flex: 1, minHeight: "330px", padding: "6px 18px", background: "var(--surface-2)", borderBlock: "1px solid var(--line)" }}>
        {showType && (
          <div className="typeset" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div className="block">
              <div className="block__label">الخطاف</div>
              <p className="t-head" style={{ fontSize: "17px" }}>
                المركزي يثبّت الفائدة للمرة الثالثة
              </p>
            </div>
            <div className="block">
              <div className="block__label">النص</div>
              <p style={{ fontSize: "14px", lineHeight: 1.8, color: "var(--ink-2)" }}>اللجنة قالت إن التضخم تراجع لكنه ما زال فوق المستهدف.</p>
            </div>
            <div className="block">
              <div className="block__label">الوسوم</div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <span className="tag">#التضخم</span>
                <span className="tag">#اقتصاد</span>
              </div>
            </div>
          </div>
        )}
      </div>
      <div style={CARD_FOOT}>
        <Button variant="ai" block onClick={replay}>
          اكتب المنشور
        </Button>
      </div>
    </Panel>
  );
}

/* ٢ · new-headline drop: the newest row mounts on top with `arrive`; the list keeps five rows. */
function WireCard() {
  const [added, setAdded] = useState(0);

  const fresh: Array<WireRow & { key: string }> = [];
  for (let i = 0; i < added; i++) {
    const p = WIRE_POOL[i % WIRE_POOL.length];
    fresh.unshift({ key: `a${i}`, t: p.t, src: p.src, time: "الآن", cls: p.cls + (i === added - 1 ? " arrive" : "") });
  }
  const wire = [...fresh, ...WIRE_BASE.map((row, j) => ({ ...row, key: `b${j}` }))].slice(0, 5);

  return (
    <Panel as="section" style={CARD}>
      <CardHead title="٢ · وصول عنوان جديد" text="ينزل من فوق بـ spring، ونقطته تنبض مرة. القائمة ما تقفزش تحت إيد المستخدم." />
      <div style={{ flex: 1, minHeight: "330px", overflow: "hidden", background: "var(--surface)", borderBlock: "1px solid var(--line)" }}>
        {wire.map((w) => (
          <div key={w.key} className={`wire-row ${w.cls}`}>
            <span className="tick" aria-hidden="true" />
            <span className="wire-row__meta">
              <span style={{ fontWeight: 600, color: "var(--ink-2)" }}>{w.src}</span>
              <span style={{ flex: 1 }} />
              <span className="num">{w.time}</span>
            </span>
            <span className="wire-row__title" style={{ display: "block", fontSize: "14px" }}>
              {w.t}
            </span>
          </div>
        ))}
      </div>
      <div style={CARD_FOOT}>
        <Button variant="ink" block onClick={() => setAdded((n) => n + 1)}>
          وصل عنوان جديد
        </Button>
      </div>
    </Panel>
  );
}

/* ٣ · format pick: the picked tile turns teal and its check pops in; the CTA follows the format. */
function FormatCard() {
  const [format, setFormat] = useState<Format>("social");

  return (
    <Panel as="section" style={CARD}>
      <CardHead title="٣ · اختيار الصيغة" text="الحد يتحول تيل وعلامة الصح تقفز. زر التوليد يغيّر اسمه حسب الصيغة." />
      <div
        style={{
          flex: 1,
          minHeight: "330px",
          padding: "16px 18px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          background: "var(--surface-2)",
          borderBlock: "1px solid var(--line)",
        }}
      >
        {(Object.keys(FORMATS) as Format[]).map((key) => (
          <button key={key} className="tile tile--row" type="button" aria-pressed={format === key} onClick={() => setFormat(key)}>
            <span style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <span className="tile__name">{FORMATS[key].name}</span>
              <span className="tile__hint">{FORMATS[key].hint}</span>
            </span>
            {format === key && (
              <span className="tile__check" style={{ position: "static" }}>
                <Icon name="check" size="sm" />
              </span>
            )}
          </button>
        ))}
      </div>
      <div style={CARD_FOOT}>
        <Button variant="ai" block>
          {FORMATS[format].action}
        </Button>
      </div>
    </Panel>
  );
}

/* ٤ · mobile sheet: scrim fades in and the sheet springs up; scrim press or Esc closes it. */
function SheetCard() {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<Range>("all");
  const close = () => setOpen(false);

  return (
    <Panel as="section" style={CARD}>
      <CardHead title="٤ · الشيت على الموبايل" text="يطلع من تحت بـ spring بسيط، والخلفية تغمق. يتقفل بالسحب أو الضغط برا." />
      <div style={{ position: "relative", flex: 1, minHeight: "330px", overflow: "hidden", background: "var(--bg)", borderBlock: "1px solid var(--line)" }}>
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }} aria-hidden="true">
          <div className="panel" style={{ height: "60px" }} />
          <div className="panel" style={{ height: "60px" }} />
          <div className="panel" style={{ height: "60px" }} />
        </div>
        <Sheet open={open} onClose={close} scrimLabel="إغلاق" aria-labelledby="ds-motion-sheet" style={{ padding: "0 16px 16px" }}>
          <p id="ds-motion-sheet" className="t-head" style={{ margin: "6px 0 12px" }}>
            تصفية
          </p>
          <Segmented
            options={RANGES}
            value={range}
            onChange={setRange}
            style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
          />
          <Button variant="ink" block style={{ marginTop: "14px" }} onClick={close}>
            عرض ٤ عناوين
          </Button>
        </Sheet>
      </div>
      <div style={CARD_FOOT}>
        <Button variant="quiet" block onClick={() => setOpen(true)}>
          افتح التصفية
        </Button>
      </div>
    </Panel>
  );
}
