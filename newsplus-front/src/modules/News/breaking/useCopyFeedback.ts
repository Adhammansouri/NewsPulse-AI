// «نسخ» → «تم النسخ» for as long as a toast stays up (the Main board's copy feedback); a refused clipboard
// shows the studio's «تعذّر النسخ» toast. Shared by breaking mode and the home's «انسخ الملخص».
import { useEffect, useRef, useState } from "react";
import { copyText } from "@/services/toolErrors";
import { TOAST_DURATION_MS, useToast } from "@/ui/Toast";
import { BREAKING_COPY } from "./breakingModel";

export function useCopyFeedback<K extends string>() {
  const toast = useToast();
  const [copied, setCopied] = useState<K | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy(key: K, text: string) {
    try {
      await copyText(text);
    } catch {
      toast.show(BREAKING_COPY.copyFailed, { icon: "error-circle" });
      return;
    }
    window.clearTimeout(timer.current);
    setCopied(key);
    timer.current = window.setTimeout(() => setCopied(null), TOAST_DURATION_MS);
  }

  return { copied, copy };
}
