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

export function SourceMarkStack({
  sources,
  max = 3,
  size = 18,
}: {
  sources: Array<{ id: string; name: string; url?: string }>;
  max?: number;
  size?: number;
}) {
  const shown = sources.slice(0, max);
  if (shown.length === 0) return null;

  return (
    <span className="news-logo-stack" aria-hidden="true">
      {shown.map((source) => (
        <SourceMark key={`${source.id}-${source.url ?? ""}`} id={source.id} name={source.name} url={source.url} size={size} />
      ))}
    </span>
  );
}
