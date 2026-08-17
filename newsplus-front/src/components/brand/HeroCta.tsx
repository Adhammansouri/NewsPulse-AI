import { Link } from "react-router-dom";
import { HEADER_CTA } from "@/utils/constants";

export function HeroCta() {
  return (
    <Link to={HEADER_CTA.href} className="brand-btn mt-8">
      {HEADER_CTA.label}
    </Link>
  );
}
