type BrandMarkProps = {
  size?: number;
  iconOnly?: boolean;
  className?: string;
};

export function BrandMark({ size = 34, iconOnly = false, className = "" }: BrandMarkProps) {
  return (
    <span className={`brandmark ${className}`}>
      <img src="/icons/logo-icon.png" alt="" width={size} height={size} className="brandmark-img" decoding="async" />
      {iconOnly ? null : (
        <span className="brandmark-word" translate="no">
          <span className="brandmark-n">News</span>
          <span className="brandmark-p">plus</span>
        </span>
      )}
    </span>
  );
}
