// Dev-only UI-kit gallery (S01 §7) — route `/__design`, registered only when `import.meta.env.DEV`.
// Section-by-section port of docs/redesign/design/reference/DesignSystem.dc.html (QA target: screens/DesignSystem.jpg).
// Inline styles are the board's own layout glue; the `.np` root (tokens + theme) comes from AppRoot.
import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { AiPanel } from "@/ui/AiPanel";
import { AiSteps } from "@/ui/AiSteps";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Check } from "@/ui/Check";
import { Chip } from "@/ui/Chip";
import { Field, FieldInput } from "@/ui/Field";
import { Icon } from "@/ui/Icon";
import { IconButton } from "@/ui/IconButton";
import { Meter } from "@/ui/Meter";
import { Notice } from "@/ui/Notice";
import { Panel } from "@/ui/Panel";
import { PulseLine } from "@/ui/PulseLine";
import { Segmented } from "@/ui/Segmented";
import { SourceMarks } from "@/ui/SourceMarks";
import { Switch } from "@/ui/Switch";
import { Toast } from "@/ui/Toast";
import { VersionChip } from "@/ui/VersionChip";
import { BOARD_ICONS, DARK_SWATCHES, LIGHT_SWATCHES, SPACES, type Swatch } from "./boardData";
import { KitExtras } from "./KitExtras";
import { MotionSection } from "./MotionSection";

type Range = "all" | "hour" | "today";
type Topic = "all" | "economy";

export default function DesignGalleryPage() {
  return (
    <div className="m-scroll" style={{ width: "100%", minHeight: "3000px", padding: "56px 64px 72px" }}>
      <div className="col" style={{ maxWidth: "1312px", margin: "0 auto", gap: "52px" }}>
        <BoardHeader />
        <AiIdentitySection />
        <ColorsSection />
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "20px" }}>
          <TypeSection />
          <SpaceSection />
        </div>
        <IconsSection />
        <ComponentsSection />
        <LayoutSection />

        {/* ---- Below this line: not on the DesignSystem board (dev QA only) ---- */}
        <KitExtras />

        <MotionSection />
      </div>
      <ThemeToggle />
    </div>
  );
}

/* ---------------- Header ---------------- */

