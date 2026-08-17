import { Link } from "react-router-dom";
import { BrandMark } from "@/components/shared/BrandMark";
import { HEADER_CTA, NAV_ITEMS } from "@/utils/constants";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="brand-bg-surface mt-auto border-t brand-border-default">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_auto_auto]">
          <div>
            <BrandMark showTagline size="sm" />
            <p className="brand-body mt-4 text-sm">
              مساعد إخباري بالذكاء الاصطناعي — من الخبر الخام إلى محتوى جاهز للنشر.
            </p>
          </div>

          <div>
            <p className="brand-text-primary mb-3 text-sm font-semibold">التنقل</p>
            <ul className="space-y-2">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link to={item.href} className="brand-nav-link text-sm hover:text-teal-600">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="brand-text-primary mb-3 text-sm font-semibold">ابدأ</p>
            <Link to={HEADER_CTA.href} className="brand-btn">
              {HEADER_CTA.label}
            </Link>
          </div>
        </div>

        <div className="brand-text-secondary mt-10 flex flex-col gap-2 border-t brand-border-default pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Newsplus. جميع الحقوق محفوظة.</p>
          <p className="opacity-75">مدعوم بالذكاء الاصطناعي</p>
        </div>
      </div>
    </footer>
  );
}
