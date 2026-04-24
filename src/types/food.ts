// ============================================
// 食物与营养数据类型定义
// ============================================

/** 营养数据（每100g） */
export interface NutritionData {
  calories: number;       // kcal
  protein: number;        // g
  carbs: number;          // g
  fat: number;            // g
  fiber: number;          // g
  // --- 进阶数据（健康饮食模式 / 付费功能） ---
  sugar?: number;         // g
  saturatedFat?: number;  // g
  sodium?: number;        // mg
  omega3?: number;        // mg
  vitaminC?: number;      // mg
  calcium?: number;       // mg
  iron?: number;          // mg
  potassium?: number;     // mg
  vitaminA?: number;      // μg
  vitaminD?: number;      // μg
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
  // 复制进阶字段
  if (per100g.sugar !== undefined) result.sugar = Math.round(per100g.sugar * ratio * 10) / 10;
  if (per100g.saturatedFat !== undefined) result.saturatedFat = Math.round(per100g.saturatedFat * ratio * 10) / 10;
  if (per100g.sodium !== undefined) result.sodium = Math.round(per100g.sodium * ratio * 10) / 10;
  if (per100g.omega3 !== undefined) result.omega3 = Math.round(per100g.omega3 * ratio * 10) / 10;
  if (per100g.vitaminC !== undefined) result.vitaminC = Math.round(per100g.vitaminC * ratio * 10) / 10;
  if (per100g.calcium !== undefined) result.calcium = Math.round(per100g.calcium * ratio * 10) / 10;
  if (per100g.iron !== undefined) result.iron = Math.round(per100g.iron * ratio * 10) / 10;
  if (per100g.potassium !== undefined) result.potassium = Math.round(per100g.potassium * ratio * 10) / 10;
  if (per100g.vitaminA !== undefined) result.vitaminA = Math.round(per100g.vitaminA * ratio * 10) / 10;
  if (per100g.vitaminD !== undefined) result.vitaminD = Math.round(per100g.vitaminD * ratio * 10) / 10;
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
    // 可选字段：至少有一个非 undefined 时才包含，值为两者之和（undefined 视为 0）
    // 用展开对象而非 || undefined，避免"两个都是 0"时把有效 0 值错误丢弃
    ...(acc.sugar        !== undefined || item.sugar        !== undefined ? { sugar:        (acc.sugar        ?? 0) + (item.sugar        ?? 0) } : {}),
    ...(acc.saturatedFat !== undefined || item.saturatedFat !== undefined ? { saturatedFat: (acc.saturatedFat ?? 0) + (item.saturatedFat ?? 0) } : {}),
    ...(acc.sodium       !== undefined || item.sodium       !== undefined ? { sodium:       (acc.sodium       ?? 0) + (item.sodium       ?? 0) } : {}),
    ...(acc.omega3       !== undefined || item.omega3       !== undefined ? { omega3:       (acc.omega3       ?? 0) + (item.omega3       ?? 0) } : {}),
    ...(acc.vitaminC     !== undefined || item.vitaminC     !== undefined ? { vitaminC:     (acc.vitaminC     ?? 0) + (item.vitaminC     ?? 0) } : {}),
    ...(acc.calcium      !== undefined || item.calcium      !== undefined ? { calcium:      (acc.calcium      ?? 0) + (item.calcium      ?? 0) } : {}),
    ...(acc.iron         !== undefined || item.iron         !== undefined ? { iron:         (acc.iron         ?? 0) + (item.iron         ?? 0) } : {}),
    ...(acc.potassium    !== undefined || item.potassium    !== undefined ? { potassium:    (acc.potassium    ?? 0) + (item.potassium    ?? 0) } : {}),
    ...(acc.vitaminA     !== undefined || item.vitaminA     !== undefined ? { vitaminA:     (acc.vitaminA     ?? 0) + (item.vitaminA     ?? 0) } : {}),
    ...(acc.vitaminD     !== undefined || item.vitaminD     !== undefined ? { vitaminD:     (acc.vitaminD     ?? 0) + (item.vitaminD     ?? 0) } : {}),
  }), { ...EMPTY_NUTRITION });
}
