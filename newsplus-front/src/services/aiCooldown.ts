// S10 §1: the AI rate-limit cooldown («استراحة قصيرة للمحرّر»). The API layer (httpConfig) starts it when an AI
// route answers 429 with `Retry-After`; every AI button reads it through `useAiCooldown()` and stays disabled
// until it reaches 0. One app-wide store, so a 429 on one screen pauses AI everywhere while browsing keeps working.

export type AiCooldown = {
  /** Whole seconds left (≥ 1 while the cooldown runs). */
  remaining: number;
  /** The server's `Retry-After` when the cooldown started: the ring drains from it. */
  total: number;
};

let until = 0;
let total = 0;
let snapshot: AiCooldown | null = null;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function secondsLeft(now = Date.now()) {
  return Math.max(0, Math.ceil((until - now) / 1000));
}

/** Recomputes the snapshot; a new object only when the whole-second count changes (stable for React). */
function tick() {
  const remaining = secondsLeft();
  if (remaining <= 0) {
    clearInterval(timer);
    timer = undefined;
    until = 0;
    if (snapshot !== null) {
      snapshot = null;
      emit();
    }
    return;
  }
  if (snapshot?.remaining !== remaining || snapshot.total !== total) {
    snapshot = { remaining, total };
    emit();
  }
}

/**
 * Starts (or extends) the cooldown from a 429's `Retry-After` seconds. A shorter value never cuts a running
 * cooldown short: the server's latest answer for the longest wait wins.
 */
export function startAiCooldown(retryAfterSeconds: number) {
  if (!Number.isFinite(retryAfterSeconds) || retryAfterSeconds <= 0) return;
  const next = Date.now() + retryAfterSeconds * 1000;
  if (next <= until) return;
  until = next;
  total = Math.ceil(retryAfterSeconds);
  if (timer === undefined) timer = setInterval(tick, 250);
  tick();
}

/** Ends the cooldown now (tests / QA). */
export function clearAiCooldown() {
  until = 0;
  tick();
}

export function getAiCooldown(): AiCooldown | null {
  return snapshot;
}

export function subscribeAiCooldown(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
