import type { FocusEvent } from 'react';

/**
 * Auto-select all text on focus.
 *
 * iOS quirk: type="number" inputs do NOT support select() / setSelectionRange()
 * in WebKit — calling setSelectionRange on a number input triggers an
 * InvalidStateError and can cause phantom key insertions (the infamous "5" bug).
 *
 * Solution: use type="text" inputMode="decimal" for all numeric inputs that
 * need auto-select. That shows the same numeric keypad on iOS while supporting
 * the full selection API.
 *
 * Note: scrollIntoView is intentionally removed here — each component that
 * needs it should call it explicitly after the keyboard settles (~300ms).
 */
export const autoSelect = (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  const el = e.target;
  // Skip entirely for type="number" — not supported by WebKit
  if ((el as HTMLInputElement).type === 'number') return;
  setTimeout(() => {
    try {
      el.select();
      el.setSelectionRange(0, el.value.length);
    } catch {
      // ignore — some input types don't support setSelectionRange
    }
  }, 50);
};