function BoardHeader() {
  return (
    <header className="row" style={{ gap: "28px", alignItems: "stretch", flexWrap: "wrap" }}>
      <div className="col" style={{ flex: "1 1 520px", gap: "14px", justifyContent: "center" }}>
        <div className="row" style={{ gap: "14px" }}>
          <img src="/logo-icon.png" alt="Newsplus" style={{ width: "60px", height: "60px", borderRadius: "17px" }} />
          <span className="col">
            <span className="t-meta">Newsplus Design System · الإصدار ٤</span>
            <h1 className="t-hero" style={{ fontSize: "44px" }}>
              Pulse
            </h1>
          </span>
        </div>
        <p className="t-body" style={{ maxWidth: "58ch" }}>
          نظام واحد لكل الشاشات، مبني على هوية Newsplus: كحلي للثقة، وتدرّج تيل إلى سماوي مخصص للذكاء الاصطناعي بس، وكورال
          للعاجل. عربي أولاً، فاتح وداكن.
        </p>
      </div>
      <div style={{ flex: "1 1 520px", display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px" }}>
        <Panel className="col" style={{ padding: "18px", gap: "8px" }}>
          <span className="ic-wrap ic-wrap--ai">
            <Icon name="sparkle" />
          </span>
          <b style={{ fontWeight: 600 }}>الذكاء الاصطناعي له لون</b>
          <span className="t-meta">التدرّج يظهر بس على اللي بيعمله المحرّر. المستخدم يعرف فوراً إيه اللي AI.</span>
        </Panel>
        <Panel className="col" style={{ padding: "18px", gap: "8px" }}>
          <span className="ic-wrap">
            <Icon name="check" />
          </span>
          <b style={{ fontWeight: 600 }}>فعل أساسي واحد</b>
          <span className="t-meta">كل شاشة فيها زر رئيسي واحد واضح، والباقي هادي.</span>
        </Panel>
        <Panel className="col" style={{ padding: "18px", gap: "8px" }}>
          <span className="ic-wrap">
            {/* The board's pulse glyph is not part of icons.json — drawn exactly as the reference does. */}
            <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M0 0" />
              <path d="M3 12h4l2-5 3 10 2-6 2 3h5" />
            </svg>
          </span>
          <b style={{ fontWeight: 600 }}>الحركة رد فعل</b>
          <span className="t-meta">مفيش حركة للزينة. كل حركة بتقول إيه اللي اتغيّر.</span>
        </Panel>
      </div>
    </header>
  );
}

/* ---------------- AI identity ---------------- */

function AiIdentitySection() {
  return (
    <section className="col" style={{ gap: "18px" }} aria-labelledby="ds-ai">
      <div className="col">
        <h2 id="ds-ai" className="t-display">
          هوية الذكاء الاصطناعي
        </h2>
        <p className="t-small">كل مكوّن AI يستخدم نفس التدرّج ونفس علامة النجمة. مخصص للأفعال والمخرجات اللي بيعملها المحرّر.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "16px" }}>
        <div
          className="col"
          style={{
            borderRadius: "22px",
            padding: "26px",
            gap: "10px",
            background: "var(--ai)",
            color: "#fff",
            justifyContent: "flex-end",
            minHeight: "220px",
            boxShadow: "var(--glow)",
          }}
        >
          <Icon name="sparkle-double" size="xl" style={{ stroke: "#fff" }} />
          <b style={{ fontFamily: "var(--f-display)", fontSize: "24px" }}>Pulse Gradient</b>
          <span className="num" dir="ltr" style={{ textAlign: "right", opacity: 0.9 }}>
            #0D9B8A → #0EA5E9 · 118°
          </span>
        </div>
        <Panel className="col" style={{ padding: "20px", gap: "14px" }}>
          <span className="t-label">الأفعال</span>
          <Button variant="ai" kbd="Ctrl ↵">
            <Icon name="sparkle" />
            اكتب المنشور
          </Button>
          <div className="row" style={{ flexWrap: "wrap", gap: "6px" }}>
            <Chip as="span" ai size="sm">
              اختصر دون إضافات
            </Chip>
            <Badge variant="ai">منشور سوشيال</Badge>
          </div>
          <span className="ai-mark" style={{ color: "var(--ink-3)" }}>
            <Icon name="sparkle" size="sm" />
            كتبه المحرّر من ٣ مصادر · راجعه قبل النشر
          </span>
        </Panel>
        <AiPanel glow className="col" style={{ padding: "20px", gap: "12px" }}>
          <span className="ai-mark t-ai">المحرّر يكتب الآن</span>
          <PulseLine preset="300x36" />
          <AiSteps
            style={{ gap: "8px" }}
            stepStyle={{ fontSize: "13.5px" }}
            dotStyle={{ width: "20px", height: "20px" }}
            steps={[
              { label: "قرأ ٣ مصادر", status: "done" },
              { label: "يكتب الخطاف", status: "active" },
              { label: "يطبّق أسلوب الفريق", status: "todo" },
            ]}
          />
        </AiPanel>
      </div>
    </section>
  );
}

/* ---------------- Colors ---------------- */

function SwatchCard({ swatch, inset }: { swatch: Swatch; inset: boolean }) {
  return (
    <Panel style={{ overflow: "hidden" }}>
      <div
        style={{
          height: "72px",
          background: swatch.hex,
          boxShadow: inset ? "inset 0 -1px 0 rgb(0 0 0 / .06)" : undefined,
        }}
      />
      <div className="col" style={{ padding: "10px 12px", gap: "1px" }}>
        <b style={{ fontSize: "13.5px" }}>{swatch.name}</b>
        <span className="t-meta num" dir="ltr" style={{ textAlign: "right" }}>
          {swatch.hex}
        </span>
        <span className="t-meta">{swatch.role}</span>
      </div>
    </Panel>
  );
}

