// /news/:itemId/breaking — breaking mode as its own mobile screen (S13 §2, MobNewBreaking). Desktop has no such
// screen: the newsroom shows it in the studio area, `/news?item={id}&breaking=1`.
// The item comes from the wire's feed query (shared cache) or, while that loads, from the link's `item` state.
import { useState } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import type { NewsFeedItem } from "@newsplus/shared";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useNewsFeed } from "@/hooks/useNewsFeed";
import { breakingLink } from "../breaking/breakingModel";
import { MobBreaking } from "../breaking/MobBreaking";
import { readStudioLinkState } from "../studio/studioLink";

export default function BreakingPage() {
  const { itemId = "" } = useParams();
  const location = useLocation();
  const mobile = useIsMobile();
  const feed = useNewsFeed("all", "");

  /** The item as last seen (or as tapped on the home): it stays on screen if the feed moves on. */
  const [snapshot, setSnapshot] = useState<NewsFeedItem | null>(() => {
    const linked = readStudioLinkState(location.state).item;
    return linked?.id === itemId ? linked : null;
  });
  const live = feed.data?.items.find((entry) => entry.id === itemId);
  if (live && live !== snapshot) setSnapshot(live);
  const item = live ?? (snapshot?.id === itemId ? snapshot : null);

  if (!mobile) return <Navigate to={breakingLink(itemId)} replace />;
  if (!item) return feed.isPending ? <main className="m-scroll" /> : <Navigate to="/news" replace />;
  return <MobBreaking key={item.id} item={item} />;
}
