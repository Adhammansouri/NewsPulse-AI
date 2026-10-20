import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { NewsFeedItem } from "@newsplus/shared";
import { formatAgo, formatStamp, hasArabic, isBreaking, newsRecency, TOPIC_FILTERS } from "../newsFormat";
import { SourceMarkStack } from "../SourceMark";

type WireRowProps = {
  item: NewsFeedItem;
  active?: boolean;
  arrived?: boolean;
  disabled?: boolean;
  lead?: boolean;
  /** Render as a router link (Home) instead of a selectable button (Newsroom). */
  to?: string;
  state?: unknown;
  onSelect?: () => void;
  trailing?: ReactNode;
  /** Position in the list, drives the entrance stagger on `.wire-in`. */
  index?: number;
};

/** A headline on the live wire: time · rail dot · story. Shared by Home and the Newsroom. */
export function WireRow({ item, active = false, arrived = false, disabled = false, lead = false, to, state, onSelect, trailing, index }: WireRowProps) {
  const recency = newsRecency(item.publishedAt);
  const breaking = isBreaking(item);
  const primary = item.sources[0];
  const topic = TOPIC_FILTERS.find((entry) => entry.id === item.topic)?.label;
  const rtl = hasArabic(item.title);
  const className = ["wire-item", `is-${recency}`, lead ? "is-lead" : "", active ? "is-active" : "", arrived ? "is-arrived" : ""].filter(Boolean).join(" ");

  const style = index === undefined ? undefined : ({ "--i": index } as React.CSSProperties);

  const body = (
    <>
      <time className="wire-time" dateTime={item.publishedAt} title={formatStamp(item.publishedAt)}>
        {formatAgo(item.publishedAt)}
      </time>
      <span className="wire-rail" aria-hidden="true"><i className={`wire-dot ${breaking ? "is-breaking" : ""}`} /></span>
      <span className="wire-body">
        <span className="wire-source">
          <SourceMarkStack sources={item.sources} size={18} />
          {primary ? <bdi className="wire-source-name">{primary.name}</bdi> : null}
          {item.sources.length > 1 ? <span className="wire-more">+{item.sources.length - 1}</span> : null}
          {arrived ? <span className="badge badge-brand">ظهر الآن</span> : null}
        </span>
        <span className="wire-title" dir={rtl ? "rtl" : "ltr"} lang={rtl ? "ar" : "en"}>{item.title}</span>
        <span className="wire-tags">
          {breaking ? <span className="badge badge-live">عاجل</span> : null}
          {topic && item.topic !== "other" ? <span className="wire-topic">{topic}</span> : null}
        </span>
      </span>
      {trailing}
    </>
  );

  if (to) {
    return (
      <Link to={to} state={state} className={className} style={style}>
        {body}
      </Link>
    );
  }
  return (
    <button type="button" className={className} style={style} data-headline-id={item.id} aria-pressed={active} disabled={disabled} onClick={onSelect}>
      {body}
    </button>
  );
}

export function WireSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="wire" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="wire-item is-skeleton">
          <span className="wire-time"><span className="skel" style={{ width: "1.6rem", height: "0.7rem" }} /></span>
          <span className="wire-rail"><i className="wire-dot" /></span>
          <span className="wire-body">
            <span className="skel" style={{ width: "34%", height: "0.8rem" }} />
            <span className="skel" style={{ width: `${92 - (index % 3) * 10}%`, height: "1.1rem" }} />
            <span className="skel" style={{ width: `${58 - (index % 2) * 14}%`, height: "1.1rem" }} />
          </span>
        </div>
      ))}
    </div>
  );
}
