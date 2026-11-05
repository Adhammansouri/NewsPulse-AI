// Main · studio footer: the chosen format and its hint, «الأرشيف», and the AI button named after the format
// with its `Ctrl ↵` hint — Ctrl/⌘+Enter presses it from anywhere in the studio. Inline styles are the board's own.
import { useEffect, useRef } from "react";
import { useAiCooldown } from "@/hooks/useAiCooldown";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { STUDIO_COPY, type FormatCopy } from "./formats";

export function StudioFooter({
  copy,
  hint,
  onArchive,
  onGenerate,
}: {
  copy: FormatCopy;
  /** «{hint} · من {sources} · بأسلوب فريقك» */
  hint: string;
  onArchive: () => void;
  onGenerate: () => void;
}) {
  // S10: disabled during the AI rate-limit cooldown (the action itself also waits for it).
  const cooldown = useAiCooldown();
  const generateRef = useRef(onGenerate);
  useEffect(() => {
    generateRef.current = onGenerate;
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || !(event.ctrlKey || event.metaKey) || event.repeat || event.defaultPrevented) return;
      event.preventDefault();
      generateRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <footer
      className="row"
      style={{ gap: "12px", padding: "14px 34px", background: "var(--surface)", borderTop: "1px solid var(--line)" }}
    >
      <span className="ic-wrap ic-wrap--ai">
        <Icon name="sparkle-double" />
      </span>
      <div className="col grow">
        <span style={{ fontWeight: 700 }}>{copy.name}</span>
        <span className="t-meta">{hint}</span>
      </div>
      <Button variant="ghost" onClick={onArchive}>
        <Icon name="history" />
        {STUDIO_COPY.archive}
      </Button>
      <Button variant="ai" size="lg" disabled={cooldown.active} onClick={onGenerate} style={{ minWidth: "230px" }} kbd={STUDIO_COPY.kbd}>
        <Icon name="sparkle" />
        {copy.action}
      </Button>
    </footer>
  );
}
