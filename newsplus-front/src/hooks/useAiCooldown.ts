import { useSyncExternalStore } from "react";
import { getAiCooldown, subscribeAiCooldown, type AiCooldown } from "@/services/aiCooldown";

export type AiCooldownState = {
  /** An AI rate limit is running: AI buttons are disabled and their actions do nothing. */
  active: boolean;
  /** Whole seconds left (0 when inactive). */
  remaining: number;
  /** The `Retry-After` the cooldown started from (0 when inactive). */
  total: number;
};

const IDLE: AiCooldownState = { active: false, remaining: 0, total: 0 };
let lastSource: AiCooldown | null = null;
let lastState: AiCooldownState = IDLE;

function read(): AiCooldownState {
  const current = getAiCooldown();
  if (current === lastSource) return lastState;
  lastSource = current;
  lastState = current ? { active: true, remaining: current.remaining, total: current.total } : IDLE;
  return lastState;
}

/**
 * S10: the AI rate-limit cooldown (server `Retry-After`), ticking once per second while it runs.
 * `const { active } = useAiCooldown();` → `disabled={active}` on every AI button, and guard the action.
 */
export function useAiCooldown(): AiCooldownState {
  return useSyncExternalStore(subscribeAiCooldown, read, () => IDLE);
}
