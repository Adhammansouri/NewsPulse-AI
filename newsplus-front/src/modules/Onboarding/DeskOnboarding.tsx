// NewOnboarding (S16 §2) — port of docs/redesign/design/reference/NewOnboarding.dc.html: the form side (brand row
// with «تخطّي الإعداد», step, stepper, title, subtitle, the step's content, «رجوع» + the CTA) and the navy summary
// side «غرفة أخبارك جاهزة» listing the choices so far. Steps 1–2 are not designed for desktop: the same frame shows
// the mobile steps' content in the form side (S16 §2, approved adaptation). Full screen, no rail. Inline styles are
// the board's own (the 900px frame is the viewport here; the form side scrolls when a step is taller).
import { AiCooldownCard } from "@/ui/ErrorSurface";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { DraftError } from "@/modules/News/studio/draft/Editor";
import { ONBOARDING_COPY, stepCopy, stepCta, stepLabel } from "./onboardingModel";
import { PlatformsStep, SourcesStep, StepTitle, Stepper, StylesStep } from "./OnboardingSteps";
import type { Onboarding } from "./useOnboarding";

const COLUMN = { maxWidth: "640px" } as const;
const LINE_STYLE = { gap: "10px", padding: "12px 14px", borderRadius: "14px", background: "rgb(255 255 255 / .06)" } as const;
const STYLE_LINE_STYLE = { ...LINE_STYLE, background: "rgb(255 255 255 / .1)", boxShadow: "inset 0 0 0 1px rgb(56 189 248 / .4)" } as const;
const LINE_ICON_STYLE = { color: "#5eead4" } as const;

export function DeskOnboarding({ onboarding }: { onboarding: Onboarding }) {
  const { step } = onboarding;
  const copy = stepCopy(step, true);
  const cta = stepCta(step);
  return (
    <div style={{ position: "relative", display: "flex", width: "100%", height: "100dvh", overflow: "hidden" }}>
      <div className="grow" style={{ display: "grid", gridTemplateColumns: "1fr 460px" }}>
        <main className="col" style={{ padding: "40px 64px", gap: "26px", background: "var(--surface)", overflowY: "auto" }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="row">
              <img src="/logo-icon.png" alt="" style={{ width: "38px", height: "38px", borderRadius: "11px" }} />
              <b style={{ fontFamily: "var(--f-display)", fontSize: "18px" }}>{ONBOARDING_COPY.brand}</b>
            </span>
            <Button variant="ghost" size="sm" loading={onboarding.skipping} disabled={onboarding.finishing} onClick={onboarding.skip}>
              {ONBOARDING_COPY.skipDesk}
            </Button>
          </div>
          <div className="col" style={{ gap: "10px", ...COLUMN }}>
            <div className="row t-meta" style={{ gap: "10px" }}>
              <span>{stepLabel(step)}</span>
            </div>
            <Stepper step={step} style={{ maxWidth: "260px" }} />
            <StepTitle titleRef={onboarding.titleRef} className="t-hero" fontSize="34px">
              {copy.title}
            </StepTitle>
            <p className="t-body">{copy.sub}</p>
          </div>
          <div className="col" style={{ gap: "12px", ...COLUMN }}>
            {step === 1 && <PlatformsStep onboarding={onboarding} />}
            {step === 2 && <SourcesStep onboarding={onboarding} />}
            {step === 3 && <StylesStep onboarding={onboarding} desktop />}
          </div>
          {onboarding.saveError ? <DraftError error={onboarding.saveError} style={COLUMN} /> : null}
          <div className="row" style={{ gap: "10px", ...COLUMN }}>
            {step > 1 && (
              <Button variant="ghost" disabled={onboarding.busy} onClick={onboarding.back}>
                <Icon name="arrow-back" size="sm" />
                {ONBOARDING_COPY.back}
              </Button>
            )}
            <span className="grow" />
            <Button variant={cta.variant} size="lg" loading={onboarding.finishing} disabled={onboarding.skipping} onClick={onboarding.next}>
              {cta.finish && !onboarding.finishing && <Icon name="sparkle" size="sm" />}
              {cta.label}
            </Button>
          </div>
        </main>
        <aside
          className="col"
          style={{ position: "relative", overflow: "hidden", background: "#0c2340", color: "#e8eef5", padding: "48px 40px", gap: "18px", justifyContent: "center" }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(circle at 80% 10%,rgb(14 165 233 / .25),transparent 45%),radial-gradient(circle at 0% 100%,rgb(13 155 138 / .3),transparent 50%)",
            }}
          />
          <b style={{ position: "relative", fontFamily: "var(--f-display)", fontSize: "22px" }}>{ONBOARDING_COPY.summaryTitle}</b>
          <div className="col" style={{ position: "relative", gap: "10px" }}>
            {onboarding.summary.map((line) => (
              <div key={line.key} className="row" style={line.style ? STYLE_LINE_STYLE : LINE_STYLE}>
                <Icon name={line.style ? "sparkle" : "check"} size="sm" style={LINE_ICON_STYLE} />
                <span className="grow">{line.text}</span>
              </div>
            ))}
          </div>
          <p style={{ position: "relative", fontSize: "13.5px", lineHeight: 1.8, color: "#a9b8c9" }}>{ONBOARDING_COPY.summaryNote}</p>
        </aside>
      </div>
      <AiCooldownCard />
    </div>
  );
}
