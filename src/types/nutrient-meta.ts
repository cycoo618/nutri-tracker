// ============================================
// 营养素元数据：分类 / 中文名 / 单位 / 每日参考值
// 参考：中国居民膳食营养素参考摄入量（DRI 2023）成年人均值
// ============================================

import type { NutritionData } from './food';

export type NutrientCategory = 'macro' | 'vitamin' | 'mineral' | 'limit';

export interface NutrientMeta {
  key: keyof NutritionData;
  label: string;          // 中文显示名
  unit: string;           // 显示单位
  category: NutrientCategory;
  /** 每日参考值（目标摄入量或上限）— undefined 表示没有固定参考值 */
  drv?: number;
  /** goal = 越接近越好；limit = 不要超过 */
  direction: 'goal' | 'limit';
}

export const NUTRIENT_META: NutrientMeta[] = [
  // ── Macronutrients ──────────────────────────────────────
  { key: 'calories',      label: '热量',       unit: 'kcal', category: 'macro',   drv: 2000,  direction: 'goal'  },
  { key: 'protein',       label: '蛋白质',     unit: 'g',    category: 'macro',   drv: 60,    direction: 'goal'  },
  { key: 'carbs',         label: '碳水化合物', unit: 'g',    category: 'macro',   drv: 260,   direction: 'goal'  },
  { key: 'fat',           label: '脂肪',       unit: 'g',    category: 'macro',   drv: 65,    direction: 'goal'  },
  { key: 'fiber',         label: '膳食纤维',   unit: 'g',    category: 'macro',   drv: 25,    direction: 'goal'  },

  // ── Vitamins ────────────────────────────────────────────
  { key: 'vitaminA',     label: '维生素 A',   unit: 'μg',   category: 'vitamin', drv: 800,   direction: 'goal'  },
  { key: 'vitaminC',     label: '维生素 C',   unit: 'mg',   category: 'vitamin', drv: 100,   direction: 'goal'  },
  { key: 'vitaminD',     label: '维生素 D',   unit: 'μg',   category: 'vitamin', drv: 10,    direction: 'goal'  },
  { key: 'vitaminE',     label: '维生素 E',   unit: 'mg',   category: 'vitamin', drv: 14,    direction: 'goal'  },
  { key: 'vitaminB1',    label: '维生素 B1',  unit: 'mg',   category: 'vitamin', drv: 1.4,   direction: 'goal'  },
  { key: 'vitaminB2',    label: '维生素 B2',  unit: 'mg',   category: 'vitamin', drv: 1.4,   direction: 'goal'  },

  // ── Minerals ────────────────────────────────────────────
  { key: 'calcium',      label: '钙',         unit: 'mg',   category: 'mineral', drv: 800,   direction: 'goal'  },
  { key: 'iron',         label: '铁',         unit: 'mg',   category: 'mineral', drv: 12,    direction: 'goal'  },
  { key: 'potassium',    label: '钾',         unit: 'mg',   category: 'mineral', drv: 2000,  direction: 'goal'  },
  { key: 'magnesium',    label: '镁',         unit: 'mg',   category: 'mineral', drv: 330,   direction: 'goal'  },
  { key: 'zinc',         label: '锌',         unit: 'mg',   category: 'mineral', drv: 12.5,  direction: 'goal'  },

  // ── Nutrients to limit ───────────────────────────────────
  { key: 'sugar',        label: '糖',         unit: 'g',    category: 'limit',   drv: 50,    direction: 'limit' },
  { key: 'saturatedFat', label: '饱和脂肪',   unit: 'g',    category: 'limit',   drv: 20,    direction: 'limit' },
  { key: 'transFat',     label: '反式脂肪',   unit: 'g',    category: 'limit',   drv: 2,     direction: 'limit' },
  { key: 'sodium',       label: '钠',         unit: 'mg',   category: 'limit',   drv: 2000,  direction: 'limit' },
  { key: 'cholesterol',  label: '胆固醇',     unit: 'mg',   category: 'limit',   drv: 300,   direction: 'limit' },

  // ── Other beneficial ────────────────────────────────────
  { key: 'omega3',       label: 'Omega-3',    unit: 'mg',   category: 'mineral', drv: 250,   direction: 'goal'  },
];

/** 按 key 快速查找 */
export const NUTRIENT_META_MAP = Object.fromEntries(
  NUTRIENT_META.map(m => [m.key, m])
) as Record<keyof NutritionData, NutrientMeta>;
