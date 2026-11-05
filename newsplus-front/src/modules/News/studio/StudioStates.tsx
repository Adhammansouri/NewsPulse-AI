// The studio side of Main-loading and Main-empty (desktop): shown while the first headlines load, and while
// no story is open. Inline styles are the board's own.
import { EmptyState } from "@/ui/EmptyState";
import { Icon } from "@/ui/Icon";
import { Skeleton } from "@/ui/Skeleton";
import { COPY } from "../wire/copy";

/** Main-loading: the story panel and the three format cards, as skeletons. */
export function StudioLoading() {
  return (
    <div className="col" style={{ flex: 1, padding: "26px 34px", gap: "18px" }}>
      <div className="panel col" style={{ padding: "24px 28px", gap: "14px" }}>
        <Skeleton height="12px" width="30%" />
        <Skeleton height="28px" width="85%" />
        <Skeleton height="28px" width="55%" />
        <Skeleton height="14px" width="100%" style={{ marginTop: "6px" }} />
        <Skeleton height="14px" width="80%" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px" }}>
        <Skeleton height="168px" radius="16px" />
        <Skeleton height="168px" radius="16px" />
        <Skeleton height="168px" radius="16px" />
      </div>
    </div>
  );
}

/** Main-empty: «اختار خبر وابدأ». */
export function StudioEmpty() {
  return (
    <div style={{ flex: 1, display: "grid", placeItems: "center" }}>
      <EmptyState
        style={{ maxWidth: "420px" }}
        artStyle={{ background: "var(--ai-soft)" }}
        art={<Icon name="sparkle" size="xl" style={{ color: "var(--cyan)" }} />}
        title={COPY.studioEmptyTitle}
        description={COPY.studioEmptyText}
      />
    </div>
  );
}
