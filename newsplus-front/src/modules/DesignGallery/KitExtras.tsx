// UI-kit components that the DesignSystem board does not show (dev QA only).
// Each card reproduces a fragment of the board named in its caption — markup, inline styles and copy as-is.
// The English captions are gallery labels, not product copy.
import { useRef, useState, type ReactNode } from "react";
import { Button } from "@/ui/Button";
import { Dialog } from "@/ui/Dialog";
import { Drawer } from "@/ui/Drawer";
import { EmptyState } from "@/ui/EmptyState";
import { Field, FieldInput } from "@/ui/Field";
import { Icon, type IconName } from "@/ui/Icon";
import { IconButton } from "@/ui/IconButton";
import { Key } from "@/ui/Key";
import { Notice } from "@/ui/Notice";
import { Panel } from "@/ui/Panel";
import { Popover } from "@/ui/Popover";
import { PULSE_LINE_PRESETS, PulseLine, type PulseLinePreset } from "@/ui/PulseLine";
import { Ring } from "@/ui/Ring";
import { Segmented } from "@/ui/Segmented";
import { Sheet } from "@/ui/Sheet";
import { Skeleton } from "@/ui/Skeleton";
import { SourceMark } from "@/ui/SourceMarks";
import { Badge } from "@/ui/Badge";
import { AiSteps } from "@/ui/AiSteps";
import { Toast, ToastProvider, ToastRegion, useToast } from "@/ui/Toast";

/* ---------- shared gallery glue ---------- */

function Caption({ name, board }: { name: string; board: string }) {
  return (
    <span className="col" dir="ltr" style={{ textAlign: "right" }}>
      <span className="t-label">{name}</span>
      <span className="t-meta">{board}</span>
    </span>
  );
}

/** Motion-board demo card: caption, a positioned stage the overlay covers, trigger in the footer. */
function Stage({ caption, stage, footer }: { caption: ReactNode; stage: ReactNode; footer: ReactNode }) {
  return (
    <Panel as="section" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "18px 18px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>{caption}</div>
      <div
        style={{
          position: "relative",
          flex: 1,
          minHeight: "540px",
          overflow: "hidden",
          background: "var(--bg)",
          borderBlock: "1px solid var(--line)",
        }}
      >
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }} aria-hidden="true">
          <div className="panel" style={{ height: "60px" }} />
          <div className="panel" style={{ height: "60px" }} />
          <div className="panel" style={{ height: "60px" }} />
        </div>
        {stage}
      </div>
      <div style={{ padding: "14px 18px" }}>{footer}</div>
    </Panel>
  );
}

const GRID3 = { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "16px" } as const;

/* ---------- States board data ---------- */

const NEWS_PATH = "M4 5h13v14H5a1 1 0 0 1-1-1zM17 9h3v9a1 1 0 0 1-2 0M7 9h7M7 13h7";

const EMPTIES: Array<{
  title: string;
  text: string;
  cta: string;
  btn: "quiet" | "ai" | "ghost";
  art?: string;
  icon: IconName | "news-short";
}> = [
  { title: "لا عناوين بهذا الفلتر", text: "مفيش أخبار في آخر ٢٠ دقيقة عن الاقتصاد من المصادر المختارة.", cta: "وسّع الوقت لساعة", btn: "quiet", icon: "news-short" },
  { title: "ابدأ أول مسودة", text: "اختار خبر من العناوين، والمحرّر يكتب لك منشور أو سكريبت أو كاروسيل.", cta: "افتح العناوين", btn: "ai", art: "ic-wrap--ai", icon: "sparkle" },
  { title: "مفيش نتائج في الأرشيف", text: "جرّب كلمة أقصر، أو ابحث بجزء من العنوان.", cta: "امسح البحث", btn: "quiet", icon: "search" },
  { title: "ذاكرة الفريق فاضية", text: "لما تعدّل المسودات، المحرّر هيقترح قواعد تتطبّق على كل الفريق.", cta: "اعرف أكتر", btn: "ghost", icon: "memory" },
];

