import { useState } from "react";
import { sourceInitial, sourceTone } from "./newsFormat";
import { faviconUrl, sourceHost } from "./sourceLogos";

type SourceMarkProps = {
  id: string;
  name: string;
  url?: string;
  size?: number;
};

export function SourceMark({ id, name, url, size = 18 }: SourceMarkProps) {
  const host = sourceHost(id, url);
  const [failedHost, setFailedHost] = useState<string | null>(null);

  if (!host || failedHost === host) {
    return (
      <span
        className="news-source-mark news-source-mark--fallback"
        style={{ width: size, height: size, background: sourceTone(id) }}
        aria-hidden="true"
      >
        {sourceInitial(name)}
      </span>
    );
  }

  return (
    <span className="news-source-mark" style={{ width: size, height: size }} title={name}>
      <img
        src={faviconUrl(host)}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        key={host}
        onError={() => setFailedHost(host)}
      />
    </span>
  );
}
