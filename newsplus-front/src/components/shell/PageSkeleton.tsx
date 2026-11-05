import { useIsMobile } from "@/hooks/useIsMobile";
import { Skeleton } from "@/ui/Skeleton";
import { useLazyRouteSignal } from "./routePending";

export type PageSkeletonLayout = "split" | "stack";

/**
 * Suspense fallback of a lazy page (S02 §8, RouteLoader board): the page's shape while its chunk loads.
 * `split` = list column + detail (news, generate); `stack` = wide card + two cards (home, translate).
 * While mounted it marks the navigation as pending (route bar + the rail item's `is-loading`).
 */
export function PageSkeleton({ layout }: { layout: PageSkeletonLayout }) {
  useLazyRouteSignal();
  const isMobile = useIsMobile();

  // The RouteLoader skeleton is desktop-only; on mobile the screen keeps its scroll area above the tab bar.
  if (isMobile) return <div className="m-scroll" />;

  return (
    <div className="grow col" style={{ padding: "30px 36px", gap: "18px" }}>
      <Skeleton height={30} width={260} />
      {layout === "split" ? (
        <div className="row grow" style={{ alignItems: "stretch", gap: "20px" }}>
          <div className="panel col" style={{ width: "380px", padding: "18px", gap: "16px" }}>
            <Skeleton height={44} />
            <Skeleton height={64} />
            <Skeleton height={64} />
            <Skeleton height={64} />
          </div>
          <div className="panel grow col" style={{ padding: "26px", gap: "14px" }}>
            <Skeleton height={28} width="70%" />
            <Skeleton height={14} />
            <Skeleton height={14} width="90%" />
            <div className="row" style={{ marginTop: "14px" }}>
              <Skeleton height={120} width="33%" />
              <Skeleton height={120} width="33%" />
              <Skeleton height={120} width="33%" />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="panel" style={{ height: "150px" }}>
            <Skeleton height="100%" radius={20} />
          </div>
          <div className="row" style={{ alignItems: "stretch", gap: "18px" }}>
            <div className="panel grow" style={{ height: "260px", padding: "18px" }}>
              <Skeleton height="100%" />
            </div>
            <div className="panel grow" style={{ height: "260px", padding: "18px" }}>
              <Skeleton height="100%" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
