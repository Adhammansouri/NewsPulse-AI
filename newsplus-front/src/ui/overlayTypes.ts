import type { RefObject } from "react";

/** Props shared by Sheet, Drawer, Popover and Dialog. */
export type OverlayProps = {
  /** Rendered only while open (the CSS has entrance animations only). */
  open: boolean;
  /** Esc, scrim click (and outside press for a non-modal Popover). Omit to make the overlay non-dismissible. */
  onClose?: () => void;
  /** Element to focus on open (default: first tabbable inside, else the container). */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Element to focus on close (default: the element that had focus when it opened — the trigger). */
  returnFocusRef?: RefObject<HTMLElement | null>;
};

export type ScrimOverlayProps = OverlayProps & {
  /** Turns the scrim into a labelled close button, as some boards do (`aria-label="إغلاق التصفية"`). */
  scrimLabel?: string;
};
