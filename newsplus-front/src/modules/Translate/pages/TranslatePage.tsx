// /translate — «ترجمة صحفية» (S08 §B): DeskTranslate at ≥ 1024px, MobTranslate below. Handoff in: `source`
// (home, generate «ترجم»); out: «استخدمها في منشور» → /news.
import { useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/useIsMobile";
import { readDeskHandoff } from "@/services/deskHandoff";
import { DeskTranslate } from "../components/DeskTranslate";
import { MobTranslate } from "../components/MobTranslate";
import { useTranslateDesk } from "../useTranslateDesk";

export default function TranslatePage() {
  const handoff = readDeskHandoff(useLocation().state);
  const desk = useTranslateDesk(handoff);
  const isMobile = useIsMobile();
  return isMobile ? <MobTranslate desk={desk} /> : <DeskTranslate desk={desk} />;
}