const ERRORS: Array<{ variant: "error" | "warn"; ic: string; title: string; text: string; cta: string; icon: IconName }> = [
  { variant: "error", ic: "ic-wrap--breaking", title: "تعذّر جلب العناوين", text: "السيرفر مش بيرد. العناوين القديمة لسه ظاهرة.", cta: "حاول تاني", icon: "refresh" },
  { variant: "error", ic: "ic-wrap--breaking", title: "المحرّر ما قدرش يكمّل", text: "نموذج الذكاء الاصطناعي ما ردّش. اختيارك محفوظ.", cta: "أعد المحاولة", icon: "warning" },
  { variant: "warn", ic: "ic-wrap--warn", title: "رصيد OpenAI خلص", text: "التوليد متوقف لحد ما يتشحن الرصيد من صفحة الفوترة.", cta: "اشحن الرصيد", icon: "card" },
  { variant: "warn", ic: "ic-wrap--warn", title: "طلبات كتير في وقت قصير", text: "استخدمت ٢٤ طلب في ربع ساعة. تقدر تكمّل بعد ٤ دقائق.", cta: "تمام", icon: "clock" },
];

/** States «رسائل التأكيد» — some icons are trimmed variants of icons.json glyphs, drawn as the board does. */
const TOASTS: Array<{ text: string; path: string; undo: boolean }> = [
  { text: "نُسخ المنشور كاملاً", path: "M5 12l5 5 9-10", undo: false },
  { text: "النسخة ٣ محفوظة", path: "M5 12l5 5 9-10", undo: false },
  { text: "رجعت للنسخة ١", path: "M3 12a9 9 0 1 0 3-6.7M3 4v5h5", undo: true },
  {
    text: "القاعدة اتحفظت لذاكرة الفريق",
    path: "M12 3a6 6 0 0 1 6 6c0 2.2-1.2 3.6-2.5 4.7-.7.6-1 1.3-1 2.1V17h-5v-1.2c0-.8-.3-1.5-1-2.1C7.2 12.6 6 11.2 6 9a6 6 0 0 1 6-6z",
    undo: true,
  },
  { text: "وصل إشعار التجربة", path: "M6 16V11a6 6 0 0 1 12 0v5l2 2H4z", undo: false },
  { text: "المسودة جاهزة: منشور سوشيال", path: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z", undo: false },
];

function ToastGlyph({ path }: { path: string }) {
  return (
    <svg className="ic" viewBox="0 0 24 24" aria-hidden="true" style={{ color: "#5eead4" }}>
      <path d={path} />
    </svg>
  );
}

/* ---------- Main board sources (filters popover) ---------- */

const SOURCES = [
  { ch: "ع", bg: "#0f6e5d", name: "العربية", on: true },
  { ch: "س", bg: "#1d4ed8", name: "سكاي نيوز عربية", on: true },
  { ch: "ج", bg: "#a16207", name: "الجزيرة نت", on: false },
  { ch: "B", bg: "#b91c1c", name: "BBC عربي", on: false },
  { ch: "ش", bg: "#c2410c", name: "الشرق", on: false },
  { ch: "R", bg: "#c2410c", name: "Reuters", on: false },
];

const SMALL_PULSES: PulseLinePreset[] = ["286x44", "256x40", "120x28", "90x24", "80x24", "64x20", "60x20", "54x20"];

/* ---------- section ---------- */

export function KitExtras() {
  return (
    <section className="col" style={{ gap: "18px" }} aria-labelledby="ds-kit-extras">
      <div className="col" dir="ltr" style={{ textAlign: "right" }}>
        <h2 id="ds-kit-extras" className="t-display">
          UI kit · not on this board
        </h2>
        <p className="t-small">Dev QA only. Each card copies the board named under its title.</p>
      </div>

      <div style={{ ...GRID3, alignItems: "start" }}>
        <LoadingCards />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "16px" }}>
        {EMPTIES.map((e) => (
          <EmptyState
            key={e.title}
            className="panel"
            style={{ padding: "28px 20px" }}
            artClassName={e.art}
            art={
              e.icon === "news-short" ? (
                <svg className="ic ic--xl" viewBox="0 0 24 24" aria-hidden="true">
                  <path d={NEWS_PATH} />
                </svg>
              ) : (
                <Icon name={e.icon} size="xl" />
              )
            }
            titleAs="h3"
            titleClassName="t-head"
            title={e.title}
            description={e.text}
          >
            <Button variant={e.btn} size="sm">
              {e.cta}
            </Button>
          </EmptyState>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "14px" }}>
        {ERRORS.map((e) => (
          <Notice
            key={e.title}
            variant={e.variant}
            role="alert"
            style={{ alignItems: "center" }}
            icon={
              <span className={`ic-wrap ${e.ic}`} style={{ background: "var(--surface)" }}>
                <Icon name={e.icon} />
              </span>
            }
            textClassName="col grow"
            action={
              <Button variant="quiet" size="sm">
                {e.cta}
              </Button>
            }
          >
            <b style={{ fontWeight: 600 }}>{e.title}</b>
            <span className="t-small">{e.text}</span>
          </Notice>
        ))}
      </div>

      <div className="row" style={{ flexWrap: "wrap", gap: "14px" }}>
        {TOASTS.map((t) => (
          <Toast
            key={t.text}
            style={{ animation: "none" }}
            icon={<ToastGlyph path={t.path} />}
            action={t.undo ? { onAction: () => undefined } : undefined}
          >
            {t.text}
          </Toast>
        ))}
      </div>

      <div style={GRID3}>
        <SmallPiecesCards />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" }}>
        <ToastDemo />
        <PopoverDemo />
        <SheetDemo />
        <DialogDemo />
        <DrawerDemo />
      </div>
    </section>
  );
}

