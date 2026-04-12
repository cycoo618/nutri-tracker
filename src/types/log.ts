// ============================================
// 饮食记录类型定义
// ============================================

import type { NutritionData } from './food';

/** 餐次类型 */
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/** 餐次中文映射 */
export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐/零食',
};

/** 餐次图标 */
export const MEAL_ICONS: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍪',
};

/** 单个食物记录 */
export interface MealItem {
  id: string;
  foodId: string;       // 关联食物库 ID
  foodName: string;     // 冗余存储，方便展示
  amount: number;       // 实际食用量（克）
  unit: string;         // 显示单位，如 "100g"、"1片"
  nutrition: NutritionData;
  calories: number;     // 冗余存储 nutrition.calories，方便汇总
  gi?: number;
  loggedAt?: string;    // ISO timestamp，用于时间线显示
}

/** 一餐 */
export interface Meal {
  type: MealType;
  items: MealItem[];
  time?: string;        // 用餐时间 "HH:mm"
}

/** 一天的饮食记录 */
export interface DailyLog {
  id: string;
  userId: string;
  date: string;         // "YYYY-MM-DD"
  meals: Meal[];
  totalNutrition: NutritionData;
  totalCalories: number;
  note?: string;        // 当天备注
  createdAt: string;
  updatedAt: string;
}

/** 创建空的一天记录 */
export function createEmptyDailyLog(userId: string, date: string): DailyLog {
  return {
    id: `${userId}_${date}`,
    userId,
    date,
    meals: [
      { type: 'breakfast', items: [] },
      { type: 'lunch', items: [] },
      { type: 'dinner', items: [] },
      { type: 'snack', items: [] },
    ],
    totalNutrition: {
      calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0,
    },
    totalCalories: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/** 周分析数据 */
export interface WeeklyAnalysis {
  startDate: string;
  endDate: string;
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  totalDaysLogged: number;
  categoryDistribution: Record<string, number>;  // 食物分类分布
  missingCategories: string[];                    // 缺失的食物类别
  suggestions: string[];                          // 建议
}