function ColorsSection() {
  const grid = { display: "grid", gridTemplateColumns: "repeat(8, minmax(0, 1fr))", gap: "10px" } as const;
  return (
    <section className="col" style={{ gap: "18px" }} aria-labelledby="ds-color">
      <h2 id="ds-color" className="t-display">
        الألوان
      </h2>
      <div className="col" style={{ gap: "10px" }}>
        <span className="t-label">الوضع الفاتح</span>
        <div style={grid}>
          {LIGHT_SWATCHES.map((s) => (
            <SwatchCard key={s.hex} swatch={s} inset />
          ))}
        </div>
        <span className="t-label" style={{ marginTop: "8px" }}>
          الوضع الداكن · كحلي ليلي، مش أسود
        </span>
        <div style={grid}>
          {DARK_SWATCHES.map((s) => (
            <SwatchCard key={s.hex} swatch={s} inset={false} />
          ))}
        </div>
      </div>
      <Panel className="row" style={{ padding: "16px 20px", gap: "24px", flexWrap: "wrap" }}>
        <span className="col" style={{ minWidth: "200px" }}>
          <b style={{ fontWeight: 600 }}>مؤشر عمر الخبر</b>
          <span className="t-meta">نقطة على العمود الزمني في كل قائمة أخبار</span>
        </span>
        <span className="row" style={{ fontSize: "14px" }}>
          <span
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "#ef6c57",
              boxShadow: "0 0 0 4px var(--breaking-soft)",
            }}
          />
          عاجل
        </span>
        <span className="row" style={{ fontSize: "14px" }}>
          <span
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "var(--fresh-now)",
              boxShadow: "0 0 0 4px var(--teal-soft)",
            }}
          />
          أقل من ٢٠ دقيقة
        </span>
        <span className="row" style={{ fontSize: "14px" }}>
          <span style={{ width: "12px", height: "12px", borderRadius: "50%", border: "2px solid var(--fresh-hour)" }} />
          أقل من ساعة
        </span>
        <span className="row" style={{ fontSize: "14px" }}>
          <span style={{ width: "12px", height: "12px", borderRadius: "50%", border: "2px solid var(--fresh-old)" }} />
          أقدم
        </span>
        <span className="row" style={{ fontSize: "14px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--cyan-dot)" }} />
          له مسودة جاهزة
        </span>
      </Panel>
    </section>
  );
}

/* ---------------- Type ---------------- */

function TypeSection() {
  return (
    <Panel as="section" className="col" style={{ padding: "24px 28px", gap: "16px" }} aria-labelledby="ds-type">
      <h2 id="ds-type" className="t-display">
        الخطوط
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px" }}>
        <Panel flat className="col" style={{ padding: "16px", background: "var(--surface-2)" }}>
          <span style={{ fontFamily: "var(--f-display)", fontSize: "40px", fontWeight: 700, lineHeight: 1.2 }}>أبجد</span>
          <b style={{ fontWeight: 600 }}>Alexandria</b>
          <span className="t-meta">العناوين الكبيرة، الأرقام، عنوان المسودة</span>
        </Panel>
        <Panel flat className="col" style={{ padding: "16px", background: "var(--surface-2)" }}>
          <span style={{ fontSize: "40px", fontWeight: 600, lineHeight: 1.2 }}>أبجد</span>
          <b style={{ fontWeight: 600 }}>IBM Plex Sans Arabic</b>
          <span className="t-meta">الواجهة والنصوص والقوائم</span>
        </Panel>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "12px 18px", alignItems: "baseline" }}>
        <span className="t-meta num">Hero · 34/700</span>
        <p className="t-hero">صباح الخير، سارة</p>
        <span className="t-meta num">Display · 26/700</span>
        <p className="t-display">المركزي يثبّت الفائدة</p>
        <span className="t-meta num">Title · 20/600</span>
        <p className="t-title">عنوان شاشة</p>
        <span className="t-meta num">Head · 16/600</span>
        <p className="t-head">عنوان خبر في القائمة</p>
        <span className="t-meta num">Body · 16/400 · 1.85</span>
        <p className="t-body">نص القراءة بمسافة سطور واسعة لأن العربية تحتاجها، ولا يزيد السطر عن ٦٦ حرفاً.</p>
        <span className="t-meta num">Meta · 12.5/400</span>
        <p className="t-meta">العربية · قبل ٣ دقائق</p>
      </div>
    </Panel>
  );
}

