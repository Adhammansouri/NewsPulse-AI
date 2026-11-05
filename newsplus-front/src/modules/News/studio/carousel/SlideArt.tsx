// A slide's painted image (`GET /news/carousel/assets/…`, the composed poster) as the `slide__art` layer. The
// poster already carries the headline, banner and Newsplus mark, so the board's text layers give way to it and the
// slide takes the poster's own proportions. The object URL lives as long as the slide shows it.
import { useEffect, useState, type CSSProperties } from "react";
import { useQuery, type QueryClient } from "@tanstack/react-query";
import type { CarouselSlide } from "@newsplus/shared";
import { fetchCarouselAsset } from "@/services/newsService";

function assetQuery(conversationId: string, assetId: string) {
  return {
    queryKey: ["carousel-asset", conversationId, assetId],
    queryFn: () => fetchCarouselAsset(conversationId, assetId),
    staleTime: Infinity,
  } as const;
}

/** The poster blob (cached), e.g. for «تنزيل الصور». */
export function loadSlideImage(queryClient: QueryClient, conversationId: string, assetId: string) {
  return queryClient.fetchQuery(assetQuery(conversationId, assetId));
}

export type Poster = { url: string; ratio: number };

/** The slide's poster once its image is loaded (null while painting, before it loads, or without one). */
export function useSlidePoster(conversationId: string | undefined, slide: CarouselSlide, show: boolean): Poster | null {
  const assetId = slide.assetId;
  const enabled = Boolean(conversationId && assetId && show);
  const query = useQuery({
    ...assetQuery(conversationId ?? "", assetId ?? ""),
    enabled,
  });
  const blob = enabled ? query.data : undefined;
  const [poster, setPoster] = useState<Poster | null>(null);

  useEffect(() => {
    if (!blob) {
      setPoster(null);
      return;
    }
    const url = URL.createObjectURL(blob);
    let live = true;
    const image = new Image();
    image.onload = () => {
      if (live && image.naturalWidth > 0 && image.naturalHeight > 0) {
        setPoster({ url, ratio: image.naturalWidth / image.naturalHeight });
      }
    };
    image.src = url;
    return () => {
      live = false;
      setPoster(null);
      URL.revokeObjectURL(url);
    };
  }, [blob]);

  return poster;
}

/** The art of a slide without a poster yet (or whose poster failed): the painting slide's navy, still. */
export const BARE_ART: CSSProperties = { background: "var(--navy-2)" };

/** `slide__art` showing the poster. */
export function PosterArt({ poster, label }: { poster: Poster; label: string }) {
  const style: CSSProperties = { backgroundImage: `url("${poster.url}")`, backgroundSize: "cover", backgroundPosition: "center" };
  return <span className="slide__art" style={style} role="img" aria-label={label} />;
}

/** The figure's proportions when it shows a poster. */
export function posterFrame(poster: Poster | null): CSSProperties | undefined {
  return poster ? { aspectRatio: String(poster.ratio) } : undefined;
}
