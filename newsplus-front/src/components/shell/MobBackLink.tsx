import type { MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Icon } from "@/ui/Icon";

/**
 * The «رجوع» icon link of the mobile detail screens (MobNotif, MobUsage `m-head__row`): back to the previous
 * screen when the app navigated here, otherwise to «المزيد» (the board's `href`).
 */
export function MobBackLink() {
  const location = useLocation();
  const navigate = useNavigate();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (location.key === "default") return;
    event.preventDefault();
    navigate(-1);
  }

  return (
    <Link className="icon-btn" to="/more" aria-label="رجوع" style={{ marginInlineStart: "-10px" }} onClick={handleClick}>
      <Icon name="arrow-back" />
    </Link>
  );
}
