// «المحرّر يكتب الآن» steps (S05 §2): the timing is cosmetic — step 1 → 2 at 650 ms, 2 → 3 at 1350 ms (Main
// `run()`); the last step stays active until the response arrives and is never marked done early.
import { useEffect, useReducer } from "react";
import type { AiStep } from "@/ui/AiSteps";

const STEP_AT_MS = [650, 1350] as const;

function stepIndex(elapsed: number): number {
  return STEP_AT_MS.filter((at) => elapsed >= at).length;
}

/** The three steps for a run that started at `startedAt` (epoch ms). */
export function useAiSteps(texts: readonly [string, string, string], startedAt: number): AiStep[] {
  const [, rerender] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    const timers = STEP_AT_MS.map((at) => window.setTimeout(rerender, Math.max(0, startedAt + at - Date.now())));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [startedAt]);

  const active = stepIndex(Date.now() - startedAt);
  return texts.map((label, index) => ({
    label,
    status: index < active ? "done" : index === active ? "active" : "todo",
  }));
}
