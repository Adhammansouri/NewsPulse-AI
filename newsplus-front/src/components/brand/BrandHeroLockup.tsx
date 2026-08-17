export function BrandHeroLockup() {
  return (
    <div className="brand-hero-lockup">
      <img
        src="/logo-icon.png"
        alt=""
        width={72}
        height={72}
        className="brand-hero-lockup__icon"
        decoding="async"
      />
      <p className="brand-hero-lockup__wordmark" aria-label="Newsplus">
        <span className="brand-hero-lockup__news">News</span>
        <span className="brand-hero-lockup__plus">plus</span>
      </p>
    </div>
  );
}