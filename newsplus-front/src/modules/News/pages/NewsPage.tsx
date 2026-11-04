// /news — the newsroom. S04: the headline wire (WireColumn on desktop, MobWire on mobile) next to the studio.
// The studio is still the pre-Pulse desk (LegacyStudio) until S05/S06; this page only wires the two together:
// which story is open, the `?item=` deep link, the briefing and the swipe actions.
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import type { NewsFeedItem } from "@newsplus/shared";
import { useIsMobile } from "@/hooks/useIsMobile";
import { readDeskHandoff } from "@/services/deskHandoff";
import { LegacyStudio } from "../studio/LegacyStudio";
import { StudioEmpty, StudioLoading } from "../studio/StudioStates";
import { useEditorialDesk } from "../studio/useEditorialDesk";
import { pinForBriefing } from "../wire/briefingPins";
import { MobWire } from "../wire/MobWire";
import { useWire } from "../wire/useWire";
import { WireColumn } from "../wire/WireColumn";

const ITEM_PARAM = "item";

export default function NewsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mobile = useIsMobile();
  const wire = useWire({ mobile });
  const handoff = readDeskHandoff(location.state);

  const [selectedId, setSelectedId] = useState<string | null>(() => handoff?.itemId ?? searchParams.get(ITEM_PARAM));
  /** The open story as last seen: it stays open when filters or a search drop it from the wire (S04 §8). */
  const [snapshot, setSnapshot] = useState<NewsFeedItem | null>(null);
  /** Mobile: a deep link goes straight to the story screen. */
  const [mobilePane, setMobilePane] = useState<"feed" | "desk">(() => (selectedId ? "desk" : "feed"));
  const [autoSelectDone, setAutoSelectDone] = useState(false);

  const live = selectedId ? wire.allItems.find((item) => item.id === selectedId) : undefined;
  const selected = live ?? (snapshot?.id === selectedId ? snapshot : null);
  if (live && live !== snapshot) setSnapshot(live);

  // Only the very first desktop load opens the top headline by itself; later polls and filters never do.
  if (!autoSelectDone && !mobile && !wire.loading) {
    setAutoSelectDone(true);
    const first = wire.rows[0];
    if (!selectedId && first) {
      setSelectedId(first.id);
      setSnapshot(first.item);
    }
  }

  const syncItemParam = (id: string | null) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (id) next.set(ITEM_PARAM, id);
        else next.delete(ITEM_PARAM);
        return next;
      },
      { replace: true },
    );

  const desk = useEditorialDesk({
    selected,
    onOpenItem: (itemId) => {
      setSelectedId(itemId);
      syncItemParam(itemId);
    },
    onShowDesk: () => setMobilePane("desk"),
  });

  useEffect(() => {
    if (!handoff?.input) return;
    navigate("/generate", {
      replace: true,
      state: { prompt: handoff.input, source: "news", style: "brief" },
    });
  }, [handoff?.input, navigate]);

  /** A story picked in the wire. The wire stays usable while AI writes; a run in flight finishes in the archive. */
  function openStory(item: NewsFeedItem) {
    setMobilePane("desk");
    if (item.id === selectedId && !desk.showEditorial && desk.selectedFormat !== "briefing") return;
    desk.openStory();
    setSelectedId(item.id);
    setSnapshot(item);
    syncItemParam(item.id);
  }

  function startBriefing() {
    setMobilePane("desk");
    desk.startBriefing();
  }

  function writePost(item: NewsFeedItem) {
    setMobilePane("desk");
    setSelectedId(item.id);
    setSnapshot(item);
    syncItemParam(item.id);
    desk.startSocial(item);
  }

  const studio = (
    <LegacyStudio
      desk={desk}
      selected={selected}
      itemCount={wire.allItems.length}
      mobile={mobile}
      onBack={() => {
        setMobilePane("feed");
        syncItemParam(null);
      }}
    />
  );

  if (mobile) {
    if (mobilePane === "desk") return studio;
    return (
      <MobWire
        wire={wire}
        onOpen={openStory}
        onBriefing={startBriefing}
        onWrite={writePost}
        onPin={(item) => pinForBriefing(item.id)}
      />
    );
  }

  const idle = !selected && !desk.showEditorial && !desk.busy && !desk.error;
  let side = studio;
  if (idle && wire.loading) side = <StudioLoading />;
  else if (idle) side = <StudioEmpty />;

  return (
    <div className="grow" style={{ display: "flex", minHeight: 0, overflow: "hidden" }}>
      <WireColumn wire={wire} selectedId={selectedId} onSelect={openStory} onBriefing={startBriefing} />
      <div
        style={{
          position: "relative",
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          background: "var(--bg)",
        }}
      >
        {side}
      </div>
    </div>
  );
}
