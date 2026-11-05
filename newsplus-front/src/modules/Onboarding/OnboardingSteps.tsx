// S16 «أول تشغيل»: the three steps' content — MobOnboard (`is1` / `is2` / `is3`), also the form side of
// NewOnboarding (steps 1–2 reuse the mobile content there; step 3 has NewOnboarding's own tiles). Markup, classes
// and inline styles are the boards' own.
import type { RefObject } from "react";
import type { HookStyle } from "@newsplus/shared";
import { Badge } from "@/ui/Badge";
import { Check } from "@/ui/Check";
import { ErrorSurface } from "@/ui/ErrorSurface";
import { Icon } from "@/ui/Icon";
import { Skeleton } from "@/ui/Skeleton";
import { SourceMark } from "@/ui/SourceMarks";
import { DraftError } from "@/modules/News/studio/draft/Editor";
import { sourceMark } from "@/modules/News/wire/rows";
import { HOOK_STYLE_COPY, HOOK_STYLE_ORDER, ONBOARDING_COPY, PLATFORM_ROWS, stepperOn } from "./onboardingModel";
import type { Onboarding } from "./useOnboarding";

const MARK_STYLE = { width: "30px", height: "30px", borderRadius: "9px" } as const;
const SOURCE_NAME_STYLE = { fontSize: "13.5px", fontWeight: 600, textAlign: "start" } as const;
/** Placeholder tiles while `/news/sources` loads (the board shows 8). */
const SOURCE_SKELETONS = 8;

/** `div.stepper` with the segments done so far. */
export function Stepper({ step, style }: { step: Onboarding["step"]; style?: { maxWidth: string } }) {
  const on = stepperOn(step);
  return (
    <div className="stepper" style={style}>
      {on.map((done, index) => (
        <i key={index} className={done ? "on" : undefined} />
      ))}
    </div>
  );
}

/** Step 1 «بتنشر فين؟»: the platform rows with their `check`. */
export function PlatformsStep({ onboarding }: { onboarding: Onboarding }) {
  return (
    <>
      {PLATFORM_ROWS.map((row) => {
        const on = onboarding.platforms.includes(row.id);
        return (
          <button
            key={row.id}
            className="tile tile--row"
            type="button"
            aria-pressed={on}
            style={{ padding: "14px" }}
            onClick={() => onboarding.togglePlatform(row.id)}
          >
            <span className="col grow">
              <b style={{ fontSize: "15px" }}>{row.name}</b>
              <span className="t-meta">{row.note}</span>
            </span>
            <Check checked={on} />
          </button>
        );
      })}
    </>
  );
}

/** Step 2 «بتتابع مين؟»: the source tiles (2-column grid, marks) and the note. */
export function SourcesStep({ onboarding }: { onboarding: Onboarding }) {
  return (
    <>
      {onboarding.sourcesError ? <DraftError error={onboarding.sourcesError} /> : null}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }} aria-busy={onboarding.sourcesLoading || undefined}>
        {onboarding.sourcesLoading
          ? Array.from({ length: SOURCE_SKELETONS }, (_, index) => (
              <div key={index} className="tile tile--row" style={{ padding: "10px", gap: "10px" }} aria-hidden="true">
                <Skeleton width="30px" height="30px" radius="9px" />
                <Skeleton height="10px" width="60%" />
              </div>
            ))
          : onboarding.sourceList.map((source) => {
              const on = onboarding.sources.includes(source.id);
              const mark = sourceMark(source);
              return (
                <button
                  key={source.id}
                  className="tile tile--row"
                  type="button"
                  aria-pressed={on}
                  style={{ padding: "10px", gap: "10px" }}
                  onClick={() => onboarding.toggleSource(source.id)}
                >
                  <SourceMark ch={mark.ch} bg={mark.bg} style={MARK_STYLE} />
                  <span className="grow" style={SOURCE_NAME_STYLE}>
                    {source.name}
                  </span>
                </button>
              );
            })}
      </div>
      <p className="t-meta" style={{ marginTop: "6px" }}>
        {ONBOARDING_COPY.sourcesNote}
      </p>
    </>
  );
}

/** A hook tile while the example story's hooks load (shaped like the tile it stands in for). */
function HookSkeleton({ desktop }: { desktop: boolean }) {
  return (
    <div className="tile tile--row" style={{ padding: desktop ? "16px 18px" : "14px", alignItems: "flex-start" }} aria-hidden="true">
      <Skeleton width="44px" height="22px" radius="7px" />
      <span className="col grow" style={{ gap: desktop ? "8px" : "10px" }}>
        <Skeleton height="14px" width="88%" />
        <Skeleton height={desktop ? "10px" : "14px"} width={desktop ? "36%" : "54%"} />
      </span>
    </div>
  );
}

/** Step 3 «علّم المحرّر أسلوبك»: the same story in three hook styles, as selectable `tile--row`s. */
export function StylesStep({ onboarding, desktop }: { onboarding: Onboarding; desktop: boolean }) {
  const loading = onboarding.hooksLoading;
  return (
    <>
      <p className="t-label">{ONBOARDING_COPY.stylesLabel}</p>
      {onboarding.hooksError ? <ErrorSurface error={onboarding.hooksError} onRetry={onboarding.retryHooks} /> : null}
      {loading
        ? HOOK_STYLE_ORDER.map((style) => <HookSkeleton key={style} desktop={desktop} />)
        : HOOK_STYLE_ORDER.map((style) => (
            <HookTile
              key={style}
              style={style}
              hook={onboarding.hooks?.[style] ?? ""}
              on={onboarding.hookStyle === style}
              desktop={desktop}
              onChoose={() => onboarding.chooseHookStyle(style)}
            />
          ))}
      {!desktop && (
        <div className="ai-panel row" style={{ padding: "12px 14px", gap: "10px", boxShadow: "none", marginTop: "6px" }}>
          <Icon name="sparkle" size="sm" />
          <span className="t-small grow">{ONBOARDING_COPY.memoryNote}</span>
        </div>
      )}
    </>
  );
}

function HookTile({
  style,
  hook,
  on,
  desktop,
  onChoose,
}: {
  style: HookStyle;
  hook: string;
  on: boolean;
  desktop: boolean;
  onChoose: () => void;
}) {
  const copy = HOOK_STYLE_COPY[style];
  const badge = <Badge variant={on ? "ai" : "topic"}>{copy.label}</Badge>;
  if (!desktop) {
    return (
      <button className="tile tile--row" type="button" aria-pressed={on} style={{ padding: "14px", alignItems: "flex-start" }} onClick={onChoose}>
        {badge}
        <b className="grow" style={{ fontSize: "14.5px", lineHeight: 1.6 }}>
          {hook}
        </b>
      </button>
    );
  }
  return (
    <button className="tile tile--row" type="button" aria-pressed={on} style={{ padding: "16px 18px", alignItems: "flex-start" }} onClick={onChoose}>
      {badge}
      <span className="col grow" style={{ gap: "4px" }}>
        <b style={{ fontSize: "16px", lineHeight: 1.6 }}>{hook}</b>
        <span className="t-meta">{copy.note}</span>
      </span>
      {on && (
        <span className="tile__check" style={{ position: "static" }}>
          <Icon name="check" size="sm" />
        </span>
      )}
    </button>
  );
}

/** The step title, focused when the step changes. */
export function StepTitle({ titleRef, className, fontSize, children }: { titleRef: RefObject<HTMLHeadingElement | null>; className: string; fontSize: string; children: string }) {
  return (
    <h1 ref={titleRef} className={className} style={{ fontSize }} tabIndex={-1}>
      {children}
    </h1>
  );
}
