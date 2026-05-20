const KEY = 'nutri_font_size';
const SIZES = { small: '14px', standard: '16px', large: '19px' } as const;
export type FontSize = keyof typeof SIZES;

// Zoom scale applied to the redesign container (affects inline px values)
export const ZOOM_MAP: Record<FontSize, number> = { small: 0.88, standard: 1, large: 1.16 };

export function initFontSize() {
  const saved = (localStorage.getItem(KEY) as FontSize) ?? 'standard';
  document.documentElement.style.fontSize = SIZES[saved] ?? SIZES.standard;
}

export function setFontSize(size: FontSize) {
  localStorage.setItem(KEY, size);
  document.documentElement.style.fontSize = SIZES[size];
  window.dispatchEvent(new CustomEvent('fontsize-change', { detail: size }));
}

export function getFontSize(): FontSize {
  return (localStorage.getItem(KEY) as FontSize) ?? 'standard';
}
