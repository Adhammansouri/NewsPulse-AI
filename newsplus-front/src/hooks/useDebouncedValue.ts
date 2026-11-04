import { useEffect, useState } from "react";

/**
 * `value`, held back until it has stopped changing for `delayMs` (S04 §8: the headline search enters the
 * feed query key only after a 300ms pause, so typing fires one request per pause, not one per keystroke).
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return settled;
}
