// «المحرّر يكتب» placeholders shaped like the draft being written: Main-generating (post · video 9:16 + lines ·
// carousel squares · document) and MobGenerating. Sizes are the boards' inline styles.
import type { NewsSummaryFormat } from "@newsplus/shared";
import { Skeleton } from "@/ui/Skeleton";

const DOC_LIKE: readonly NewsSummaryFormat[] = ["desk", "bulletin", "facts", "context"];

/** Main-generating. The briefing has no shape on the board. */
export function DeskDraftSkeleton({ format }: { format: NewsSummaryFormat }) {
  if (format === "social") {
    return (
      <div className="doc" style={{ maxWidth: "520px", padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <Skeleton height="26px" width="88%" />
        <Skeleton height="26px" width="58%" />
        <Skeleton height="14px" width="100%" style={{ marginTop: "10px" }} />
        <Skeleton height="14px" width="94%" />
        <Skeleton height="14px" width="66%" />
        <div className="row">
          <Skeleton height="28px" width="110px" />
          <Skeleton height="28px" width="90px" />
        </div>
      </div>
    );
  }
  if (format === "video") {
    return (
      <div className="row" style={{ alignItems: "flex-start", gap: "24px" }}>
        <Skeleton width="200px" height="356px" radius="22px" />
        <div className="col grow" style={{ gap: "14px", maxWidth: "420px" }}>
          <Skeleton height="22px" width="72%" />
          <Skeleton height="40px" width="100%" radius="12px" />
          <Skeleton height="14px" width="100%" />
          <Skeleton height="14px" width="90%" />
          <Skeleton height="14px" width="60%" />
        </div>
      </div>
    );
  }
  if (format === "carousel") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px", maxWidth: "640px" }}>
        <Skeleton radius="16px" style={{ aspectRatio: 1 }} />
        <Skeleton radius="16px" style={{ aspectRatio: 1 }} />
        <Skeleton radius="16px" style={{ aspectRatio: 1 }} />
      </div>
    );
  }
  if (DOC_LIKE.includes(format)) {
    return (
      <div className="doc" style={{ maxWidth: "620px", padding: "28px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <Skeleton height="30px" width="80%" />
        <Skeleton height="16px" width="52%" />
        <Skeleton height="14px" width="100%" style={{ marginTop: "10px" }} />
        <Skeleton height="14px" width="97%" />
        <Skeleton height="14px" width="92%" />
        <Skeleton height="14px" width="58%" />
      </div>
    );
  }
  return null;
}

/** MobGenerating: the post being written (the only mobile shape on the boards). */
export function MobDraftSkeleton() {
  return (
    <div className="doc col" style={{ padding: "18px", gap: "12px" }}>
      <Skeleton height="22px" width="92%" />
      <Skeleton height="22px" width="62%" />
      <Skeleton height="13px" width="100%" style={{ marginTop: "8px" }} />
      <Skeleton height="13px" width="95%" />
      <Skeleton height="13px" width="68%" />
      <div className="row">
        <Skeleton height="28px" width="100px" />
        <Skeleton height="28px" width="84px" />
      </div>
    </div>
  );
}
