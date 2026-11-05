// Main-generating: the AI panel («المحرّر يكتب الآن», the format, pulse line, three steps, «إلغاء») next to the
// story title and a skeleton shaped like the format. Inline styles are the board's own.
import type { NewsSummaryFormat } from "@newsplus/shared";
import { AiPanel } from "@/ui/AiPanel";
import { AiSteps } from "@/ui/AiSteps";
import { Button } from "@/ui/Button";
import { PulseLine } from "@/ui/PulseLine";
import { DeskDraftSkeleton } from "./DraftSkeleton";
import { STUDIO_COPY } from "./formats";
import { useAiSteps } from "./useAiSteps";

export function StudioGenerating({
  format,
  name,
  steps,
  startedAt,
  storyTitle,
  onCancel,
}: {
  format: NewsSummaryFormat;
  name: string;
  steps: readonly [string, string, string];
  startedAt: number;
  storyTitle: string | null;
  onCancel: () => void;
}) {
  const aiSteps = useAiSteps(steps, startedAt);
  return (
    <div className="fade-in" style={{ flex: 1, overflow: "hidden", padding: "30px 36px", display: "flex", gap: "32px" }}>
      <AiPanel
        glow
        aria-live="polite"
        style={{
          width: "330px",
          flex: "none",
          alignSelf: "flex-start",
          padding: "22px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        <div className="col" style={{ gap: "4px" }}>
          <span className="ai-mark t-ai">{STUDIO_COPY.writingNow}</span>
          <h2 className="t-title">{name}</h2>
        </div>
        <PulseLine preset="286x44" />
        <AiSteps steps={aiSteps} />
        <Button variant="ghost" size="sm" onClick={onCancel} style={{ alignSelf: "flex-start" }}>
          {STUDIO_COPY.cancel}
        </Button>
      </AiPanel>
      <div className="grow col" style={{ gap: "14px", paddingTop: "4px" }}>
        {storyTitle && <p className="t-meta">{storyTitle}</p>}
        <DeskDraftSkeleton format={format} />
      </div>
    </div>
  );
}
