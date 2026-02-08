/**
 * Layout constants for full-screen safe area handling.
 * Used by AppContainer and MainTabs.
 */
export const LAYOUT = {
  /** Base height of bottom tab bar (excluding safe area inset). */
  TAB_BAR_BASE_HEIGHT: 72,
  /** Extra padding at end of scroll content above tab bar. */
  TAB_BAR_CLEARANCE_EXTRA: 24,
  /** Content top padding below status bar. */
  CONTENT_TOP_PADDING: 24,
  /** Horizontal page padding. */
  PAGE_PADDING_HORIZONTAL: 20,
} as const;
