// View model of the open story (Main story `panel`, MobStory article), shared by desktop and mobile.
import type { NewsFeedItem } from "@newsplus/shared";
import type { SourceMarkData } from "@/ui/SourceMarks";
import { relativeTimeAr } from "@/utils/arabic";
import { itemLanguage, type SourceLanguages } from "../wire/filters";
import { sourceMark, topicLabel } from "../wire/rows";
import { sourceLine } from "./formats";

export type StoryModel = {
  title: string;
  excerpt: string;
  dir: "rtl" | "ltr";
  /** «قبل ٣ دقائق» */
  time: string;
  breaking: boolean;
  topic: string;
  marks: SourceMarkData[];
  /** Main «العربية و٢ مصادر أخرى» / MobStory «العربية و٢ مصادر». */
  sourceLine: string;
  sourceCount: number;
  links: Array<{ key: string; name: string; url: string }>;
};

export function storyModel(item: NewsFeedItem, languages: SourceLanguages, mobile: boolean, now = new Date()): StoryModel {
  return {
    title: item.title,
    excerpt: item.excerpt,
    dir: itemLanguage(item, languages) === "ar" ? "rtl" : "ltr",
    time: relativeTimeAr(item.publishedAt, now),
    breaking: item.breaking,
    topic: topicLabel(item.topic),
    marks: item.sources.map(sourceMark),
    sourceLine: sourceLine(
      item.sources.map((source) => source.name),
      mobile,
    ),
    sourceCount: item.sources.length,
    links: item.sources.map((source, index) => ({ key: `${source.id}-${index}`, name: source.name, url: source.url })),
  };
}
