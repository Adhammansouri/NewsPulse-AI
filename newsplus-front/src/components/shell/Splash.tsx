import { useIsMobile } from "@/hooks/useIsMobile";
import { PULSE_LINE_PRESETS } from "@/ui/PulseLine";

/**
 * The boards draw the splash pulse with their own navy-surface gradient (#2dd4bf → #38bdf8). AppRoot's
 * `#np-ai-grad` comes first in the document (and is the darker light-theme pair), so the splash keeps
 * the board's stops under its own id.
 */
const SPLASH_GRADIENT_ID = "np-splash-grad";

const LOGO_SHADOW = "0 0 0 1px rgb(255 255 255 / .14), 0 24px 60px -20px rgb(14 165 233 / .6)";

/** Splash / MobSplash root, sized to the viewport (the boards' 1440×900 / 390×844 frame). */
const ROOT_STYLE = {
  position: "relative",
  width: "100%",
  minHeight: "100dvh",
  display: "grid",
  placeItems: "center",
  overflow: "hidden",
  background: "#0c2340",
} as const;

function SplashPulse({ preset }: { preset: "240x40" | "200x36" }) {
  const p = PULSE_LINE_PRESETS[preset];
  return (
    <svg className="pulse-line" width={p.w} height={p.h} viewBox={`0 0 ${p.w} ${p.h}`} aria-hidden="true">
      <path className="base" d={p.d} style={p.baseStyle} />
      <path d={p.d} style={{ stroke: `url(#${SPLASH_GRADIENT_ID})` }} />
    </svg>
  );
}

/**
 * Session check screen (Splash / MobSplash boards, state «checking»). The boards' «offline» state is the
 * full-page `public/offline.html` served by the service worker.
 */
export function Splash({ state }: { state: "checking" }) {
  const isMobile = useIsMobile();
  if (state !== "checking") return null;

  const gradient = (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <linearGradient id={SPLASH_GRADIENT_ID} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2dd4bf" />
          <stop offset="1" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
    </svg>
  );

  if (isMobile) {
    return (
      <div style={ROOT_STYLE}>
        {gradient}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 50% 42%, rgb(14 165 233 / .22), transparent 50%)",
          }}
        />
        <div
          className="col fade-in"
          style={{ position: "relative", alignItems: "center", gap: "18px", color: "#fff" }}
          role="status"
        >
          <img
            src="/logo-icon.png"
            alt="Newsplus"
            style={{ width: "88px", height: "88px", borderRadius: "24px", boxShadow: LOGO_SHADOW }}
          />
          <b style={{ fontFamily: "var(--f-display)", fontSize: "26px" }}>Newsplus</b>
          <SplashPulse preset="200x36" />
        </div>
        <span
          style={{
            position: "absolute",
            bottom: "48px",
            insetInline: 0,
            textAlign: "center",
            fontSize: "13px",
            color: "#a9b8c9",
          }}
        >
          بنتأكد من جلستك…
        </span>
      </div>
    );
  }

  return (
    <div style={ROOT_STYLE}>
      {gradient}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 50% 40%, rgb(14 165 233 / .2), transparent 45%)",
        }}
      />
      <div
        className="col fade-in"
        style={{ position: "relative", alignItems: "center", gap: "22px", color: "#fff" }}
        role="status"
        aria-live="polite"
      >
        <img
          src="/logo-icon.png"
          alt="Newsplus"
          style={{ width: "96px", height: "96px", borderRadius: "26px", boxShadow: LOGO_SHADOW }}
        />
        <b style={{ fontFamily: "var(--f-display)", fontSize: "30px" }}>Newsplus</b>
        <SplashPulse preset="240x40" />
        <span style={{ fontSize: "14px", color: "#a9b8c9" }}>بنتأكد من جلستك ونجهّز غرفة الأخبار…</span>
      </div>
    </div>
  );
}
