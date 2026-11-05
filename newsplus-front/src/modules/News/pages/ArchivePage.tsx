// /archive — «الأرشيف» (S06 §7). Below 1024px: the MobArchive screen, `?tab=memory` on «ذاكرة الفريق» (kept in
// the URL as the tabs change). From 1024px the archive is the studio's drawer: /news?archive=drafts|memory.
import { Navigate, useSearchParams } from "react-router-dom";
import { useIsMobile } from "@/hooks/useIsMobile";
import { ARCHIVE_TAB_PARAM, archiveDrawerPath, readArchiveTab, type ArchiveTab } from "../studio/archive/archiveModel";
import { MobArchive } from "../studio/archive/MobArchive";

export default function ArchivePage() {
  const mobile = useIsMobile();
  const [params, setParams] = useSearchParams();
  const tab: ArchiveTab = readArchiveTab(params.get(ARCHIVE_TAB_PARAM)) ?? "drafts";

  if (!mobile) return <Navigate to={archiveDrawerPath(tab)} replace />;

  function selectTab(next: ArchiveTab) {
    setParams(
      (prev) => {
        const nextParams = new URLSearchParams(prev);
        if (next === "memory") nextParams.set(ARCHIVE_TAB_PARAM, next);
        else nextParams.delete(ARCHIVE_TAB_PARAM);
        return nextParams;
      },
      { replace: true },
    );
  }

  return <MobArchive tab={tab} onTab={selectTab} />;
}
