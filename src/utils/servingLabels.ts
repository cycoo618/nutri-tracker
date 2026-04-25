// ============================================
// Serving label localization — bidirectional
// ZH→EN  and  EN→ZH  via ordered regex substitutions.
// ============================================

import type { Locale } from '../i18n';

// ── ZH → EN rules ───────────────────────────────────────────────────────────
// Leading spaces on unit replacements handle "1碗" → "1 bowl" without a
// generic digit+letter spacer (which would incorrectly split "100g" → "100 g").
const ZH_TO_EN: [RegExp, string][] = [
  // Multi-token: "1份6个 (150g)" → "6 pcs (150g)"
  [/(\d+)份(\d+)个/g, '$2 pcs'],
  // "6只约 (60g)" → "~6 pcs (60g)"
  [/(\d+)只约/g, '~$1 pcs'],

  // Inline size with 约 — must come BEFORE 约→~ and 个→piece
  [/个\(中，约/g, ' medium (~'],
  [/个\(大，约/g, ' large (~'],
  [/个\(小，约/g, ' small (~'],
  [/个\(中，/g,   ' medium ('],
  [/个\(大，/g,   ' large ('],
  [/个\(小，/g,   ' small ('],

  // 约 → ~
  [/约/g, '~'],

  // State modifiers
  [/煮熟/g, ' cooked'],
  [/可食/g, ' edible'],
  [/带骨/g, ' with bone'],
  [/全翅/g, ' whole wing'],
  [/蛋白/g, ' white'],
  [/蛋黄/g, ' yolk'],
  [/仁/g,   ' kernel'],
  [/干/g,   ' dry'],

  // 半 compounds — before bare 半 and individual units
  [/半个/g, '½ piece'],
  [/半份/g, '½ serving'],
  [/半碗/g, '½ bowl'],
  [/半包/g, '½ pack'],
  [/半杯/g, '½ cup'],
  [/半瓶/g, '½ bottle'],
  [/半条/g, '½ bar'],
  [/半块/g, '½ piece'],
  [/半/g,   '½'],

  // Size+unit compounds — leading space so "1大碗" → "1 large bowl"
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

  // Modifier attached to unit
  [/个中/g,  ' medium'],
  [/个大/g,  ' large'],
  [/个小/g,  ' small'],
  [/根中/g,  ' medium'],
  [/根大/g,  ' large'],
  [/块大/g,  ' large piece'],
  [/条大/g,  ' large bar'],
  [/小，/g,  'small, '],
  [/中，/g,  'medium, '],
  [/大，/g,  'large, '],

  // Single units — leading space so "1碗" → "1 bowl"
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
  [/颗/g,   ' pcs'],
  [/粒/g,   ' pcs'],
  [/袋/g,   ' bag'],
  [/貫/g,   ' piece'],
  [/贯/g,   ' piece'],
  [/寸/g,   ' inch'],
  [/英寸/g, ' inch'],
  [/标准/g, 'standard'],

  // Cleanup
  [/  +/g, ' '],
];

// ── EN → ZH rules ───────────────────────────────────────────────────────────
const EN_TO_ZH: [RegExp, string][] = [
  // Starbucks sizes — before generic terms
  [/Triple shot/gi,        '三份浓缩'],
  [/Double shot/gi,        '双份浓缩'],
  [/\bVenti\b/gi,          '超大杯'],
  [/\bGrande\b/gi,         '大杯'],
  [/\bTall\b/gi,           '中杯'],

  // Measurement units (with optional plural -s/-es)
  [/\btbsp\b/gi,           '汤匙'],
  [/\btsp\b/gi,            '茶匙'],
  [/\bscoops?\b/gi,        '勺'],
  [/\bbowls?\b/gi,         '碗'],
  [/\bservings?\b/gi,      '份'],
  [/\bslices?\b/gi,        '片'],
  [/\bpieces?\b/gi,        '个'],
  [/\bpcs\b/gi,            '个'],
  [/\bbottles?\b/gi,       '瓶'],
  [/\bcans?\b/gi,          '罐'],
  [/\bbars?\b/gi,          '条'],
  [/\bbags?\b/gi,          '袋'],
  [/\bpacks?\b/gi,         '包'],
  [/\bhandfuls?\b/gi,      '把'],
  [/\bclusters?\b/gi,      '串'],
  [/\bcups?\b/gi,          '杯'],
  [/\bshots?\b/gi,         '份'],
  [/\binch(?:es)?\b/gi,    '寸'],
  [/\bsquares?\b/gi,       '格'],

  // Size modifiers
  [/\blarge\b/gi,          '大'],
  [/\bsmall\b/gi,          '小'],
  [/\bmedium\b/gi,         '中'],
  [/\bstandard\b/gi,       '标准'],

  // State modifiers
  [/\bcooked\b/gi,         '熟'],
  [/\bdry\b/gi,            '干'],
  [/\bedible\b/gi,         '可食'],
  [/\bwith bone\b/gi,      '带骨'],

  // Fractions / symbols
  [/½/g, '半'],
  [/¼/g, '1/4'],
  [/~/g, '约'],

  // Measurement units — digit-attached (must come before standalone to avoid double-replace)
  // Order: mg before g, ml before l, kcal before cal
  [/(\d)ml(?=[^a-zA-Z]|$)/g, '$1毫升'],
  [/(\d)mg(?=[^a-zA-Z]|$)/g, '$1毫克'],
  [/(\d)kcal(?=[^a-zA-Z]|$)/gi, '$1千卡'],
  [/(\d)g(?=[^a-zA-Z]|$)/g, '$1克'],

  // Measurement units — standalone (e.g. "50 g", "500 kcal")
  [/\bkcal\b/gi, '千卡'],
  [/\bml\b/g, '毫升'],
  [/\bmg\b/g, '毫克'],
  [/\bg\b/g, '克'],

  // Remove space between digit and Chinese unit: "1 杯" → "1杯"
  [/(\d) ([\u4e00-\u9fff])/g, '$1$2'],
  // Remove space between Chinese size modifier and unit: "大 碗" → "大碗", "半 份" → "半份"
  [/([大小中半双三四五六]) ([\u4e00-\u9fff])/g, '$1$2'],

  // Cleanup
  [/  +/g, ' '],
];

/**
 * Localizes a standalone unit string (e.g. 'g', 'kcal', 'mg', 'ml').
 * Pass-through for unrecognized units.
 */
export function localizeUnit(unit: string, locale: Locale): string {
  if (locale === 'zh') {
    const map: Record<string, string> = {
      'g': '克', 'kcal': '千卡', 'mg': '毫克', 'ml': '毫升',
    };
    return map[unit.toLowerCase()] ?? unit;
  }
  // en — reverse map
  const map: Record<string, string> = {
    '克': 'g', '千卡': 'kcal', '毫克': 'mg', '毫升': 'ml',
  };
  return map[unit] ?? unit;
}

/**
 * Localizes a serving size label:
 * - 'en': translates Chinese measure words → English
 * - 'zh': translates English measure words → Chinese
 * Labels already in the target language are returned unchanged.
 */
export function localizeServingLabel(label: string, locale: Locale): string {
  const hasChinese = /[\u4e00-\u9fff]/.test(label);

  if (locale === 'en') {
    // Already English — nothing to do
    if (!hasChinese) return label;
    // Translate ZH → EN
    let s = label;
    for (const [p, r] of ZH_TO_EN) s = s.replace(p, r);
    return s.trim();
  }

  // locale === 'zh'
  // Already Chinese — nothing to do
  if (hasChinese) return label;
  // Translate EN → ZH
  let s = label;
  for (const [p, r] of EN_TO_ZH) s = s.replace(p, r);
  return s.trim();
}
