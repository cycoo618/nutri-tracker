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
  // Select text — iOS sometimes ignores .select() on text inputs, so also
  // explicitly set the selection range as a fallback.
  setTimeout(() => {
    try {
      el.select();
      el.setSelectionRange(0, el.value.length); // iOS text input fallback
    } catch { /* number inputs may not support setSelectionRange — ignore */ }
  }, 50);
  // After iOS keyboard is fully expanded, scroll the field into view
  setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 350);
};
