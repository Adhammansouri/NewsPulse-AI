// /generate — «توليد» (S08 §A): DeskGenerate at ≥ 1024px, MobGenerate below. Handoffs in: home/news
// (`prompt` or `input`, optional `style`); out: «ترجم» → /translate, «حوّله لمنشور سوشيال» → /news.
import { useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/useIsMobile";
import { readDeskHandoff } from "@/services/deskHandoff";
import { DeskGenerate } from "../components/DeskGenerate";
import { MobGenerate } from "../components/MobGenerate";
import { useGenerateDesk } from "../useGenerateDesk";

export default function GeneratePage() {
  const handoff = readDeskHandoff(useLocation().state);
  const desk = useGenerateDesk(handoff);
  const isMobile = useIsMobile();
  return isMobile ? <MobGenerate desk={desk} /> : <DeskGenerate desk={desk} />;
}
