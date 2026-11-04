// «الأرشيف» of the studio (S06 §7). Desktop: the DeskArchive drawer over the whole app, opened by the studio's
// «الأرشيف» (desk.drawerOpen) or by `/news?archive=drafts|memory` — the desktop end of /archive — whose param is
// dropped once the drawer is open. Mobile has no drawer: the archive is its own screen, /archive (MobArchive).
import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useIsMobile } from "@/hooks/useIsMobile";
import { ARCHIVE_DRAWER_PARAM, ARCHIVE_ROUTE, archivePath, readArchiveTab, type ArchiveTab } from "./archive/archiveModel";
import { DeskArchive } from "./archive/DeskArchive";
import type { EditorialDesk } from "./useEditorialDesk";

/** A viewport layer for the scrim and the drawer, so they cover the rail and the wire as on the board. */
const LAYER_STYLE: CSSProperties = { position: "fixed", inset: 0 };

export function ArchiveDrawer({ desk }: { desk: EditorialDesk }) {
  const mobile = useIsMobile();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const requested = readArchiveTab(params.get(ARCHIVE_DRAWER_PARAM));
  const [tab, setTab] = useState<ArchiveTab>("drafts");
  const { drawerOpen, setDrawerOpen, closeDrawer } = desk;

  useEffect(() => {
    if (!requested) return;
    if (mobile) {
      navigate(archivePath(requested), { replace: true });
      return;
    }
    setTab(requested);
    setDrawerOpen(true);
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(ARCHIVE_DRAWER_PARAM);
        return next;
      },
      { replace: true },
    );
  }, [requested, mobile, navigate, setDrawerOpen, setParams]);

  useEffect(() => {
    if (!mobile || !drawerOpen) return;
    closeDrawer();
    navigate(ARCHIVE_ROUTE);
  }, [mobile, drawerOpen, closeDrawer, navigate]);

  if (mobile || !drawerOpen) return null;

  function close() {
    setTab("drafts");
    closeDrawer();
  }

  return (
    <div style={LAYER_STYLE}>
      <DeskArchive
        tab={tab}
        onTab={setTab}
        currentId={desk.conversationId}
        onOpen={(conversationId) => {
          setTab("drafts");
          desk.openConversation(conversationId);
        }}
        onClose={close}
      />
    </div>
  );
}
