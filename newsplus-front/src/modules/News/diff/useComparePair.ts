// The two versions being compared (NewDiff's two `seg`s), their diff, the requests between them, and the actions:
// «اعتمد ن{b}» keeps the newer one as current (restores it when it isn't), «رجّع ن{a}» restores the older one.
// Restoring copies a version into a new one (`POST …/restore`); nothing is deleted.
import { useState } from "react";
import type { EditorialVersion } from "@newsplus/shared";
import type { EditorialDesk } from "../studio/useEditorialDesk";
import { defaultPair, diffTotals, diffVersions, requestsBetween, sideOptions } from "./diffModel";

export function useComparePair(desk: EditorialDesk, onDone: () => void) {
  const versions = [...(desk.detail?.versions ?? [])].sort((a, b) => a.number - b.number);
  const [picked, setPicked] = useState<{ fromId: string; toId: string } | null>(null);
  const fallback = defaultPair(versions);
  const from = versions.find((version) => version.id === picked?.fromId) ?? fallback?.from;
  const to = versions.find((version) => version.id === picked?.toId) ?? fallback?.to;
  if (!from || !to || from.id === to.id) return null;

  const currentId = desk.detail?.currentVersionId;
  const fields = diffVersions(from.copy, to.copy);
  return {
    from,
    to,
    fromOptions: sideOptions(versions, to),
    toOptions: sideOptions(versions, from),
    pickFrom: (version: EditorialVersion) => setPicked({ fromId: version.id, toId: to.id }),
    pickTo: (version: EditorialVersion) => setPicked({ fromId: from.id, toId: version.id }),
    fields,
    totals: diffTotals(fields),
    requests: requestsBetween(desk.detail, from.number, to.number),
    busy: desk.busy,
    /** «اعتمد ن{b}» */
    keep() {
      if (desk.busy) return;
      if (to.id !== currentId) desk.restore(to.id);
      onDone();
    },
    /** «رجّع ن{a}» */
    restore() {
      if (desk.busy) return;
      if (from.id !== currentId) desk.restore(from.id);
      onDone();
    },
  };
}

export type ComparePairState = NonNullable<ReturnType<typeof useComparePair>>;
