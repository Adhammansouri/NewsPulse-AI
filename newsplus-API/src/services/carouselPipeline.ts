import type { OpenAIClient } from "../ai/openaiClient.js";
import { buildCarouselImagePrompt, type CarouselPromptSlide } from "../ai/prompts/carousel.js";
import type { CarouselDensity, CarouselSlideStatus, CarouselStyle } from "@newsplus/shared";
import { composeCarouselPoster } from "./carouselCompose.js";

export type PaintedSlide = {
  bytes: Buffer;
  status: CarouselSlideStatus;
  mismatch?: string;
};

export async function paintCarouselSlide(
  openai: OpenAIClient,
  input: {
    style: CarouselStyle;
    density: CarouselDensity;
    mark: boolean;
    styleLock: string;
    slide: CarouselPromptSlide;
    index: number;
    total: number;
    userId: string;
  },
): Promise<PaintedSlide> {
  const photo = await openai.generateImage(
    buildCarouselImagePrompt({
      style: input.style,
      density: input.density,
      styleLock: input.styleLock,
      slide: input.slide,
      index: input.index,
      total: input.total,
    }),
  );
  const bytes = await composeCarouselPoster({
    photo,
    style: input.style,
    density: input.density,
    mark: input.mark,
    slide: input.slide,
  });
  return { bytes, status: "ready" };
}
