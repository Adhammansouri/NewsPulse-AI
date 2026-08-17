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
        className="rounded-lg shadow-sm ring-1 ring-[color-mix(in_srgb,var(--border-default)_60%,transparent)]"
      />

      <div className="flex flex-col leading-none">
        <span className={`${styles.title} font-bold tracking-tight`}>
          <span className="brand-logo-n">News</span>
          <span className="brand-logo-p">plus</span>
        </span>
        {showTagline && (
          <span className={`${styles.tagline} brand-text-secondary mt-1 font-medium`}>
            مساعد إخباري بالذكاء الاصطناعي
          </span>
        )}
      </div>
    </div>
  );
}
