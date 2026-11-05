// The carousel's slides as the boards show them (S06 §6): `pending` → `is-painting` + «تُرسم…» (MobDraft-carousel:
// the ones still waiting their turn read «في الانتظار»), `ready` → «جاهزة», `mismatch` → «راجعها», `failed` →
// «فشل الرسم». A slide being redrawn paints again whatever its status was.
import type { CarouselSlide } from "@newsplus/shared";
import type { BadgeVariant } from "@/ui/Badge";
import { CAROUSEL_COPY } from "../draft/copy";

export type SlidePhase = "ready" | "painting" | "queued" | "review" | "failed";

export function slidePhase(slide: CarouselSlide, painting: readonly number[]): SlidePhase {
  if (painting.includes(slide.index)) return "painting";
  if (slide.status === "ready") return "ready";
  if (slide.status === "mismatch") return "review";
  if (slide.status === "failed") return "failed";
  return "queued";
}

export function isPainting(phase: SlidePhase) {
  return phase === "painting" || phase === "queued";
}

export const PHASE_BADGE: Record<SlidePhase, BadgeVariant> = {
  ready: "ok",
  painting: "ai",
  queued: "ai",
  review: "warn",
  failed: "breaking",
};

/** DeskCarousel has no «في الانتظار»: every slide still to paint reads «تُرسم…». */
export function phaseLabel(phase: SlidePhase, mobile: boolean): string {
  switch (phase) {
    case "ready":
      return CAROUSEL_COPY.ready;
    case "review":
      return CAROUSEL_COPY.review;
    case "failed":
      return CAROUSEL_COPY.failed;
    case "queued":
      return mobile ? CAROUSEL_COPY.queued : CAROUSEL_COPY.painting;
    default:
      return CAROUSEL_COPY.painting;
  }
}

export type SlideView = { slide: CarouselSlide; n: number; phase: SlidePhase };

export function slideViews(slides: readonly CarouselSlide[], painting: readonly number[]): SlideView[] {
  return slides.map((slide, position) => ({ slide, n: position + 1, phase: slidePhase(slide, painting) }));
}

/** DeskCarousel «٢ جاهزة · ١ تُرسم · ١ تحتاج مراجعة». */
export function slidesTally(views: readonly SlideView[]): string {
  const ready = views.filter((view) => view.phase === "ready").length;
  const painting = views.filter((view) => isPainting(view.phase)).length;
  const review = views.filter((view) => view.phase === "review" || view.phase === "failed").length;
  return CAROUSEL_COPY.tally(ready, painting, review);
}

/** The painter's own failure text (useCarouselPainter); the notice's title already says it. */
const PAINTER_FAILURE = "تعذّر رسم الشريحة";

/** A slide to redraw: «الشريحة ٤ لا تطابق نصها» + the reason, or «تعذّر رسم الشريحة ٤». */
export function slideProblem(view: SlideView): { title: string; text: string } | null {
  if (view.phase === "review") return { title: CAROUSEL_COPY.mismatch(view.n), text: view.slide.mismatch ?? "" };
  if (view.phase === "failed") {
    const reason = view.slide.mismatch?.trim() ?? "";
    return { title: CAROUSEL_COPY.paintFailed(view.n), text: reason === PAINTER_FAILURE ? "" : reason };
  }
  return null;
}
