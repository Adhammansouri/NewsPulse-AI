// «حوّله لمنشور سوشيال» (generate) and «استخدمها في منشور» (translate): the existing news summarize call
// with the text as `input`, then the result opens in the news studio (handoff `conversationId`).
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type { NewsLanguage } from "@newsplus/shared";
import type { DeskHandoffState } from "@/services/deskHandoff";
import { summarizeNews } from "@/services/newsService";
import { toolErrorMessage } from "@/services/toolErrors";
import { useToast } from "@/ui/Toast";

/** The summarize API accepts up to 8,000 characters of `input`. */
const SUMMARIZE_INPUT_MAX = 8_000;

export function useSocialPost() {
  const navigate = useNavigate();
  const toast = useToast();
  const mutation = useMutation({
    mutationFn: ({ text, language }: { text: string; language: NewsLanguage }) =>
      summarizeNews({ input: text.trim().slice(0, SUMMARIZE_INPUT_MAX), format: "social", language }),
    onSuccess: (data) => {
      const state: DeskHandoffState = data.conversationId ? { conversationId: data.conversationId } : {};
      navigate("/news", { state });
    },
    onError: (error) => toast.show(toolErrorMessage(error), { icon: "error-circle" }),
  });

  return {
    pending: mutation.isPending,
    start(text: string, language: NewsLanguage) {
      if (mutation.isPending || !text.trim()) return;
      mutation.mutate({ text, language });
    },
  };
}
