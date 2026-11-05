import { useIsMobile } from "@/hooks/useIsMobile";
import { AiCooldownCard } from "@/ui/ErrorSurface";
import { SessionExpiredDialog } from "./SessionExpiredDialog";

/**
 * S10 app-wide system surfaces, mounted once inside the `.np` root: «الجلسة انتهت» on every screen, and on mobile
 * the AI cooldown `m-float` above the tab bar (MobSystem-ratelimit). Desktop screens place the cooldown card in
 * their own studio / tool area.
 */
export function SystemLayer() {
  const isMobile = useIsMobile();
  return (
    <>
      {isMobile && <AiCooldownCard />}
      <SessionExpiredDialog />
    </>
  );
}
