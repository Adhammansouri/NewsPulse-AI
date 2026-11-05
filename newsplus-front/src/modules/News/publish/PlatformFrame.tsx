// The neutral platform frame (`pf`) — no real platform logos or UI. NewPublish's frame for every platform;
// MobNewPreview's Instagram frame (handle + «منشور · الآن», the square picture, the caption cut at «المزيد»).
import type { Ref } from "react";
import type { PublishParts } from "@newsplus/shared";
import { Icon } from "@/ui/Icon";
import { Lines } from "../studio/draft/DraftBlock";
import type { TextDir } from "../studio/draft/draftModel";
import { PUBLISH_COPY } from "./publishCopy";
import { instagramPreview, type PlatformView } from "./publishModel";

/** The rail's logo (the boards' `pf__head` avatar). */
const LOGO_SRC = "/logo-icon.png";

const DESK_AVATAR = { width: "42px", height: "42px", borderRadius: "50%" } as const;
const MOB_AVATAR = { width: "36px", height: "36px", borderRadius: "50%" } as const;
const HANDLE_STYLE = { textAlign: "right" } as const;
const HOOK_STYLE = { fontWeight: 700 } as const;
const BODY_STYLE = { marginTop: "6px", color: "var(--ink-2)" } as const;
const TAGS_STYLE = { marginTop: "8px", color: "var(--cyan)", direction: "rtl" } as const;

type FrameProps = {
  view: PlatformView;
  parts: PublishParts;
  /** The picture's line (the story's headline). */
  headline: string;
  dir: TextDir;
  /** The article (a refused clipboard selects its text). */
  ref?: Ref<HTMLElement>;
};

/** NewPublish `article.pf` (width 520px on desktop). */
export function PlatformFrame({ view, parts, headline, dir, width, ref }: FrameProps & { width?: string }) {
  const tags = parts.tags.join(" ");
  return (
    <article ref={ref} className="pf" style={width ? { width } : undefined}>
      <div className="pf__head">
        <img src={LOGO_SRC} alt="" style={DESK_AVATAR} />
        <span className="col grow">
          <b style={{ fontSize: "14.5px" }}>{PUBLISH_COPY.brand}</b>
          <span className="t-meta" dir="ltr" style={HANDLE_STYLE}>
            {view.handle}
          </span>
        </span>
        <span className="badge badge--topic">{view.name}</span>
      </div>
      <div className="pf__body">
        <p style={HOOK_STYLE} dir={dir}>
          {parts.hook}
        </p>
        {view.showBody && (
          <p style={BODY_STYLE} dir={dir}>
            <Lines text={parts.body} />
          </p>
        )}
        {tags && <p style={TAGS_STYLE}>{tags}</p>}
      </div>
      {view.media && <div className="pf__media">{headline}</div>}
      <div className="pf__bar">
        <Icon name="send" size="sm" />
        <Icon name="refresh" size="sm" />
        <Icon name="eye" size="sm" />
      </div>
    </article>
  );
}

/** MobNewPreview's Instagram frame. */
export function InstagramFrame({ view, headline, dir, ref }: Omit<FrameProps, "parts">) {
  const { visible, more } = instagramPreview(view);
  return (
    <article ref={ref} className="pf">
      <div className="pf__head">
        <img src={LOGO_SRC} alt="" style={MOB_AVATAR} />
        <span className="col grow">
          <b style={{ fontSize: "14px" }}>{view.handle}</b>
          <span className="t-meta">{PUBLISH_COPY.postNow}</span>
        </span>
      </div>
      <div className="pf__media" style={{ aspectRatio: "1/1" }}>
        {headline}
      </div>
      <div className="pf__body" style={{ fontSize: "14.5px" }}>
        <p dir={dir}>
          <b>{view.handle}</b> {visible}
          {more && (
            <>
              … <span style={{ color: "var(--ink-3)" }}>{PUBLISH_COPY.more}</span>
            </>
          )}
        </p>
      </div>
    </article>
  );
}
