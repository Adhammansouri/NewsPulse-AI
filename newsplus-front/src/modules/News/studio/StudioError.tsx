// A generation that failed, shown above the formats with the editor's choice kept. S10: every case is the shared
// ErrorSurface (States `errors[]` / MobSystem): «المحرّر ما قدرش يكمّل» + «أعد المحاولة», the quota notice / sheet,
// nothing for a 401 (the session dialog) or a 429 (the cooldown card).
import type { CSSProperties } from "react";
import { ErrorSurface } from "@/ui/ErrorSurface";

export function StudioError({ error, onRetry, style }: { error: unknown; onRetry: () => void; style?: CSSProperties }) {
  return <ErrorSurface error={error} onRetry={onRetry} style={style} />;
}
