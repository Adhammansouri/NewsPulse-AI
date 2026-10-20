import { CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { useSyncExternalStore } from "react";
import { getToasts, subscribeToasts } from "./toast";

export function Toaster() {
  const items = useSyncExternalStore(subscribeToasts, getToasts, getToasts);
  return (
    <div className="toaster" role="status" aria-live="polite">
      {items.map((item) => (
        <div key={item.id} className={`toast ${item.tone === "error" ? "is-error" : ""} ${item.leaving ? "is-leaving" : ""}`}>
          {item.tone === "error" ? <WarningCircle size={18} weight="fill" aria-hidden="true" /> : <CheckCircle size={18} weight="fill" aria-hidden="true" />}
          {item.message}
        </div>
      ))}
    </div>
  );
}
