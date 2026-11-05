import { useIsMobile } from "@/hooks/useIsMobile";
import { DeskOnboarding } from "../DeskOnboarding";
import { MobOnboarding } from "../MobOnboarding";
import { useOnboarding } from "../useOnboarding";

/** S16 `/welcome`: NewOnboarding (≥ 1024px) or MobOnboard. One state for both, so a resize keeps the choices. */
export default function OnboardingPage() {
  const onboarding = useOnboarding();
  const isMobile = useIsMobile();
  return isMobile ? <MobOnboarding onboarding={onboarding} /> : <DeskOnboarding onboarding={onboarding} />;
}