/* ---------------- Space & depth ---------------- */

function SpaceSection() {
  return (
    <Panel as="section" className="col" style={{ padding: "24px 28px", gap: "18px" }} aria-labelledby="ds-space">
      <h2 id="ds-space" className="t-display">
        المسافات والعمق
      </h2>
      <div className="row" style={{ alignItems: "flex-end", gap: "10px" }}>
        {SPACES.map((n) => (
          <div key={n} className="col" style={{ alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: `${n}px`,
                height: `${n}px`,
                background: "var(--ai-soft)",
                border: "1px solid var(--cyan-dot)",
                borderRadius: "4px",
              }}
            />
            <span className="t-meta num">{n}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "10px" }}>
        <div className="col" style={{ gap: "6px" }}>
          <div style={{ height: "52px", border: "2px solid var(--ink-3)", borderRadius: "11px" }} />
          <span className="t-meta">١١ · أزرار</span>
        </div>
        <div className="col" style={{ gap: "6px" }}>
          <div style={{ height: "52px", border: "2px solid var(--ink-3)", borderRadius: "16px" }} />
          <span className="t-meta">١٦ · بطاقات</span>
        </div>
        <div className="col" style={{ gap: "6px" }}>
          <div style={{ height: "52px", border: "2px solid var(--ink-3)", borderRadius: "20px" }} />
          <span className="t-meta">٢٠ · ألواح</span>
        </div>
        <div className="col" style={{ gap: "6px" }}>
          <div
            style={{ height: "52px", border: "2px solid var(--ink-3)", borderRadius: "28px 28px 0 0", borderBottom: 0 }}
          />
          <span className="t-meta">٢٨ · شيت</span>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "12px" }}>
        <div className="col" style={{ gap: "6px" }}>
          <div style={{ height: "56px", borderRadius: "14px", background: "var(--surface)", boxShadow: "var(--shadow-1)" }} />
          <span className="t-meta">١ · ثابت</span>
        </div>
        <div className="col" style={{ gap: "6px" }}>
          <div style={{ height: "56px", borderRadius: "14px", background: "var(--surface)", boxShadow: "var(--shadow-2)" }} />
          <span className="t-meta">٢ · مرفوع</span>
        </div>
        <div className="col" style={{ gap: "6px" }}>
          <div style={{ height: "56px", borderRadius: "14px", background: "var(--surface)", boxShadow: "var(--shadow-3)" }} />
          <span className="t-meta">٣ · طافي</span>
        </div>
        <div className="col" style={{ gap: "6px" }}>
          <div style={{ height: "56px", borderRadius: "14px", background: "var(--surface)", boxShadow: "var(--glow)" }} />
          <span className="t-meta">توهّج AI</span>
        </div>
      </div>
      <p className="t-meta">شبكة ٤ بكسل · أي عنصر يُضغط لا يقل عن ٤٤ بكسل</p>
    </Panel>
  );
}

/* ---------------- Icons ---------------- */

function IconsSection() {
  return (
    <section className="col" style={{ gap: "18px" }} aria-labelledby="ds-icons">
      <div className="col">
        <h2 id="ds-icons" className="t-display">
          الأيقونات
        </h2>
        <p className="t-small">خط واحد ١٫٧٥، زوايا دائرية، شبكة ٢٤. الأيقونة النشطة في التنقل تاخد لون التيل.</p>
      </div>
      <Panel style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(10, minmax(0, 1fr))", gap: "8px" }}>
        {BOARD_ICONS.map((icon) => (
          <div
            key={icon.name}
            className="col"
            style={{ alignItems: "center", gap: "8px", padding: "12px 4px", borderRadius: "12px", background: "var(--surface-2)" }}
          >
            <Icon
              name={icon.name}
              size="lg"
              ai={icon.ai}
              style={icon.ai ? undefined : { stroke: "currentColor" }}
            />
            <span className="t-meta" style={{ fontSize: "11.5px" }}>
              {icon.n}
            </span>
          </div>
        ))}
      </Panel>
    </section>
  );
}

/* ---------------- Components & states ---------------- */

