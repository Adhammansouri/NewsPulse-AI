// Designed states of the wire list (S04 §6): Main-loading / MobWire-loading, Main-error / MobWire-error,
// Main-empty / MobWire-empty. Inline styles are the boards' own.
import { Button } from "@/ui/Button";
import { EmptyState } from "@/ui/EmptyState";
import { Icon } from "@/ui/Icon";
import { Notice } from "@/ui/Notice";
import { Skeleton } from "@/ui/Skeleton";
import { COPY, savedCopyLine } from "./copy";
import type { WireEmpty as WireEmptyModel } from "./useWire";

/** Second-line widths of the skeleton rows (Main `skRows` · MobWire `sk`). */
const DESK_WIDTHS = ["70%", "55%", "82%", "64%", "76%", "60%"];
const MOB_WIDTHS = ["72%", "58%", "80%", "64%", "70%"];

/** The board's news glyph without the last line (the empty-state art), drawn as the board does. */
const NEWS_SHORT = "M4 5h13v14H5a1 1 0 0 1-1-1zM17 9h3v9a1 1 0 0 1-2 0M7 9h7M7 13h7";

/** Rows shaped like the wire: mark, source, time, then two title lines. */
export function WireSkeleton({ mobile }: { mobile: boolean }) {
  const widths = mobile ? MOB_WIDTHS : DESK_WIDTHS;
  return (
    <>
      {widths.map((width) => (
        <div
          key={width}
          className="col"
          style={{
            gap: "10px",
            padding: "16px 18px",
            paddingInlineStart: mobile ? "34px" : "30px",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <div className="row">
            <Skeleton width="22px" height="22px" radius="7px" />
            <Skeleton height="10px" width="28%" />
            <span className="grow" />
            <Skeleton height="10px" width="14%" />
          </div>
          <Skeleton height="14px" width={mobile ? "96%" : "95%"} />
          <Skeleton height="14px" width={width} />
        </div>
      ))}
    </>
  );
}

/** `notice--error` «تعذّر جلب العناوين» + «بتشوف آخر نسخة من …» + «حاول تاني»; the cached rows stay below it. */
export function WireError({ mobile, savedClock, onRetry }: { mobile: boolean; savedClock: string | null; onRetry: () => void }) {
  return (
    <Notice
      variant="error"
      role="alert"
      style={{ margin: mobile ? "14px 16px" : "12px 16px", alignItems: "center" }}
      icon={
        <span className="ic-wrap ic-wrap--breaking" style={{ background: "var(--surface)" }}>
          <Icon name="refresh" />
        </span>
      }
      textClassName="col grow"
      action={
        <Button variant="quiet" size="sm" onClick={onRetry}>
          {COPY.retry}
        </Button>
      }
    >
      <b style={{ fontWeight: 600 }}>{COPY.errorTitle}</b>
      {savedClock && <span className="t-small">{savedCopyLine(savedClock)}</span>}
    </Notice>
  );
}

/** «مفيش عناوين هنا» with the active filters in the text, «وسّع الوقت …» and «امسح التصفية». */
export function WireEmpty({
  mobile,
  empty,
  onWiden,
  onClear,
}: {
  mobile: boolean;
  empty: WireEmptyModel;
  onWiden: () => void;
  onClear: () => void;
}) {
  const size = mobile ? undefined : "sm";
  const hasActions = empty.widen || empty.canClear;
  return (
    <EmptyState
      style={{ paddingTop: mobile ? "56px" : "64px" }}
      art={
        <svg className="ic ic--xl" viewBox="0 0 24 24" aria-hidden="true">
          <path d={NEWS_SHORT} />
        </svg>
      }
      title={COPY.emptyTitle}
      description={empty.text}
      descriptionStyle={{ maxWidth: mobile ? "280px" : "300px" }}
    >
      {hasActions && (
        <div
          className={mobile ? "col" : "row"}
          style={mobile ? { gap: "8px", width: "100%", maxWidth: "260px", marginTop: "6px" } : { marginTop: "6px" }}
        >
          {empty.widen && (
            <Button variant="ink" size={size} onClick={onWiden}>
              {empty.widen.label}
            </Button>
          )}
          {empty.canClear && (
            <Button variant="ghost" size={size} onClick={onClear}>
              {COPY.clearFilters}
            </Button>
          )}
        </div>
      )}
    </EmptyState>
  );
}
