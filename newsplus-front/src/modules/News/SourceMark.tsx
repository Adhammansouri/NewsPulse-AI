import { useState } from "react";
import { sourceInitial, sourceTone } from "./newsFormat";
import { faviconUrl, sourceHost } from "./sourceLogos";

type SourceMarkProps = {
  id: string;
  name: string;
  url?: string;
  size?: number;
};

export function SourceMark({ id, name, url, size = 20 }: SourceMarkProps) {
  const host = sourceHost(id, url);
  const [failedHost, setFailedHost] = useState<string | null>(null);
  const box = { width: size, height: size, fontSize: size };

  if (!host || failedHost === host) {
    return (
      <span className="src-mark is-fallback" style={{ ...box, background: sourceTone(id || name) }} aria-hidden="true">
        {sourceInitial(name)}
      </span>
    );
  }

  return (
    <span className="src-mark" style={box} title={name}>
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
  size = 20,
}: {
  sources: Array<{ id: string; name: string; url?: string }>;
  max?: number;
  size?: number;
}) {
  const shown = sources.slice(0, max);
  if (shown.length === 0) return null;
  return (
    <span className="src-stack" aria-hidden="true">
      {shown.map((source) => (
        <SourceMark key={`${source.id}-${source.url ?? ""}`} id={source.id} name={source.name} url={source.url} size={size} />
      ))}
    </span>
  );
}
