// MobOnboard (S16 §2) — port of docs/redesign/design/reference/MobOnboard.dc.html (states one / two / three): the
// brand row with «تخطّي», the step, stepper, title and subtitle, the step's content, and the bottom CTA («رجوع» +
// «التالي» / AI «ابدأ الشغل»). Inside AppRoot's `.np.m` root; no tab bar. Inline styles are the board's own.
import { Button } from "@/ui/Button";
import { DraftError } from "@/modules/News/studio/draft/Editor";
import { M_CTA_STYLE } from "@/modules/News/studio/MobStory";
import { ONBOARDING_COPY, stepCopy, stepCta, stepLabel } from "./onboardingModel";
import { PlatformsStep, SourcesStep, StepTitle, Stepper, StylesStep } from "./OnboardingSteps";
import type { Onboarding } from "./useOnboarding";

export function MobOnboarding({ onboarding }: { onboarding: Onboarding }) {
  const { step } = onboarding;
  const copy = stepCopy(step, false);
  const cta = stepCta(step);
  return (
    <>
      <div className="row" style={{ padding: "16px 18px 0", justifyContent: "space-between" }}>
        <span className="row">
          <img src="/logo-icon.png" alt="" style={{ width: "32px", height: "32px", borderRadius: "9px" }} />
          <b style={{ fontFamily: "var(--f-display)" }}>{ONBOARDING_COPY.brand}</b>
        </span>
        <Button variant="ghost" size="sm" loading={onboarding.skipping} disabled={onboarding.finishing} onClick={onboarding.skip}>
          {ONBOARDING_COPY.skipMob}
        </Button>
      </div>
      <div className="col" style={{ padding: "18px 20px 6px", gap: "10px" }}>
        <span className="t-meta">{stepLabel(step)}</span>
        <Stepper step={step} />
        <StepTitle titleRef={onboarding.titleRef} className="t-display" fontSize="24px">
          {copy.title}
        </StepTitle>
        <p className="t-small">{copy.sub}</p>
      </div>
      <main className="m-scroll col" style={{ padding: "10px 20px 16px", gap: "8px" }}>
        {step === 1 && <PlatformsStep onboarding={onboarding} />}
        {step === 2 && <SourcesStep onboarding={onboarding} />}
        {step === 3 && <StylesStep onboarding={onboarding} desktop={false} />}
        {onboarding.saveError ? <DraftError error={onboarding.saveError} /> : null}
      </main>
      <div className="m-cta" style={M_CTA_STYLE}>
        <div className="row" style={{ gap: "8px" }}>
          {step > 1 && (
            <Button variant="ghost" disabled={onboarding.busy} onClick={onboarding.back}>
              {ONBOARDING_COPY.back}
            </Button>
          )}
          <Button variant={cta.variant} size="lg" className="grow" loading={onboarding.finishing} disabled={onboarding.skipping} onClick={onboarding.next}>
            {cta.label}
          </Button>
        </div>
      </div>
    </>
  );
}
