// The format tiles' platform shapes, copied exactly from the reference boards: Main (desktop: social tiles
// 64px, web tiles 30px) and MobStory (mobile: 56px with a 2.2 stroke, web tiles 22px — simplified there).
import type { ReactElement } from "react";
import type { NewsStoryFormat } from "@newsplus/shared";

const SURFACE_FILL = { fill: "var(--surface)" } as const;

/** Main `tile__shape` SVGs. */
export const DESK_SHAPES: Record<NewsStoryFormat, ReactElement> = {
  social: (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
      <rect x="14" y="8" width="36" height="48" rx="6" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="19" y="13" width="26" height="20" rx="3" fill="currentColor" opacity=".25" />
      <rect x="19" y="38" width="22" height="3" rx="1.5" fill="currentColor" />
      <rect x="19" y="45" width="15" height="3" rx="1.5" fill="currentColor" opacity=".5" />
    </svg>
  ),
  video: (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
      <rect x="20" y="4" width="24" height="56" rx="6" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M29 25l9 6-9 6z" fill="currentColor" />
      <rect x="24" y="48" width="16" height="3" rx="1.5" fill="currentColor" opacity=".5" />
    </svg>
  ),
  carousel: (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
      <rect x="26" y="14" width="28" height="36" rx="5" fill="currentColor" opacity=".18" />
      <rect x="18" y="12" width="28" height="40" rx="5" fill="currentColor" opacity=".32" />
      <rect x="10" y="10" width="28" height="44" rx="5" style={SURFACE_FILL} stroke="currentColor" strokeWidth="2" />
      <rect x="15" y="38" width="18" height="3" rx="1.5" fill="currentColor" />
    </svg>
  ),
  desk: (
    <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden="true">
      <rect x="14" y="8" width="36" height="48" rx="4" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <rect x="21" y="17" width="22" height="5" rx="2" fill="currentColor" />
      <rect x="21" y="30" width="22" height="3" rx="1.5" fill="currentColor" opacity=".55" />
      <rect x="21" y="38" width="15" height="3" rx="1.5" fill="currentColor" opacity=".55" />
    </svg>
  ),
  bulletin: (
    <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden="true">
      <rect x="6" y="22" width="52" height="20" rx="5" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <rect x="13" y="29" width="30" height="6" rx="3" fill="currentColor" />
    </svg>
  ),
  facts: (
    <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="15" cy="18" r="4.5" fill="currentColor" />
      <circle cx="15" cy="32" r="4.5" fill="currentColor" />
      <circle cx="15" cy="46" r="4.5" fill="currentColor" />
      <rect x="26" y="16" width="28" height="4" rx="2" fill="currentColor" opacity=".55" />
      <rect x="26" y="30" width="24" height="4" rx="2" fill="currentColor" opacity=".55" />
      <rect x="26" y="44" width="20" height="4" rx="2" fill="currentColor" opacity=".55" />
    </svg>
  ),
  context: (
    <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="21" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <path d="M40 24l-5 11-11 5 5-11z" fill="currentColor" />
    </svg>
  ),
};

/** MobStory `tile__shape` SVGs. */
export const MOB_SHAPES: Record<NewsStoryFormat, ReactElement> = {
  social: (
    <svg width="56" height="56" viewBox="0 0 64 64" aria-hidden="true">
      <rect x="14" y="8" width="36" height="48" rx="6" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <rect x="19" y="13" width="26" height="20" rx="3" fill="currentColor" opacity=".25" />
      <rect x="19" y="38" width="22" height="3" rx="1.5" fill="currentColor" />
      <rect x="19" y="45" width="15" height="3" rx="1.5" fill="currentColor" opacity=".5" />
    </svg>
  ),
  video: (
    <svg width="56" height="56" viewBox="0 0 64 64" aria-hidden="true">
      <rect x="20" y="4" width="24" height="56" rx="6" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="M29 25l9 6-9 6z" fill="currentColor" />
    </svg>
  ),
  carousel: (
    <svg width="56" height="56" viewBox="0 0 64 64" aria-hidden="true">
      <rect x="26" y="14" width="28" height="36" rx="5" fill="currentColor" opacity=".18" />
      <rect x="18" y="12" width="28" height="40" rx="5" fill="currentColor" opacity=".32" />
      <rect x="10" y="10" width="28" height="44" rx="5" style={SURFACE_FILL} stroke="currentColor" strokeWidth="2.2" />
    </svg>
  ),
  desk: (
    <svg width="22" height="22" viewBox="0 0 64 64" aria-hidden="true">
      <rect x="14" y="8" width="36" height="48" rx="4" fill="none" stroke="currentColor" strokeWidth="5" />
      <rect x="21" y="18" width="22" height="6" rx="2" fill="currentColor" />
    </svg>
  ),
  bulletin: (
    <svg width="22" height="22" viewBox="0 0 64 64" aria-hidden="true">
      <rect x="6" y="22" width="52" height="20" rx="5" fill="none" stroke="currentColor" strokeWidth="5" />
    </svg>
  ),
  facts: (
    <svg width="22" height="22" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="15" cy="18" r="6" fill="currentColor" />
      <circle cx="15" cy="34" r="6" fill="currentColor" />
      <rect x="27" y="15" width="28" height="6" rx="3" fill="currentColor" opacity=".5" />
      <rect x="27" y="31" width="22" height="6" rx="3" fill="currentColor" opacity=".5" />
    </svg>
  ),
  context: (
    <svg width="22" height="22" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" strokeWidth="5" />
      <path d="M40 24l-5 11-11 5 5-11z" fill="currentColor" />
    </svg>
  ),
};
