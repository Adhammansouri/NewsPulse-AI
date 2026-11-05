import { useEffect, useId, type CSSProperties, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSessionExpired } from "@/hooks/useSessionExpired";
import { clearSession } from "@/services/sessionStore";
import { SYSTEM_COPY } from "@/services/toolErrors";
import { saveUnsentDrafts } from "@/services/unsentDrafts";
import { Dialog } from "@/ui/Dialog";
import { Icon } from "@/ui/Icon";

/** Desktop: a viewport layer for the scrim (as LogoutDialog), the `m-dialog` centred at its 390px-board width. */
const DESKTOP_LAYER_STYLE: CSSProperties = { position: "fixed", inset: 0 };
const DESKTOP_DIALOG_STYLE: CSSProperties = { insetInline: 0, width: "342px", marginInline: "auto" };

/**
 * MobSystem-session «الجلسة انتهت»: a 401 rejected the session (httpConfig → sessionStore.expireSession). The
 * screen stays behind the dialog; its unsent work (the revise dock, the generate form) is saved to sessionStorage
 * when the dialog opens and again on «سجّل الدخول», which ends the session — RequireAuth then sends the user to
 * /login with `from`, and the screen takes its work back after signing in. No Esc / scrim close: the only way
 * on is signing in again.
 */
export function SessionExpiredDialog() {
  const expired = useSessionExpired();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const titleId = useId();

  useEffect(() => {
    if (expired) saveUnsentDrafts();
  }, [expired]);

  const root = expired ? document.querySelector<HTMLElement>("div.np") : null;
  if (!expired || !root) return null;

  function signIn(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    saveUnsentDrafts();
    clearSession();
    queryClient.clear();
  }

  const dialog = (
    <Dialog open aria-labelledby={titleId} style={isMobile ? undefined : DESKTOP_DIALOG_STYLE}>
      <span className="ic-wrap" style={{ width: "52px", height: "52px", borderRadius: "16px", alignSelf: "center" }}>
        <Icon name="lock" size="lg" />
      </span>
      <h2 id={titleId} className="t-title">
        {SYSTEM_COPY.sessionTitle}
      </h2>
      <p className="t-small">{SYSTEM_COPY.sessionText}</p>
      <a className="btn btn--ink btn--block btn--lg" href="/login" style={{ marginTop: "6px" }} onClick={signIn}>
        {SYSTEM_COPY.sessionCta}
      </a>
    </Dialog>
  );

  return createPortal(isMobile ? dialog : <div style={DESKTOP_LAYER_STYLE}>{dialog}</div>, root);
}
