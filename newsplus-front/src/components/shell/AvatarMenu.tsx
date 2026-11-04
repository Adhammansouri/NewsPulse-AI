import { useRef, useState } from "react";
import type { UserRole } from "@newsplus/shared";
import { useSession } from "@/hooks/useSession";
import { useTheme } from "@/hooks/useTheme";
import type { Theme } from "@/services/themeStore";
import { Button } from "@/ui/Button";
import { Popover } from "@/ui/Popover";
import { Segmented, type SegmentedOption } from "@/ui/Segmented";
import { LogoutDialog } from "./LogoutDialog";

const ROLE_LABEL: Record<UserRole, string> = { admin: "مدير", editor: "محرر" };

const THEME_OPTIONS: ReadonlyArray<SegmentedOption<Theme>> = [
  { value: "light", label: "فاتح" },
  { value: "dark", label: "داكن" },
];

/** First letter of the display name («سارة» → «س»), as the boards' avatar. */
function initialOf(name: string): string {
  return Array.from(name.trim())[0] ?? "";
}

/**
 * Placement against the rail (`nav.rail` is its positioned container): bottom-aligned with the avatar,
 * opening over the content. `color` resets the rail's white text to the `.np` ink inside the card.
 */
const POPOVER_STYLE = {
  bottom: "16px",
  insetInlineStart: "calc(100% + 16px)",
  padding: "16px",
  gap: "14px",
  color: "var(--ink)",
} as const;

/**
 * Rail avatar (S02 §2): initial of `displayName` on the AI gradient. Opens a popover with the name, the role
 * label, the theme switch and «تسجيل الخروج», which opens the logout confirmation (LogoutDialog).
 */
export function AvatarMenu() {
  const session = useSession();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const avatarRef = useRef<HTMLButtonElement>(null);

  const user = session?.user;
  const name = user?.displayName || user?.identifier || "";
  const accountLabel = `حساب ${name}`;

  return (
    <>
      <button
        ref={avatarRef}
        className="avatar"
        type="button"
        aria-label={accountLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        style={{ marginTop: "8px" }}
        onClick={() => setOpen((value) => !value)}
      >
        {initialOf(name)}
      </button>
      <Popover
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={avatarRef}
        aria-label={accountLabel}
        className="col"
        style={POPOVER_STYLE}
      >
        <div className="row" style={{ gap: "12px" }}>
          <span className="avatar" style={{ border: 0 }}>
            {initialOf(name)}
          </span>
          <span className="col grow">
            <span style={{ fontWeight: 600 }}>{name}</span>
            {user && <span className="t-meta">{ROLE_LABEL[user.role]}</span>}
          </span>
        </div>
        <div className="col" style={{ gap: "6px" }}>
          <span className="t-label">المظهر</span>
          <Segmented block options={THEME_OPTIONS} value={theme} onChange={setTheme} role="group" aria-label="المظهر" />
        </div>
        <Button
          variant="danger"
          block
          onClick={() => {
            setOpen(false);
            setLogoutOpen(true);
          }}
        >
          تسجيل الخروج
        </Button>
      </Popover>
      <LogoutDialog open={logoutOpen} onClose={() => setLogoutOpen(false)} returnFocusRef={avatarRef} />
    </>
  );
}
