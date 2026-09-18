import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useSession } from "@/hooks/useSession";

type PushOptInButtonProps = {
  className?: string;
};

export function PushOptInButton({ className }: PushOptInButtonProps = {}) {
  const session = useSession();
  const { status, enable } = usePushNotifications();

  if (
    !session ||
    status === "unsupported" ||
    status === "ios_needs_install" ||
    status === "vapid_off"
  ) {
    return null;
  }

  const label =
    status === "subscribed"
      ? "الإشعارات مفعّلة"
      : status === "blocked"
        ? "الإشعارات محظورة"
        : status === "busy"
          ? "جاري التفعيل"
          : "تفعيل الإشعارات";

  return (
    <button
      type="button"
      className={className ?? "brand-header-icon-btn"}
      onClick={() => void enable()}
      aria-label={label}
      title={label}
      aria-pressed={status === "subscribed"}
      disabled={status === "busy" || status === "blocked" || status === "subscribed"}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 20a2 2 0 0 0 4 0" strokeLinecap="round" />
      </svg>
    </button>
  );
}
