// «فحص قبل النشر» rows (NewPublish aside, MobNewCheck sheet): `check-row` + `check-ic ok|warn|fail`, the title,
// the note, and the fix as a quiet button. The first load shows rows of `sk` shaped like them.
import type { PublishCheck } from "@newsplus/shared";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { Skeleton } from "@/ui/Skeleton";

/** NewPublish `warnPath`: the exclamation inside `check-ic.warn` (not in icons.json; the board draws it bare). */
function WarnGlyph() {
  return (
    <svg className="ic ic--sm" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 8v5M12 16.5v.5" />
    </svg>
  );
}

/** NewPublish's note style; MobNewCheck's notes are plain `t-meta`. */
const DESK_NOTE_STYLE = { fontSize: "12.5px", lineHeight: 1.6 } as const;
const TEXT_STYLE = { gap: "2px" } as const;
const TITLE_STYLE = { fontWeight: 600, fontSize: "14px" } as const;

export function CheckRows({
  checks,
  mobile,
  canFix,
  onFix,
}: {
  checks: PublishCheck[];
  mobile: boolean;
  canFix: boolean;
  onFix: (check: PublishCheck) => void;
}) {
  return (
    <>
      {checks.map((check) => (
        <div key={check.id} className="check-row">
          <span className={`check-ic ${check.status}`}>{check.status === "ok" ? <Icon name="check" size="sm" /> : <WarnGlyph />}</span>
          <span className="col grow" style={TEXT_STYLE}>
            <b style={TITLE_STYLE}>{check.title}</b>
            <span className="t-meta" style={mobile ? undefined : DESK_NOTE_STYLE}>
              {check.note}
            </span>
          </span>
          {check.status !== "ok" && check.fix && (
            <Button variant="quiet" size="sm" disabled={!canFix} onClick={() => onFix(check)}>
              {check.fix.label}
            </Button>
          )}
        </div>
      ))}
    </>
  );
}

const SKELETON_ROWS = 6;

export function CheckRowsSkeleton() {
  return (
    <>
      {Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <div key={index} className="check-row" aria-hidden="true">
          <Skeleton width="26px" height="26px" radius="50%" />
          <span className="col grow" style={TEXT_STYLE}>
            <Skeleton height="14px" width="45%" />
            <Skeleton height="12px" width="80%" />
          </span>
        </div>
      ))}
    </>
  );
}
