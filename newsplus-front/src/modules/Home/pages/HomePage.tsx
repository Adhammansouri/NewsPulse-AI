// / — «مكتب اليوم» (S07): DeskHome at ≥ 1024px, MobHome below, with their loading and offline states.
import { useIsMobile } from "@/hooks/useIsMobile";
import { useOnline } from "@/hooks/useOnline";
import { DeskHome } from "../components/DeskHome";
import { MobHome } from "../components/MobHome";
import { useCompose } from "../useCompose";
import { useHome } from "../useHome";

export default function HomePage() {
  const mobile = useIsMobile();
  const online = useOnline();
  const home = useHome({ mobile, online });
  const compose = useCompose({ online });

  return mobile ? (
    <MobHome home={home} compose={compose} online={online} />
  ) : (
    <DeskHome home={home} compose={compose} online={online} />
  );
}
