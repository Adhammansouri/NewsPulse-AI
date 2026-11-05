import { useId, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/useIsMobile";
import { logout } from "@/services/authService";
import { Button } from "@/ui/Button";
import { Dialog } from "@/ui/Dialog";
import { Icon } from "@/ui/Icon";

/** Desktop: a viewport layer for the scrim, so the dialog covers the whole app whatever opened it. */
const DESKTOP_LAYER_STYLE: CSSProperties = { position: "fixed", inset: 0 };
/** Desktop: the `m-dialog` centred at the width it has on the 390px MobSystem-logout board (390 − 2 × 24). */
const DESKTOP_DIALOG_STYLE: CSSProperties = { insetInline: 0, width: "342px", marginInline: "auto" };

/**
 * «تسجيل الخروج؟» confirmation (MobSystem-logout) — `m-dialog` on mobile, the same dialog centred on desktop.
 * Confirm: `POST /auth/logout` (authService.logout clears the session store), clear the query cache, go to `/login`.
 * Rendered at the end of the `.np` root so the scrim covers the rail / tab bar like the board.
 */
export function LogoutDialog(props: {
  open: boolean;
  onClose: () => void;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}) {
  const { open, onClose, returnFocusRef } = props;
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const titleId = useId();
  const [pending, setPending] = useState(false);

  const root = open ? document.querySelector<HTMLElement>("div.np") : null;
  if (!open || !root) return null;

  const close = () => {
    if (!pending) onClose();
  };

  const handleConfirm = async () => {
    if (pending) return;
    setPending(true);
    await logout();
    navigate("/login", { replace: true });
    queryClient.clear();
  };

  const dialog = (
    <Dialog
      open={open}
      onClose={pending ? undefined : onClose}
      returnFocusRef={returnFocusRef}
      aria-labelledby={titleId}
      style={isMobile ? undefined : DESKTOP_DIALOG_STYLE}
    >
      <span
        className="ic-wrap ic-wrap--breaking"
        style={{ width: "52px", height: "52px", borderRadius: "16px", alignSelf: "center" }}
      >
        <Icon name="logout" size="lg" />
      </span>
      <h2 id={titleId} className="t-title">
        تسجيل الخروج؟
      </h2>
      <p className="t-small">هتحتاج تدخل تاني على الجهاز ده. مسوداتك وذاكرة الفريق محفوظة.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "6px" }}>
        <Button variant="quiet" onClick={close}>
          إلغاء
        </Button>
        <Button variant="danger" aria-busy={pending || undefined} onClick={() => void handleConfirm()}>
          خروج
        </Button>
      </div>
    </Dialog>
  );

  return createPortal(isMobile ? dialog : <div style={DESKTOP_LAYER_STYLE}>{dialog}</div>, root);
}
