import { Link } from "react-router-dom";

type FeatureCardProps = {
  href: string;
  title: string;
  description: string;
  badge: string;
  accent: "teal" | "cyan" | "navy";
  variant?: "default" | "featured";
  index?: number;
};

const badgeClasses = {
  teal: "brand-badge-teal",
  cyan: "brand-badge-cyan",
  navy: "brand-badge-navy",
};

export function FeatureCard({
  href,
  title,
  description,
  badge,
  accent,
  variant = "default",
  index = 0,
}: FeatureCardProps) {
  const featured = variant === "featured";

  return (
    <Link
      to={href}
      className={[
        "group brand-panel flex flex-col transition duration-200 brand-fade-in",
        "hover:-translate-y-0.5 hover:border-teal-600/30 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/30 focus-visible:ring-offset-2",
        featured ? "p-8 sm:p-10 lg:flex-row lg:items-center lg:gap-10" : "p-6",
      ].join(" ")}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className={featured ? "flex-1" : ""}>
        <span className={`brand-badge mb-4 ${badgeClasses[accent]}`}>{badge}</span>
        <h3
          className={[
            "brand-text-primary font-semibold group-hover:text-teal-600",
            featured ? "mb-3 text-2xl" : "mb-2 text-lg",
          ].join(" ")}
        >
          {title}
        </h3>
        <p className="brand-body text-sm">{description}</p>
        <span className="brand-accent-text mt-5 inline-flex text-sm font-medium">
          ابدأ الآن
          <span className="me-1 transition-transform group-hover:-translate-x-0.5" aria-hidden="true">
            ←
          </span>
        </span>
      </div>

      {featured && (
        <div className="mt-6 flex shrink-0 items-center justify-center lg:mt-0">
          <div className="brand-bg-muted flex h-28 w-28 items-center justify-center rounded-xl ring-1 brand-border-default sm:h-32 sm:w-32">
            <img src="/icons/logo-icon.png" alt="" width={96} height={96} className="rounded-lg" />
          </div>
        </div>
      )}
    </Link>
  );
}
