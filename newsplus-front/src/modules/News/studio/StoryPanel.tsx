// Main · the open story (`article.panel`): marks, source line, time, «عاجل», topic; title and excerpt in the
// story's direction; one link chip per source. Inline styles are the board's own.
import type { ReactNode } from "react";
import { features } from "@/config/features";
import { Icon } from "@/ui/Icon";
import { SourceMarks } from "@/ui/SourceMarks";
import { COPY } from "../wire/copy";
import type { StoryModel } from "./storyModel";

export function StoryPanel({
  story,
  timeline,
}: {
  story: StoryModel;
  /** «تطور القصة · N تحديثات» (`chip chip--sm chip--ai`) — S14 passes it; shown only behind `features.timeline`. */
  timeline?: ReactNode;
}) {
  return (
    <article className="panel" style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "14px" }}>
      <div className="row t-meta" style={{ gap: "10px", flexWrap: "wrap" }}>
        <SourceMarks marks={story.marks} />
        <span style={{ fontWeight: 600, color: "var(--ink-2)" }}>{story.sourceLine}</span>
        <span className="num">{story.time}</span>
        {features.timeline && timeline}
        {story.breaking && <span className="badge badge--breaking">{COPY.breaking}</span>}
        <span className="badge badge--topic">{story.topic}</span>
      </div>
      <h2 className="t-display" dir={story.dir}>
        {story.title}
      </h2>
      {story.excerpt && (
        <p className="t-body" dir={story.dir} style={{ maxWidth: "68ch" }}>
          {story.excerpt}
        </p>
      )}
      <div className="row" style={{ flexWrap: "wrap" }}>
        {story.links.map((link) => (
          <a key={link.key} className="chip chip--soft chip--sm" href={link.url} target="_blank" rel="noopener">
            {link.name}
            <Icon name="external" size="sm" />
          </a>
        ))}
      </div>
    </article>
  );
}
