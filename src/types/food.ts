// ============================================
// 食物与营养数据类型定义
// ============================================

/** 营养数据（每100g） */
export interface NutritionData {
  // Macronutrients
  calories: number;       // kcal
  protein: number;        // g
  carbs: number;          // g
  fat: number;            // g
  fiber: number;          // g
  // Vitamins
  vitaminA?: number;      // μg RAE
  vitaminC?: number;      // mg
  vitaminD?: number;      // μg
  vitaminE?: number;      // mg
  vitaminB1?: number;     // mg (thiamine)
  vitaminB2?: number;     // mg (riboflavin)
  // Minerals
  calcium?: number;       // mg
  iron?: number;          // mg
  potassium?: number;     // mg
  magnesium?: number;     // mg
  zinc?: number;          // mg
  // Nutrients to limit
  sugar?: number;         // g
  saturatedFat?: number;  // g
  transFat?: number;      // g
  sodium?: number;        // mg
  cholesterol?: number;   // mg
  // Other beneficial
  omega3?: number;        // mg
}

/** 空营养数据模板 */
export const EMPTY_NUTRITION: NutritionData = {
  calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0,
};

/** 食物分类 */
export type FoodCategory =
  | 'grain'         // 主食/谷物
  | 'vegetable'     // 蔬菜
  | 'fruit'         // 水果
  | 'meat'          // 肉类
  | 'seafood'       // 海鲜
  | 'dairy'         // 奶制品
  | 'egg'           // 蛋类
  | 'soy'           // 豆制品
  | 'nut'           // 坚果
  | 'oil'           // 油脂/调料
  | 'drink'         // 饮品
  | 'snack'         // 零食
  | 'branded'       // 品牌食品
  | 'other';

/** 食物分类的中文映射 */
export const FOOD_CATEGORY_LABELS: Record<FoodCategory, string> = {
  grain: '主食/谷物',
  vegetable: '蔬菜',
  fruit: '水果',
  meat: '肉类',
  seafood: '海鲜',
  dairy: '奶制品',
  egg: '蛋类',
  soy: '豆制品',
  nut: '坚果',
  oil: '油脂/调料',
  drink: '饮品',
  snack: '零食',
  branded: '品牌食品',
  other: '其他',
};

/** 份量单位 */
export interface ServingSize {
  label: string;      // e.g., "1片", "1杯", "1个"
  grams: number;      // 换算成克
}

/** 食物数据来源 */
export type FoodSource = 'builtin' | 'openfoodfacts' | 'ai_estimated' | 'user_added';

/** 食物条目 */
export interface FoodItem {
  id: string;
  name: string;
  nameEn?: string;
  aliases?: string[];           // 别名，方便搜索
  category: FoodCategory;
  brand?: string;               // 品牌（如"麦当劳"、"星巴克"）
  per100g: NutritionData;
  gi?: number;                  // 升糖指数 (0-100)
  giLevel?: 'low' | 'medium' | 'high';  // GI 等级
  servingSizes?: ServingSize[];
  source: FoodSource;
  tags?: string[];              // 标签：如 "抗炎", "高蛋白", "全谷物"
  isAntiInflammatory?: boolean; // 是否抗炎食物
  /** 组合食物的食材明细（仅 recipe 类型有值） */
  ingredients?: { foodName: string; grams: number }[];
}

/** 计算 GI 等级 */
export function getGILevel(gi: number): 'low' | 'medium' | 'high' {
  if (gi <= 55) return 'low';
  if (gi <= 69) return 'medium';
  return 'high';
}

/** 按比例计算营养数据 */
export function scaleNutrition(per100g: NutritionData, grams: number): NutritionData {
  const ratio = grams / 100;
  const result: NutritionData = {
    calories: Math.round(per100g.calories * ratio * 10) / 10,
    protein: Math.round(per100g.protein * ratio * 10) / 10,
    carbs: Math.round(per100g.carbs * ratio * 10) / 10,
    fat: Math.round(per100g.fat * ratio * 10) / 10,
    fiber: Math.round(per100g.fiber * ratio * 10) / 10,
  };
  // 复制可选字段（vitamins / minerals / nutrients to limit）
  const optFields = [
    'vitaminA', 'vitaminC', 'vitaminD', 'vitaminE', 'vitaminB1', 'vitaminB2',
    'calcium', 'iron', 'potassium', 'magnesium', 'zinc',
    'sugar', 'saturatedFat', 'transFat', 'sodium', 'cholesterol',
    'omega3',
  ] as const;
  for (const f of optFields) {
    if (per100g[f] !== undefined) {
      (result as unknown as Record<string, number>)[f] = Math.round(per100g[f]! * ratio * 10) / 10;
    }
  }
  return result;
}

/** 合并多个营养数据 */
export function sumNutrition(items: NutritionData[]): NutritionData {
  return items.reduce((acc, item) => ({
    calories: acc.calories + item.calories,
    protein: acc.protein + item.protein,
    carbs: acc.carbs + item.carbs,
    fat: acc.fat + item.fat,
    fiber: acc.fiber + item.fiber,
    // 可选字段：至少有一个非 undefined 时才累加
    ...Object.fromEntries(
      (['vitaminA','vitaminC','vitaminD','vitaminE','vitaminB1','vitaminB2',
        'calcium','iron','potassium','magnesium','zinc',
        'sugar','saturatedFat','transFat','sodium','cholesterol','omega3'] as const)
        .filter(f => acc[f] !== undefined || item[f] !== undefined)
        .map(f => [f, Math.round(((acc[f] ?? 0) + (item[f] ?? 0)) * 10) / 10])
    ),
  }), { ...EMPTY_NUTRITION });
}
