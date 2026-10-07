import { useEffect, useState } from "react";
import { CircleNotch } from "@phosphor-icons/react";
import type { CarouselSlide } from "@newsplus/shared";
import { fetchCarouselAsset } from "@/services/newsService";

export function SlideFrame({
  conversationId,
  slide,
  painting,
}: {
  conversationId: string;
  slide: CarouselSlide;
  painting: boolean;
}) {
  const [url, setUrl] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!conversationId || !slide.assetId) {
      setUrl("");
      setFailed(false);
      return;
    }
    let objectUrl = "";
    let cancel = false;
    setFailed(false);
    void fetchCarouselAsset(conversationId, slide.assetId)
      .then((blob) => {
        if (cancel) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancel) setFailed(true);
      });
    return () => {
      cancel = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [conversationId, slide.assetId]);

  return (
    <div className={`news-carousel-art ${painting ? "is-painting" : ""}`}>
      {url ? <img src={url} alt={slide.headline} /> : null}
      {!url && !failed ? (
        <p className="news-carousel-wait">
          <CircleNotch className="news-spin" size={18} aria-hidden="true" />
          {slide.status === "failed" ? "تعذّر الرسم" : `جاري رسم الشريحة ${slide.index + 1}… قد يستغرق دقائق`}
        </p>
      ) : null}
      {failed ? <p className="news-carousel-wait">تعذّر عرض الصورة</p> : null}
      {painting && url ? (
        <p className="news-carousel-wait is-overlay">
          <CircleNotch className="news-spin" size={18} aria-hidden="true" />
          جاري إعادة الرسم
        </p>
      ) : null}
    </div>
  );
}
