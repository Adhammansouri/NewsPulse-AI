// The home's command panel «ابدأ من رابط أو فكرة» (S07 §2): the text, URL detection, the hand-offs to
// /translate and /generate (deskHandoff state, as their pages read it) and the AI button — the existing
// summarize call with `format: "social"`, whose draft opens in the news studio (useSocialPost).
import { useRef, useState } from "react";
import { urlHost } from "@/modules/Generate/generateDesk";
import { useSocialPost } from "@/modules/Generate/useSocialPost";
import type { DeskHandoffState } from "@/services/deskHandoff";

/** The summarize API reads the input as a page to fetch only when the whole input is one http(s) URL. */
const WHOLE_URL = /^https?:\/\/\S+$/i;

export function useCompose({ online }: { online: boolean }) {
  const [text, setText] = useState("");
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const social = useSocialPost();

  const input = text.trim();
  const host = WHOLE_URL.test(input) ? urlHost(input) : "";
  const isUrl = Boolean(host);

  return {
    text,
    setText,
    fieldRef,
    /** «رابط من alarabiya.net» — the URL's domain, "" for a topic. */
    host,
    isUrl,
    aiLabel: isUrl ? "منشور سوشيال من الرابط" : "منشور سوشيال",
    translateState: (input ? { source: input } : undefined) satisfies DeskHandoffState | undefined,
    generateState: (input ? { prompt: input } : undefined) satisfies DeskHandoffState | undefined,
    pending: social.pending,
    /** Offline the editor can't run (MobHome-offline); the hand-offs stay available. */
    aiBlocked: !online,
    startAi() {
      if (!online) return;
      if (!input) {
        fieldRef.current?.focus();
        return;
      }
      social.start(input, "ar");
    },
  };
}

export type Compose = ReturnType<typeof useCompose>;
