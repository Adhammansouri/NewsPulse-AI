import { Link } from "react-router-dom";
import { BrandMark } from "@/components/shared/BrandMark";
import { NAV_ITEMS } from "@/utils/constants";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="brand-footer">
      <div className="brand-footer__inner">
        <div className="brand-footer__brand">
          <BrandMark size="sm" />
          <p className="brand-footer__copy">© {year} Newsplus. جميع الحقوق محفوظة.</p>
        </div>

        <nav className="brand-footer__nav" aria-label="روابط التذييل">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} to={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
