import { useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useOnline } from "@/hooks/useOnline";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";

/** Headlines query (`useNewsFeed`): its last successful fetch is the saved copy the boards time-stamp. */
const HEADLINES_QUERY_KEY = ["news-feed"] as const;

/** «٢:٤٠ م» — the boards' clock: Arabic-Indic digits, ص / م. */
const clockFormat = new Intl.DateTimeFormat("ar-EG", { hour: "numeric", minute: "2-digit" });

/**
 * In-app offline banner (S02 §7): mobile `m-banner` (MobSystem) / desktop rounded banner (DeskHome-offline).
 * Renders nothing while online. «حاول» / «حاول تاني» refetches the active queries.
 */
export function OfflineBanner() {
  const online = useOnline();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  if (online) return null;

  let savedAt = 0;
  for (const query of queryClient.getQueryCache().findAll({ queryKey: HEADLINES_QUERY_KEY })) {
    if (query.state.data !== undefined) savedAt = Math.max(savedAt, query.state.dataUpdatedAt);
  }
  const clock = savedAt > 0 ? clockFormat.format(savedAt) : null;

  const retry = () => {
    void queryClient.refetchQueries({ type: "active" });
  };

  if (isMobile) {
    return (
      <div className="m-banner" role="status" style={{ background: "var(--navy)", color: "#fff" }}>
        <Icon name="wifi-off" size="sm" style={{ color: "#fbbf24" }} />
        <span className="grow">{clock ? `مفيش اتصال · العناوين من ${clock}` : "مفيش اتصال"}</span>
        <Button
          size="sm"
          style={{ background: "rgb(255 255 255 / .14)", color: "#fff", minHeight: "30px" }}
          onClick={retry}
        >
          حاول
        </Button>
      </div>
    );
  }

  return (
    <div
      className="row"
      role="status"
      style={{ gap: "12px", padding: "12px 18px", borderRadius: "14px", background: "var(--navy)", color: "#fff" }}
    >
      <Icon name="wifi-off" style={{ color: "#fbbf24" }} />
      <span className="grow" style={{ fontSize: "14px" }}>
        {clock
          ? `مفيش اتصال. بتشوف آخر نسخة محفوظة (${clock})، والمحرّر هيرجع مع رجوع الشبكة.`
          : "مفيش اتصال."}
      </span>
      <Button size="sm" style={{ background: "rgb(255 255 255 / .14)", color: "#fff" }} onClick={retry}>
        حاول تاني
      </Button>
    </div>
  );
}
