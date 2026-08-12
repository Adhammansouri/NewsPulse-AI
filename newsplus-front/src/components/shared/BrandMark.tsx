type BrandMarkProps = {
  showTagline?: boolean;
  size?: "sm" | "md";
};

const sizeStyles = {
  sm: {
    icon: 32,
    title: "text-base",
    tagline: "text-[10px]",
    gap: "gap-2",
  },
  md: {
    icon: 36,
    title: "text-lg sm:text-xl",
    tagline: "text-[11px]",
    gap: "gap-2.5",
  },
} as const;

export function BrandMark({ showTagline = false, size = "md" }: BrandMarkProps) {
  const styles = sizeStyles[size];

  return (
    <div className={`flex items-center ${styles.gap}`}>
      <img
        src="/icons/logo-icon.png"
        alt=""
        width={styles.icon}
        height={styles.icon}
        className="rounded-lg shadow-sm ring-1 ring-slate-200/60"
      />

      <div className="flex flex-col leading-none">
        <span className={`${styles.title} font-bold tracking-tight`}>
          <span className="text-navy-900">News</span>
          <span className="text-teal-600">plus</span>
        </span>
        {showTagline && (
          <span className={`${styles.tagline} mt-1 font-medium text-slate-500`}>
            مساعد إخباري بالذكاء الاصطناعي
          </span>
        )}
      </div>
    </div>
  );
}
