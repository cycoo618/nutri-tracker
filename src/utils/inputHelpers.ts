import type { FocusEvent } from 'react';

// Auto-select all text on focus — use on any input with a pre-filled value
export const autoSelect = (e: FocusEvent<HTMLInputElement>) => {
  const t = e.target;
  setTimeout(() => t.select(), 50);
};