function ComponentsSection() {
  const [range, setRange] = useState<Range>("all");
  const [topic, setTopic] = useState<Topic>("all");
  const [switchOn, setSwitchOn] = useState(true);
  const [switchOff, setSwitchOff] = useState(false);

  return (
    <section className="col" style={{ gap: "18px" }} aria-labelledby="ds-comp">
      <h2 id="ds-comp" className="t-display">
        المكونات وحالاتها
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "16px" }}>
        <Panel className="col" style={{ padding: "20px", gap: "12px" }}>
          <h3 className="t-label">الأزرار</h3>
          <div className="row" style={{ flexWrap: "wrap" }}>
            <Button variant="ai">AI</Button>
            <Button variant="ink">أساسي</Button>
            <Button variant="quiet">ثانوي</Button>
            <Button variant="ghost">هادي</Button>
          </div>
          <div className="row" style={{ flexWrap: "wrap" }}>
            <Button variant="danger" size="sm">
              حذف
            </Button>
            <Button variant="ink" size="sm" disabled>
              معطّل
            </Button>
            <IconButton line label="تنزيل" icon="download" />
          </div>
          <p className="t-meta">زر AI واحد في الشاشة. الأساسي الكحلي للأفعال العادية زي النسخ والدخول.</p>
        </Panel>

        <Panel className="col" style={{ padding: "20px", gap: "10px" }}>
          <h3 className="t-label">حقول الإدخال</h3>
          <Field>
            <FieldInput placeholder="عادي" aria-label="عادي" />
          </Field>
          <Field state="focus">
            <FieldInput defaultValue="تركيز" aria-label="تركيز" />
          </Field>
          <Field state="valid">
            <Icon name="check" size="sm" style={{ color: "var(--teal)" }} />
            <FieldInput defaultValue="https://alarabiya.net/…" dir="ltr" aria-label="صالح" />
          </Field>
          <Field state="error" hint="الرابط غير صالح. أكمله أو اكتب موضوعاً.">
            <FieldInput defaultValue="رابط ناقص" aria-label="خطأ" />
          </Field>
        </Panel>

        <Panel className="col" style={{ padding: "20px", gap: "12px" }}>
          <h3 className="t-label">الاختيار</h3>
          <Segmented<Range>
            value={range}
            onChange={setRange}
            options={[
              { value: "all", label: "الكل" },
              { value: "hour", label: "ساعة" },
              { value: "today", label: "اليوم" },
            ]}
          />
          <div className="row" style={{ flexWrap: "wrap", gap: "6px" }}>
            <Chip pressed={topic === "all"} count="١٠" onClick={() => setTopic("all")}>
              الكل
            </Chip>
            <Chip pressed={topic === "economy"} count="٣" onClick={() => setTopic("economy")}>
              اقتصاد
            </Chip>
          </div>
          <div className="row" style={{ gap: "16px" }}>
            <Switch checked={switchOn} onCheckedChange={setSwitchOn} label="مفعّل" />
            <Switch checked={switchOff} onCheckedChange={setSwitchOff} label="موقوف" />
            <Check checked />
            <Check checked={false} />
          </div>
        </Panel>

        <Panel className="col" style={{ padding: "20px", gap: "12px" }}>
          <h3 className="t-label">الشارات والعلامات</h3>
          <div className="row" style={{ flexWrap: "wrap", gap: "6px" }}>
            <Badge variant="breaking">عاجل</Badge>
            <Badge variant="ai">AI</Badge>
            <Badge variant="teal">من الصفحة</Badge>
            <Badge variant="topic">اقتصاد</Badge>
            <Badge variant="warn">راجعها</Badge>
            <Badge variant="ok">جاهزة</Badge>
            <Badge variant="count">٣</Badge>
          </div>
          <div className="row" style={{ gap: "10px" }}>
            <SourceMarks
              marks={[
                { ch: "ع", bg: "#0f6e5d" },
                { ch: "س", bg: "#1d4ed8" },
                { ch: "ش", bg: "#c2410c" },
              ]}
            />
            <VersionChip>ن١</VersionChip>
            <VersionChip current>ن٢</VersionChip>
            <span className="live">مباشر</span>
          </div>
        </Panel>

        {/* Wire row, format tile, draft blocks and the editor dock are later-sprint components (S04–S06): board markup as-is. */}
        <Panel className="col" style={{ overflow: "hidden" }}>
          <h3 className="t-label" style={{ padding: "16px 20px 8px" }}>
            صف الخبر
          </h3>
          <div className="wire-row is-breaking" aria-pressed="true">
            <span className="tick" />
            <span className="wire-row__meta">
              <span style={{ fontWeight: 600, color: "var(--ink-2)" }}>مختار</span>
              <span className="grow" />
              <span>عاجل</span>
            </span>
            <span className="wire-row__title" style={{ fontSize: "14px" }}>
              البنك المركزي يثبت الفائدة
            </span>
          </div>
          <div className="wire-row is-now has-draft">
            <span className="tick" />
            <span className="wire-row__meta">
              <span style={{ fontWeight: 600, color: "var(--ink-2)" }}>جديد + مسودة</span>
            </span>
            <span className="wire-row__title" style={{ fontSize: "14px" }}>
              اجتماع طارئ لوزراء الخارجية
            </span>
          </div>
          <div className="wire-row" style={{ borderBottom: 0 }}>
            <span className="tick" />
            <span className="wire-row__meta">
              <span style={{ fontWeight: 600, color: "var(--ink-2)" }}>أقدم</span>
            </span>
            <span className="wire-row__title" style={{ fontSize: "14px" }}>
              مهرجان القاهرة السينمائي
            </span>
          </div>
        </Panel>

        <Panel className="col" style={{ padding: "20px", gap: "10px" }}>
          <h3 className="t-label">بطاقة الصيغة</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px" }}>
            <button className="tile" type="button" aria-pressed="false" style={{ padding: "10px" }}>
              <span className="tile__shape" style={{ height: "60px" }}>
                <svg width="40" height="40" viewBox="0 0 64 64" aria-hidden="true">
                  <rect x="20" y="4" width="24" height="56" rx="6" fill="none" stroke="currentColor" strokeWidth="2.5" />
                  <path d="M29 25l9 6-9 6z" fill="currentColor" />
                </svg>
              </span>
              <span className="tile__name">عادي</span>
            </button>
            <button className="tile" type="button" aria-pressed="true" style={{ padding: "10px" }}>
              <span className="tile__shape" style={{ height: "60px" }}>
                <svg width="40" height="40" viewBox="0 0 64 64" aria-hidden="true">
                  <rect x="14" y="8" width="36" height="48" rx="6" fill="none" stroke="currentColor" strokeWidth="2.5" />
                  <rect x="19" y="13" width="26" height="20" rx="3" fill="currentColor" opacity=".25" />
                </svg>
              </span>
              <span className="tile__name">مختار</span>
              <span className="tile__check">
                <Icon name="check" size="sm" />
              </span>
            </button>
          </div>
        </Panel>

        <Panel className="col" style={{ padding: "20px", gap: "6px" }}>
          <h3 className="t-label">أجزاء المسودة</h3>
          <div className="block" style={{ margin: 0 }}>
            <div className="block__label">
              عادي
              <button className="block__copy" type="button">
                نسخ
              </button>
            </div>
            <p style={{ fontSize: "14px" }}>كل جزء يُنسخ لوحده</p>
          </div>
          <div className="block is-changed" style={{ margin: 0 }}>
            <div className="block__label">
              اتعدّل في ن٢
              <button className="block__copy is-done" type="button">
                تم النسخ
              </button>
            </div>
            <p style={{ fontSize: "14px" }}>الجزء اللي غيّره المحرّر يتظلل</p>
          </div>
        </Panel>

        <Panel className="col" style={{ padding: "20px", gap: "10px" }}>
          <h3 className="t-label">المحرّر</h3>
          <p className="msg msg--me" style={{ maxWidth: "100%" }}>
            اجعل الخطاف سؤالاً
          </p>
          <p className="msg msg--ai" style={{ maxWidth: "100%" }}>
            تم. النسخة ٢ محفوظة.
          </p>
          <label className="dock__input">
            <span className="sr">اطلب تعديلاً</span>
            <textarea rows={1} placeholder="اطلب تعديلاً…" />
            <button className="send" type="button" aria-label="إرسال">
              <Icon name="send" />
            </button>
          </label>
        </Panel>

        <Panel className="col" style={{ padding: "20px", gap: "10px" }}>
          <h3 className="t-label">الرسائل والتقدّم</h3>
          <Toast style={{ animation: "none", alignSelf: "flex-start" }}>نُسخ المنشور</Toast>
          <Notice variant="warn" style={{ padding: "10px 12px", fontSize: "13.5px" }}>
            تنبيه قابل للإصلاح، ومعاه الخطوة الجاية
          </Notice>
          <Meter value={62} />
        </Panel>
      </div>
    </section>
  );
}

