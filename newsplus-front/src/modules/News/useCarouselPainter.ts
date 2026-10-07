import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { CarouselSlide, EditorialConversationDetail, NewsSummarizeData } from "@newsplus/shared";
import { renderCarouselSlide } from "@/services/newsService";

const paintsStarted = new Set<string>();

function slideKey(versionId: string, index: number) {
  return `${versionId}:${index}`;
}

export function useCarouselPainter(summary: NewsSummarizeData | undefined) {
  const queryClient = useQueryClient();
  const inflight = useRef(new Set<string>());
  const summaryRef = useRef(summary);
  const [painting, setPainting] = useState<string[]>([]);
  const [overlay, setOverlay] = useState<Record<string, CarouselSlide>>({});
  summaryRef.current = summary;

  const versionId = summary?.versionId;
  const conversationId = summary?.conversationId;

  const slides = useMemo(() => {
    const source = summary?.carousel?.slides ?? [];
    if (!versionId) return source;
    return source.map((slide) => {
      const local = overlay[slideKey(versionId, slide.index)];
      if (!local) return slide;
      if (local.status === "failed" && !local.assetId && slide.assetId) return slide;
      return local;
    });
  }, [overlay, summary?.carousel?.slides, versionId]);

  const paint = useCallback(
    async (index: number) => {
      const current = summaryRef.current;
      const id = current?.conversationId;
      const version = current?.versionId;
      if (!id || !version || current.format !== "carousel") return;
      const key = slideKey(version, index);
      if (inflight.current.has(key) || paintsStarted.has(key)) return;
      paintsStarted.add(key);
      inflight.current.add(key);
      setPainting([...inflight.current]);
      try {
        const copy = await renderCarouselSlide({ conversationId: id, versionId: version, index });
        const slide = copy.carousel?.slides.find((item) => item.index === index);
        if (slide) setOverlay((prev) => ({ ...prev, [key]: slide }));
        queryClient.setQueryData<EditorialConversationDetail>(["editorial-conversation", id], (existing) => {
          if (!existing || existing.currentVersionId !== version) return existing;
          return {
            ...existing,
            title: copy.title,
            copy,
            versions: existing.versions.map((item) => (item.id === version ? { ...item, copy } : item)),
          };
        });
      } catch {
        await queryClient.refetchQueries({ queryKey: ["editorial-conversation", id] });
        const fresh = queryClient.getQueryData<EditorialConversationDetail>(["editorial-conversation", id]);
        const serverSlide = fresh?.copy.carousel?.slides.find((item) => item.index === index);
        if (serverSlide?.assetId) return;
        const previous = summaryRef.current?.carousel?.slides.find((item) => item.index === index);
        if (previous) {
          setOverlay((prev) => ({
            ...prev,
            [key]: { ...previous, status: "failed", mismatch: "تعذّر رسم الشريحة" },
          }));
        }
      } finally {
        paintsStarted.delete(key);
        inflight.current.delete(key);
        setPainting([...inflight.current]);
      }
    },
    [queryClient],
  );

  useEffect(() => {
    if (!conversationId || !versionId || summary?.format !== "carousel") return;
    const pending = slides.filter(
      (slide) =>
        slide.status === "pending" &&
        !inflight.current.has(slideKey(versionId, slide.index)) &&
        !paintsStarted.has(slideKey(versionId, slide.index)),
    );
    const running = [...inflight.current].filter((key) => key.startsWith(`${versionId}:`)).length;
    for (const slide of pending.slice(0, Math.max(0, 2 - running))) {
      void paint(slide.index);
    }
  }, [conversationId, paint, slides, summary?.format, versionId]);

  const paintingIndexes = painting
    .filter((key) => (versionId ? key.startsWith(`${versionId}:`) : false))
    .map((key) => Number(key.slice(key.lastIndexOf(":") + 1)));

  return { slides, painting: paintingIndexes, redraw: paint };
}
