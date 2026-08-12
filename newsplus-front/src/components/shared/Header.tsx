import { Link } from "react-router-dom";
import { NAV_ITEMS } from "@/utils/constants";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/icons/logo-icon.png"
            alt="Newsplus"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <img
            src="/logo-horizontal.png"
            alt="Newsplus"
            width={140}
            height={28}
            className="hidden h-7 w-auto sm:block"
          />
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-navy-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
