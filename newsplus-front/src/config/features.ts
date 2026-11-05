/**
 * Feature flags for redesign surfaces that ship in later sprints (docs/redesign/sprints).
 * Each flag is turned on by the sprint that delivers the feature.
 */
export const features = {
  /** «سير العمل» board, rail item and «المزيد» row — S15. */
  workflow: true,
  /** Keyboard shortcuts sheet and the rail keyboard button — S11. */
  shortcuts: false,
  /** «تطور القصة» story timeline — S14. */
  timeline: true,
  /** «قارن» version diff — S14. */
  diff: true,
  /** «فحص ونشر» publish check — S12. */
  publishCheck: true,
} as const;

export type FeatureFlag = keyof typeof features;
