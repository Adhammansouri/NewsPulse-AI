// What the studio remembers between stories (S05 §1): the last chosen format (`localStorage`
// `newsplus-last-format`) and the last-used carousel options (kept for the session, shared by the desktop
// studio, which has no settings before generating, and the mobile carousel sheet).
import type { CarouselOptions, NewsStoryFormat } from "@newsplus/shared";
import { DEFAULT_CAROUSEL_OPTIONS, isStoryFormat } from "./formats";

const LAST_FORMAT_KEY = "newsplus-last-format";
/** Main's selected tile before anything was chosen. */
const FIRST_FORMAT: NewsStoryFormat = "social";

export function readLastFormat(): NewsStoryFormat {
  try {
    const value = window.localStorage.getItem(LAST_FORMAT_KEY);
    return isStoryFormat(value) ? value : FIRST_FORMAT;
  } catch {
    return FIRST_FORMAT;
  }
}

export function writeLastFormat(format: NewsStoryFormat) {
  try {
    window.localStorage.setItem(LAST_FORMAT_KEY, format);
  } catch {
    /* storage unavailable: the choice holds for this screen only */
  }
}

let lastCarouselOptions: CarouselOptions = DEFAULT_CAROUSEL_OPTIONS;

export function readCarouselOptions(): CarouselOptions {
  return lastCarouselOptions;
}

export function writeCarouselOptions(options: CarouselOptions) {
  lastCarouselOptions = options;
}
