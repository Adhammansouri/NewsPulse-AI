// «… منذ آخر زيارة» (S07 §1): when the editor last left the home, per device (`newsplus-last-visit`).
import { useEffect, useState } from "react";

const STORAGE_KEY = "newsplus-last-visit";

function readLastVisit(): number | null {
  try {
    const at = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(at) && at > 0 ? at : null;
  } catch {
    return null;
  }
}

function writeLastVisit() {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    /* storage unavailable: the line stays hidden next time */
  }
}

/**
 * The previous visit's timestamp, read once when the home opens; the current time is stored when the
 * editor leaves it (another screen, a hidden tab or app, a closed page).
 */
export function useLastVisit(): number | null {
  const [lastVisit] = useState(readLastVisit);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") writeLastVisit();
    };
    window.addEventListener("pagehide", writeLastVisit);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", writeLastVisit);
      document.removeEventListener("visibilitychange", onHide);
      writeLastVisit();
    };
  }, []);

  return lastVisit;
}
