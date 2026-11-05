// MobDraft with «قارن» on: a version chip opens this action sheet — «قارن النسخ», and for an older version
// «استعادة النسخة {n}» (what the chip did before). No board draws it: MobSystem's sheet (`sheet col`, `m-list` of
// `m-item`) with the sprint's and the chips' own copy.
import { Icon } from "@/ui/Icon";
import { Sheet } from "@/ui/Sheet";
import { DRAFT_COPY } from "../studio/draft/copy";
import { DIFF_COPY } from "./copy";

export type SheetVersion = { id: string; number: number; current: boolean };

export function VersionSheet({
  version,
  onClose,
  onCompare,
  onRestore,
}: {
  version: SheetVersion | null;
  onClose: () => void;
  onCompare: () => void;
  onRestore: (versionId: string) => void;
}) {
  return (
    <Sheet open={version !== null} onClose={onClose} className="col" aria-label={DRAFT_COPY.versions} style={{ padding: "0 20px 28px", gap: "14px" }}>
      <div className="m-list">
        <button
          className="m-item"
          type="button"
          onClick={() => {
            onClose();
            onCompare();
          }}
        >
          <span className="ic-wrap ic-wrap--teal">
            <Icon name="swap" />
          </span>
          <span className="m-item__label">{DIFF_COPY.compareVersions}</span>
        </button>
        {version && !version.current && (
          <button
            className="m-item"
            type="button"
            onClick={() => {
              onClose();
              onRestore(version.id);
            }}
          >
            <span className="ic-wrap ic-wrap--teal">
              <Icon name="refresh" />
            </span>
            <span className="m-item__label">{DRAFT_COPY.restoreVersion(version.number)}</span>
          </button>
        )}
      </div>
    </Sheet>
  );
}