/* ---------- States «التحميل» + DeskLogin loading ---------- */

function LoadingCards() {
  return (
    <>
      <Panel className="col" style={{ overflow: "hidden" }}>
        <div className="col" style={{ height: "224px", overflow: "hidden" }}>
          {["88%", "72%", "80%"].map((w) => (
            <div
              key={w}
              className="col"
              style={{ gap: "8px", padding: "14px 18px", paddingInlineStart: "30px", borderBottom: "1px solid var(--line)" }}
            >
              <div className="row">
                <Skeleton width="22px" height="22px" radius="7px" />
                <Skeleton height="10px" width="30%" />
              </div>
              <Skeleton height="13px" width={w} />
            </div>
          ))}
        </div>
        <div className="col" style={{ padding: "14px 16px", gap: "2px" }}>
          <span className="t-head">تحميل العناوين</span>
          <span className="t-meta">هيكل بنفس شكل صف الخبر، مش دايرة بتلف</span>
        </div>
      </Panel>

      <Panel className="col" style={{ overflow: "hidden" }}>
        <div className="col" style={{ height: "224px", padding: "18px", gap: "14px", justifyContent: "center" }}>
          <span className="ai-mark t-ai">المحرّر يكتب الآن</span>
          <PulseLine preset="360x40" />
          <AiSteps
            style={{ gap: "8px" }}
            stepStyle={{ fontSize: "13px" }}
            dotStyle={{ width: "20px", height: "20px" }}
            steps={[
              { label: "قرأ ٣ مصادر", status: "done" },
              { label: "يكتب المنشور", status: "active" },
            ]}
          />
        </div>
        <div className="col" style={{ padding: "14px 16px", gap: "2px" }}>
          <span className="t-head">الذكاء الاصطناعي يشتغل</span>
          <span className="t-meta">نبضة + خطوات حقيقية، عشان المستخدم يعرف بيستنى إيه</span>
        </div>
      </Panel>

      <Panel className="col" style={{ padding: "20px", gap: "12px" }}>
        <Caption name="Button loading · PulseLine presets" board="DeskLogin (loading) · every board pulse" />
        <Button variant="ink" size="lg" block loading>
          جاري الدخول…
        </Button>
        <div className="col" style={{ gap: "8px" }}>
          {SMALL_PULSES.map((preset) => (
            <div key={preset} className="row" style={{ justifyContent: "space-between" }}>
              <span className="t-meta num" dir="ltr">
                {preset}
              </span>
              <PulseLine preset={preset} />
            </div>
          ))}
          {(["320x44", "300x36"] as const).map((preset) => (
            <div key={preset} className="col" style={{ gap: "4px" }}>
              <span className="t-meta num" dir="ltr">
                {preset} · {PULSE_LINE_PRESETS[preset].fluid ? "fluid" : "fixed"}
              </span>
              <PulseLine preset={preset} />
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}

/* ---------- Ring · Key · Field ---------- */

function SmallPiecesCards() {
  const [range, setRange] = useState("all");
  return (
    <>
      <Panel className="col" style={{ padding: "20px", gap: "12px" }}>
        <Caption name="Ring" board="MobNewPreview · NewPublish" />
        <div className="row" style={{ gap: "12px" }}>
          <Ring value={11}>٢٤٨</Ring>
          <span className="col grow">
            <b style={{ fontSize: "14px" }}>طول مناسب لإنستجرام</b>
            <span className="t-meta">أول سطرين بس اللي بيظهروا</span>
          </span>
        </div>
        <div className="row" style={{ gap: "12px" }}>
          <Ring value={89} color="var(--warn-dot)">
            ٢٤٨
          </Ring>
          <span className="col grow">
            <b style={{ fontSize: "14px" }}>٢٤٨ من ٢٨٠ حرف</b>
            <span className="t-meta">قريب من الحد · الوسوم محسوبة</span>
          </span>
        </div>
      </Panel>

      <Panel className="col" style={{ padding: "20px", gap: "12px" }}>
        <Caption name="Key" board="NewShortcuts" />
        <div
          className="row"
          style={{ justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--line)" }}
        >
          <span className="t-small" style={{ color: "var(--ink)" }}>
            لوحة الأوامر
          </span>
          <span className="row" dir="ltr" style={{ gap: "4px" }}>
            <Key>Ctrl</Key>
            <Key>K</Key>
          </span>
        </div>
        <div
          className="row"
          style={{ justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--line)" }}
        >
          <span className="t-small" style={{ color: "var(--ink)" }}>
            البحث في العناوين
          </span>
          <span className="row" dir="ltr" style={{ gap: "4px" }}>
            <Key>/</Key>
          </span>
        </div>
        <span className="row t-meta" style={{ gap: "6px" }}>
          اقفل <Key>Esc</Key>
        </span>
      </Panel>

      <Panel className="col" style={{ padding: "20px", gap: "12px" }}>
        <Caption name="Field sunken · Segmented block" board="Main" />
        <Field as="label" sunken>
          <Icon name="search" />
          <span className="sr">بحث في العناوين</span>
          <FieldInput type="search" placeholder="ابحث في العناوين…" />
          <span className="kbd" style={{ background: "var(--surface)", color: "var(--ink-3)" }}>
            /
          </span>
        </Field>
        <Segmented
          block
          role="group"
          aria-label="الوقت"
          value={range}
          onChange={setRange}
          options={[
            { value: "all", label: "الكل" },
            { value: "20m", label: "٢٠ د" },
            { value: "1h", label: "ساعة" },
            { value: "3h", label: "٣ س" },
            { value: "today", label: "اليوم" },
          ]}
        />
      </Panel>
    </>
  );
}

/* ---------- Toast (live) ---------- */

function ToastButtons() {
  const toast = useToast();
  return (
    <div className="row" style={{ flexWrap: "wrap" }}>
      <Button variant="quiet" size="sm" onClick={() => toast.show("نُسخ المنشور كاملاً")}>
        نُسخ المنشور كاملاً
      </Button>
      <Button
        variant="quiet"
        size="sm"
        onClick={() =>
          toast.show("رجعت للنسخة ١", {
            icon: <ToastGlyph path="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" />,
            action: { onAction: () => toast.show("النسخة ٣ محفوظة") },
          })
        }
      >
        رجعت للنسخة ١
      </Button>
    </div>
  );
}

function ToastDemo() {
  return (
    <ToastProvider region={false}>
      <Stage
        caption={<Caption name="Toast · useToast()" board="States «رسائل التأكيد» · Main (placement)" />}
        stage={<ToastRegion />}
        footer={<ToastButtons />}
      />
    </ToastProvider>
  );
}

/* ---------- Popover (Main-filters) ---------- */

function PopoverDemo() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("all");
  const [on, setOn] = useState(() => SOURCES.map((s) => s.on));
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <Stage
      caption={<Caption name="Popover" board="Main-filters" />}
      stage={
        <Popover
          open={open}
          onClose={() => setOpen(false)}
          anchorRef={triggerRef}
          aria-label="تصفية"
          style={{ top: "16px", insetInline: "16px", padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}
        >
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h2 className="t-head">تصفية</h2>
            <Button variant="ghost" size="sm" onClick={() => setOn(SOURCES.map(() => false))}>
              مسح الكل
            </Button>
          </div>
          <div className="col" style={{ gap: "6px" }}>
            <span className="t-label">اللغة</span>
            <Segmented
              block
              value={lang}
              onChange={setLang}
              options={[
                { value: "all", label: "الكل" },
                { value: "ar", label: "عربي" },
                { value: "en", label: "English" },
              ]}
            />
          </div>
          <div className="col" style={{ gap: "8px" }}>
            <span className="t-label">المصادر</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "6px" }}>
              {SOURCES.map((s, i) => (
                <button
                  key={s.name}
                  className="tile tile--row"
                  type="button"
                  aria-pressed={on[i]}
                  onClick={() => setOn((prev) => prev.map((v, j) => (j === i ? !v : v)))}
                  style={{ padding: "8px", gap: "8px", boxShadow: "none" }}
                >
                  <SourceMark ch={s.ch} bg={s.bg} style={{ width: "26px", height: "26px" }} />
                  <span className="grow" style={{ fontSize: "13px", fontWeight: 600 }}>
                    {s.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <Button variant="ink" block onClick={() => setOpen(false)}>
            عرض النتائج
          </Button>
        </Popover>
      }
      footer={
        <IconButton
          ref={triggerRef}
          line
          icon="filter"
          label="تصفية، فلتر واحد مفعّل"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          style={{ width: "44px", height: "44px" }}
        >
          <Badge variant="count" style={{ position: "absolute", top: "-6px", insetInlineEnd: "-6px" }}>
            ١
          </Badge>
        </IconButton>
      }
    />
  );
}

/* ---------- Sheet (MobSystem-install) ---------- */

function SheetDemo() {
  const [open, setOpen] = useState(false);
  return (
    <Stage
      caption={<Caption name="Sheet" board="MobSystem-install" />}
      stage={
        <Sheet
          open={open}
          onClose={() => setOpen(false)}
          className="col"
          aria-labelledby="gal-i-t"
          style={{ padding: "0 20px 28px", gap: "14px" }}
        >
          <div className="row" style={{ gap: "14px", marginTop: "6px" }}>
            <img
              src="/logo-icon.png"
              alt=""
              style={{ width: "60px", height: "60px", borderRadius: "16px", boxShadow: "var(--shadow-2)" }}
            />
            <span className="col">
              <h2 id="gal-i-t" className="t-title">
                ثبّت Newsplus
              </h2>
              <span className="t-meta">على الشاشة الرئيسية</span>
            </span>
          </div>
          <ul className="m-list">
            <li className="m-item">
              <span className="ic-wrap ic-wrap--breaking">
                <Icon name="bell" />
              </span>
              <span className="m-item__label">
                إشعارات العاجل<small>توصلك حتى والتطبيق مقفول</small>
              </span>
            </li>
            <li className="m-item">
              <span className="ic-wrap ic-wrap--teal">
                <Icon name="bolt" />
              </span>
              <span className="m-item__label">
                يفتح أسرع<small>شاشة كاملة من غير شريط المتصفح</small>
              </span>
            </li>
          </ul>
          <Notice
            variant="info"
            style={{ fontSize: "13.5px", alignItems: "flex-start" }}
            icon={<Icon name="share-up" size="sm" style={{ color: "var(--cyan)", marginTop: "4px" }} />}
          >
            على الآيفون: اضغط <b>مشاركة</b> في Safari، ثم <b>إضافة إلى الشاشة الرئيسية</b>.
          </Notice>
          <Button variant="ink" block size="lg" onClick={() => setOpen(false)}>
            تثبيت
          </Button>
          <Button variant="ghost" block onClick={() => setOpen(false)}>
            لاحقاً
          </Button>
        </Sheet>
      }
      footer={
        <Button variant="quiet" block onClick={() => setOpen(true)}>
          ثبّت التطبيق
        </Button>
      }
    />
  );
}

/* ---------- Dialog (MobSystem-logout) ---------- */

function DialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <Stage
      caption={<Caption name="Dialog" board="MobSystem-logout" />}
      stage={
        <Dialog open={open} onClose={() => setOpen(false)} aria-labelledby="gal-l-t">
          <span
            className="ic-wrap ic-wrap--breaking"
            style={{ width: "52px", height: "52px", borderRadius: "16px", alignSelf: "center" }}
          >
            <Icon name="logout" size="lg" />
          </span>
          <h2 id="gal-l-t" className="t-title">
            تسجيل الخروج؟
          </h2>
          <p className="t-small">هتحتاج تدخل تاني على الجهاز ده. مسوداتك وذاكرة الفريق محفوظة.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "6px" }}>
            <Button variant="quiet" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button variant="danger" onClick={() => setOpen(false)}>
              خروج
            </Button>
          </div>
        </Dialog>
      }
      footer={
        <Button variant="quiet" block onClick={() => setOpen(true)}>
          تسجيل الخروج
        </Button>
      }
    />
  );
}

/* ---------- Drawer (DeskArchive) ---------- */

function DrawerDemo() {
  const [open, setOpen] = useState(false);
  return (
    <Stage
      caption={<Caption name="Drawer" board="DeskArchive" />}
      stage={
        <Drawer
          open={open}
          onClose={() => setOpen(false)}
          scrimLabel="إغلاق الأرشيف"
          aria-labelledby="gal-ar-title"
          style={{ width: "500px", display: "flex", flexDirection: "column" }}
        >
          <header className="col" style={{ gap: "14px", padding: "22px 24px 16px", borderBottom: "1px solid var(--line)" }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div className="col">
                <h2 id="gal-ar-title" className="t-title">
                  الأرشيف
                </h2>
                <p className="t-meta">كل مسودة محفوظة بنسخها، ترجعلها وتكمّل منين ما وقفت</p>
              </div>
              <IconButton label="إغلاق" icon="close" onClick={() => setOpen(false)} />
            </div>
            <Field as="label" sunken>
              <Icon name="search" />
              <span className="sr">بحث في الأرشيف</span>
              <FieldInput type="search" placeholder="ابحث بعنوان المسودة…" />
            </Field>
          </header>
        </Drawer>
      }
      footer={
        <Button variant="ghost" onClick={() => setOpen(true)}>
          <Icon name="history" />
          الأرشيف
        </Button>
      }
    />
  );
}
