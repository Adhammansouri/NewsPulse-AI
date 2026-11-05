// «حوّله لمنشور سوشيال» (generate) and «استخدمها في منشور» (translate): the existing news summarize call
// with the text as `input`, then the result opens in the news studio (handoff `conversationId`). S11's command
// palette writes from its query the same way («اكتب منشور سوشيال عن …», «سكريبت فيديو عن …»).
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type { NewsLanguage, NewsStoryFormat } from "@newsplus/shared";
import type { DeskHandoffState } from "@/services/deskHandoff";
import { summarizeNews } from "@/services/newsService";
import { useAiCooldown } from "@/hooks/useAiCooldown";
import { isSystemHandledError, toolErrorMessage } from "@/services/toolErrors";
import { useToast } from "@/ui/Toast";

/** The summarize API accepts up to 8,000 characters of `input`. */
const SUMMARIZE_INPUT_MAX = 8_000;

export function useSocialPost() {
  const navigate = useNavigate();
  const toast = useToast();
  const cooldown = useAiCooldown();
  const mutation = useMutation({
    mutationFn: ({ text, language, format }: { text: string; language: NewsLanguage; format: NewsStoryFormat }) =>
      summarizeNews({ input: text.trim().slice(0, SUMMARIZE_INPUT_MAX), format, language }),
    onSuccess: (data) => {
      const state: DeskHandoffState = data.conversationId ? { conversationId: data.conversationId } : {};
      navigate("/news", { state });
    },
    // A 401 / AI 429 already has its app-wide surface (session dialog, cooldown card).
    onError: (error) => {
      if (!isSystemHandledError(error)) toast.show(toolErrorMessage(error), { icon: "error-circle" });
    },
  });

  return {
    pending: mutation.isPending,
    /** S10: waits for the AI rate-limit cooldown. */
    blocked: cooldown.active,
    start(text: string, language: NewsLanguage, format: "social" | "video" = "social") {
      if (mutation.isPending || cooldown.active || !text.trim()) return;
      mutation.mutate({ text, language, format });
    },
  };
}
