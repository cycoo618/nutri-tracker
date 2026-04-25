// ============================================
// Serving label localization
// Translates Chinese measure-word labels to English on-the-fly.
// Works purely via regex substitution — no i18n dependency.
// ============================================

import type { Locale } from '../i18n';

/**
 * Ordered replacement rules applied left-to-right.
 * Rules with leading spaces handle "digit immediately before Chinese unit"
 * (e.g. 1碗 → "1 bowl") so we don't need a generic digit+letter spacer,
 * which would incorrectly split measurement units like 100g → "100 g".
 *
 * More specific / longer patterns MUST come before shorter ones.
 */
const RULES: [RegExp, string][] = [
  // ── Multi-token patterns ────────────────────────────────────────
  // "1份6个 (150g)" → "6 pcs (150g)"
  [/(\d+)份(\d+)个/g, '$2 pcs'],
  // "6只约 (60g)" → "~6 pcs (60g)"
  [/(\d+)只约/g, '~$1 pcs'],

  // ── Inline size with 约 — must come BEFORE 约→~ and 个→piece ────
  // "1个(中，约150g)" → "1 medium (~150g)"
  [/个\(中，约/g, ' medium (~'],
  [/个\(大，约/g, ' large (~'],
  [/个\(小，约/g, ' small (~'],
  // Without 约: "1个(中，150g)"
  [/个\(中，/g, ' medium ('],
  [/个\(大，/g, ' large ('],
  [/个\(小，/g, ' small ('],

  // 约 → ~
  [/约/g, '~'],

  // ── State modifiers ─────────────────────────────────────────────
  [/煮熟/g, ' cooked'],
  [/可食/g, ' edible'],
  [/带骨/g, ' with bone'],
  [/全翅/g, ' whole wing'],
  [/蛋白/g, ' white'],    // 1个蛋的蛋白
  [/蛋黄/g, ' yolk'],     // 1个蛋的蛋黄
  [/仁/g,   ' kernel'],
  [/干/g,   ' dry'],

  // ── 半 compounds — must precede bare 半 and individual units ────
  [/半个/g,  '½ piece'],
  [/半份/g,  '½ serving'],
  [/半碗/g,  '½ bowl'],
  [/半包/g,  '½ pack'],
  [/半杯/g,  '½ cup'],
  [/半瓶/g,  '½ bottle'],
  [/半条/g,  '½ bar'],
  [/半块/g,  '½ piece'],
  [/半/g,    '½'],   // bare 半 (e.g. 半张, 半串) — no trailing space; trim handles it

  // ── Size+unit compounds — leading space so "1大碗" → "1 large bowl" ─
  [/中份/g,  ' medium serving'],
  [/大份/g,  ' large serving'],
  [/小份/g,  ' small serving'],
  [/大碗/g,  ' large bowl'],
  [/小碗/g,  ' small bowl'],
  [/大杯/g,  ' large cup'],
  [/中杯/g,  ' medium cup'],
  [/小杯/g,  ' small cup'],
  [/小串/g,  ' small cluster'],
  [/大串/g,  ' large cluster'],
  [/小把/g,  ' small handful'],
  [/茶匙/g,  ' tsp'],
  [/汤匙/g,  ' tbsp'],

  // ── Modifier attached to unit ───────────────────────────────────
  [/个中/g,  ' medium'],
  [/个大/g,  ' large'],
  [/个小/g,  ' small'],
  [/根中/g,  ' medium'],
  [/根大/g,  ' large'],
  [/块大/g,  ' large piece'],
  [/条大/g,  ' large bar'],
  // Standalone size descriptors inside parentheses
  [/小，/g,  'small, '],
  [/中，/g,  'medium, '],
  [/大，/g,  'large, '],

  // ── Single units — leading space so "1碗" → "1 bowl" ────────────
  [/碗/g,   ' bowl'],
  [/份/g,   ' serving'],
  [/片/g,   ' slice'],
  [/个/g,   ' piece'],
  [/块/g,   ' piece'],
  [/杯/g,   ' cup'],
  [/瓶/g,   ' bottle'],
  [/罐/g,   ' can'],
  [/根/g,   ' piece'],
  [/把/g,   ' handful'],
  [/勺/g,   ' scoop'],
  [/条/g,   ' bar'],
  [/格/g,   ' square'],
  [/只/g,   ' pcs'],
  [/包/g,   ' pack'],
  [/串/g,   ' cluster'],
  [/张/g,   ' piece'],
  [/颗/g,   ' pcs'],    // small round fruits/nuts
  [/粒/g,   ' pcs'],    // grains / small items
  [/袋/g,   ' bag'],
  [/貫/g,   ' piece'],  // sushi (traditional char)
  [/贯/g,   ' piece'],  // sushi (simplified)
  [/寸/g,   ' inch'],
  [/英寸/g, ' inch'],   // explicit just in case

  // ── Misc descriptors ────────────────────────────────────────────
  [/标准/g, 'standard'],

  // ── Cleanup ─────────────────────────────────────────────────────
  // Collapse multiple spaces (no digit+letter rule — avoids "100 g" breakage)
  [/  +/g, ' '],
];

/**
 * Localizes a serving size label for the given locale.
 * - 'zh': returns the label unchanged.
 * - 'en': applies ordered regex substitutions to translate Chinese measure
 *   words while preserving numeric values and gram/ml amounts.
 */
export function localizeServingLabel(label: string, locale: Locale): string {
  if (locale === 'zh') return label;
  // Fast path: no Chinese characters → already English
  if (!/[\u4e00-\u9fff]/.test(label)) return label;

  let s = label;
  for (const [pattern, replacement] of RULES) {
    s = s.replace(pattern, replacement);
  }
  return s.trim();
}
