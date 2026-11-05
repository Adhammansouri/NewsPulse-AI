import { useNow } from "@/hooks/useNow";
import { elapsedClock } from "./breakingModel";

/** The live «٠٠:٤٢» of the breaking bar, on its own so only it re-renders every second. */
export function Elapsed({ since }: { since: number }) {
  const now = useNow(1000);
  return <span className="num">{elapsedClock(now.getTime() - since)}</span>;
}
