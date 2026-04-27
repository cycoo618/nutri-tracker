import type { FocusEvent } from 'react';

/**
 * Auto-select all text on focus, then scroll the input into the center of
 * the viewport after the iOS keyboard has finished appearing (~350 ms).
 *
 * Apply to every <input> / <textarea> that may be partially hidden by the
 * keyboard — this is the global handler, no per-component tweaking needed.
 */
export const autoSelect = (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  const el = e.target;
  // Select text quickly so the user sees it highlighted
  setTimeout(() => el.select(), 50);
  // After iOS keyboard is fully expanded, scroll the field into view
  setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 350);
};
