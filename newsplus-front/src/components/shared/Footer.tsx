import { Link } from "react-router-dom";
import { BrandMark } from "@/components/shared/BrandMark";
import { HEADER_CTA, NAV_ITEMS } from "@/utils/constants";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white">
      <div className="pointer-events-none h-0.5 bg-gradient-to-l from-teal-600 via-cyan-500 to-teal-600" />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/">
              <BrandMark showTagline size="sm" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-7 text-slate-600">
              مساعد إخباري بالذكاء الاصطناعي — من الخبر الخام إلى محتوى جاهز للنشر.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-navy-900">التنقل</h2>
            <ul className="space-y-2">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className="text-sm text-slate-600 transition hover:text-teal-600"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-navy-900">ابدأ</h2>
            <p className="mb-4 text-sm leading-7 text-slate-600">
              أنشئ تقارير ومقالات إخبارية بأسلوب تحريري احترافي.
            </p>
            <Link
              to={HEADER_CTA.href}
              className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40 focus-visible:ring-offset-2"
            >
              {HEADER_CTA.label}
            </Link>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-slate-200 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Newsplus. جميع الحقوق محفوظة.</p>
          <p>مدعوم بالذكاء الاصطناعي</p>
        </div>
      </div>
    </footer>
  );
}