/* ---------------- Layout ---------------- */

function LayoutSection() {
  const centered = { alignItems: "center", justifyContent: "center", gap: "4px" } as const;
  return (
    <section className="col" style={{ gap: "18px" }} aria-labelledby="ds-layout">
      <h2 id="ds-layout" className="t-display">
        تقسيم المساحة
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "20px", alignItems: "start" }}>
        <div className="col" style={{ gap: "8px" }}>
          <div
            className="row"
            style={{ height: "260px", gap: 0, borderRadius: "18px", overflow: "hidden", border: "1px solid var(--line)" }}
            dir="rtl"
          >
            <div
              className="col"
              style={{
                width: "7%",
                background: "var(--navy)",
                color: "#fff",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                textAlign: "center",
              }}
            >
              الشريط
              <br />٨٨
            </div>
            <div
              className="col"
              style={{ width: "29%", background: "var(--surface)", borderInlineStart: "1px solid var(--line)", ...centered }}
            >
              <b style={{ fontWeight: 600 }}>العناوين</b>
              <span className="t-meta">٤٢٠ ثابت</span>
            </div>
            <div className="col grow" style={{ background: "var(--bg)", ...centered }}>
              <b style={{ fontWeight: 600 }}>الخبر والمسودة</b>
              <span className="t-meta">مرن · الأوسع</span>
            </div>
            <div
              className="col"
              style={{ width: "24%", background: "var(--surface)", borderInlineEnd: "1px solid var(--line)", ...centered }}
            >
              <b className="t-ai" style={{ fontWeight: 600 }}>
                المحرّر
              </b>
              <span className="t-meta">٣٤٤ · يظهر مع المسودة</span>
            </div>
          </div>
          <p className="t-meta">ديسكتوب ١٤٤٠: الفلاتر صفين بدل أربعة، فبيظهر ٧ عناوين بدل ٣.</p>
        </div>
        <div className="col" style={{ gap: "8px", alignItems: "center" }}>
          <div
            className="col"
            style={{ width: "150px", height: "260px", borderRadius: "22px", overflow: "hidden", border: "1px solid var(--line)" }}
          >
            <div
              style={{
                height: "22px",
                background: "var(--surface)",
                borderBottom: "1px solid var(--line)",
                fontSize: "10px",
                textAlign: "center",
                lineHeight: "22px",
              }}
            >
              الشريط العلوي
            </div>
            <div className="grow" style={{ background: "var(--bg)", display: "grid", placeItems: "center", fontSize: "11px" }}>
              المحتوى
            </div>
            <div
              style={{
                height: "24px",
                background: "var(--surface)",
                borderTop: "1px solid var(--line)",
                fontSize: "10px",
                textAlign: "center",
                lineHeight: "24px",
              }}
            >
              التابات · توليد في النص
            </div>
          </div>
          <p className="t-meta" style={{ textAlign: "center" }}>
            موبايل: تابات تحت، وزر التوليد في النص
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Theme toggle (dev control, not on the board) ---------------- */

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Segmented
      role="group"
      aria-label="المظهر"
      value={theme}
      onChange={setTheme}
      options={[
        { value: "light", label: "فاتح" },
        { value: "dark", label: "داكن" },
      ]}
      style={{ position: "fixed", bottom: "16px", insetInlineStart: "16px", zIndex: 10 }}
    />
  );
}
