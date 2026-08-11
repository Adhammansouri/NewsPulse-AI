import Link from "next/link";

type FeatureCardProps = {
  href: string;
  title: string;
  description: string;
  badge: string;
  accent: "teal" | "cyan" | "navy";
};

const accentClasses = {
  teal: "bg-teal-600/10 text-teal-600",
  cyan: "bg-cyan-500/10 text-cyan-500",
  navy: "bg-navy-900/10 text-navy-900",
};

export function FeatureCard({ href, title, description, badge, accent }: FeatureCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-600/30 hover:shadow-md"
    >
      <span
        className={`mb-4 inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${accentClasses[accent]}`}
      >
        {badge}
      </span>
      <h3 className="mb-2 text-lg font-semibold text-navy-900 group-hover:text-teal-600">
        {title}
      </h3>
      <p className="flex-1 text-sm leading-7 text-slate-600">{description}</p>
      <span className="mt-4 text-sm font-medium text-teal-600">ابدأ الآن ←</span>
    </Link>
  );
}
