// Pieces shared by DeskGenerate and MobGenerate. Markup, classes, copy and inline styles follow
// docs/redesign/design/reference/DeskGenerate.dc.html and MobGenerate.dc.html.
import type { CSSProperties } from "react";
import type { GenerateStyle } from "@newsplus/shared";
import type { AiStep } from "@/ui/AiSteps";
import { Chip } from "@/ui/Chip";
import { FieldInput, Field } from "@/ui/Field";
import { ErrorSurface } from "@/ui/ErrorSurface";
import { Segmented } from "@/ui/Segmented";
import { ANGLES, LANGUAGES, LENGTHS, STYLE_DEFINITE, STYLE_LABEL, TONES, angleClause } from "../generateDesk";
import type { GenerateDesk } from "../useGenerateDesk";

/** Resets a `<button>` that wraps text in a row (as the reference does for clickable columns). */
export const PLAIN_BUTTON_STYLE = { border: 0, padding: 0, background: "transparent", textAlign: "start" } as const;

const ROW_STYLE = { justifyContent: "space-between" } as const;

/** «الضبط» rows: اللغة · الطول · النبرة · زاوية التغطية (DeskGenerate form; the MobGenerate «الضبط» sheet). */
export function SettingsRows({ desk }: { desk: GenerateDesk }) {
  return (
    <>
      <div className="row" style={ROW_STYLE}>
        <span className="t-small">اللغة</span>
        <Segmented options={LANGUAGES.map((item) => ({ value: item.id, label: item.label }))} value={desk.language} onChange={desk.setLanguage} />
      </div>
      <div className="row" style={ROW_STYLE}>
        <span className="t-small">الطول</span>
        <Segmented options={LENGTHS.map((item) => ({ value: item.id, label: item.label }))} value={desk.length} onChange={desk.setLength} />
      </div>
      <div className="row" style={ROW_STYLE}>
        <span className="t-small">النبرة</span>
        <Segmented options={TONES.map((item) => ({ value: item.id, label: item.label }))} value={desk.tone} onChange={desk.setTone} />
      </div>
      <div className="col" style={{ gap: "8px" }}>
        <span className="t-small">زاوية التغطية</span>
        <div className="row" style={{ flexWrap: "wrap", gap: "6px" }}>
          {ANGLES.map((item) => (
            <Chip key={item} size="sm" pressed={desk.angle === item} onClick={() => desk.toggleAngle(item)}>
              {item}
            </Chip>
          ))}
        </div>
        {/* The free-text angle the form already had (sprint §A.4). */}
        <Field>
          <FieldInput
            aria-label="زاوية التغطية"
            value={desk.angleIsChip ? "" : desk.angle}
            onChange={(event) => desk.setAngle(event.target.value)}
            placeholder="أو اكتب زاوية أخرى..."
          />
        </Field>
      </div>
    </>
  );
}

/** The editor's writing steps (DeskGenerate-writing / MobGenerate-writing). */
export function writingSteps(desk: GenerateDesk, layout: "desk" | "mob"): AiStep[] {
  const run = desk.run;
  const style: GenerateStyle = run?.style ?? desk.style;
  const angle = angleClause(run?.angle);
  const fromPage = Boolean(run?.url) && run?.mode !== "search";
  const labels =
    layout === "desk"
      ? [
          ...(fromPage ? ["فتح الرابط وقراءة المقال"] : []),
          `كتابة ${STYLE_LABEL[style]}${angle}`,
          "مراجعة الأسماء والأرقام",
        ]
      : [
          ...(fromPage ? ["فتح الرابط", "قراءة المقال"] : []),
          `كتابة ${STYLE_DEFINITE[style]}${angle}`,
          ...(fromPage ? [] : ["مراجعة الأسماء والأرقام"]),
        ];
  const current = Math.min(desk.step, labels.length - 1);
  return labels.map((label, index) => ({
    label,
    status: index < current ? "done" : index === current ? "active" : "todo",
  }));
}

/**
 * A failed write or translation (anything but a refused URL): the shared S10 ErrorSurface — «المحرّر ما قدرش
 * يكمّل» + «أعد المحاولة» (the form is kept), the quota notice / sheet, nothing for a 401 / 429.
 */
export function ToolErrorNotice({ error, onRetry, style }: { error: unknown; onRetry?: () => void; style?: CSSProperties }) {
  return <ErrorSurface error={error} onRetry={onRetry} style={style} />;
}
