// ============================================
// 饮食记录 Hook
// ============================================

import { useState, useEffect, useCallback } from 'react';
import type { DailyLog, MealType, MealItem } from '../types/log';
import { createEmptyDailyLog } from '../types/log';
import type { FoodItem } from '../types/food';
import { scaleNutrition, sumNutrition } from '../types/food';
import { getDailyLog, saveDailyLog, getDailyLogs } from '../services/firestore';
import { getTodayString, generateId } from '../utils/calculator';
import { recordFoodUsage, getRecentFoods } from '../utils/recentFoods';
import type { RecentFoodEntry } from '../utils/recentFoods';

/** 根据当前时间自动判断餐次（内部使用，不暴露给用户） */
function getMealTypeFromTime(): MealType {
  const h = new Date().getHours();
  if (h >= 5 && h < 10) return 'breakfast';
  if (h >= 10 && h < 14) return 'lunch';
  if (h >= 17 && h < 22) return 'dinner';
  return 'snack'; // 下午 / 深夜 → 加餐
}

export function useFoodLog(userId: string | undefined) {
  const [currentDate, setCurrentDate] = useState(getTodayString());
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentFoods, setRecentFoods] = useState<RecentFoodEntry[]>(() => getRecentFoods());

  // 加载当天记录
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    getDailyLog(userId, currentDate)
      .then(log => {
        setDailyLog(log || createEmptyDailyLog(userId, currentDate));
      })
      .finally(() => setLoading(false));
  }, [userId, currentDate]);

  /** 重新计算总营养数据 */
  const recalculateTotal = useCallback((log: DailyLog): DailyLog => {
    const allNutritions = log.meals.flatMap(m => m.items.map(i => i.nutrition));
    const totalNutrition = sumNutrition(allNutritions);
    return {
      ...log,
      totalNutrition,
      totalCalories: Math.round(totalNutrition.calories),
      updatedAt: new Date().toISOString(),
    };
  }, []);

  /**
   * 添加食物 — 自动根据当前时间判断餐次，无需用户手选
   */
  const addFood = useCallback(async (
    food: FoodItem,
    grams: number,
    displayUnit?: string,
  ) => {
    if (!dailyLog || !userId) return;

    const mealType = getMealTypeFromTime();
    const unit = displayUnit || `${grams}g`;
    const nutrition = scaleNutrition(food.per100g, grams);

    const item: MealItem = {
      id: generateId(),
      foodId: food.id,
      foodName: food.name,
      amount: grams,
      unit,
      nutrition,
      calories: Math.round(nutrition.calories),
      gi: food.gi,
      loggedAt: new Date().toISOString(),
    };

    const updatedLog = {
      ...dailyLog,
      meals: dailyLog.meals.map(m =>
        m.type === mealType
          ? { ...m, items: [...m.items, item] }
          : m,
      ),
    };

    const finalLog = recalculateTotal(updatedLog);
    setDailyLog(finalLog);

    // 更新常用食物缓存
    recordFoodUsage(food, grams, unit);
    setRecentFoods(getRecentFoods());

    await saveDailyLog(finalLog);
  }, [dailyLog, userId, recalculateTotal]);

  /** 移除食物 — 按 itemId 搜索所有餐次，无需指定餐次 */
  const removeFood = useCallback(async (itemId: string) => {
    if (!dailyLog) return;

    const updatedLog = {
      ...dailyLog,
      meals: dailyLog.meals.map(m => ({
        ...m,
        items: m.items.filter(i => i.id !== itemId),
      })),
    };

    const finalLog = recalculateTotal(updatedLog);
    setDailyLog(finalLog);
    await saveDailyLog(finalLog);
  }, [dailyLog, recalculateTotal]);

  /** 获取日期范围内的记录（用于周/月分析） */
  const getLogsInRange = useCallback(async (startDate: string, endDate: string) => {
    if (!userId) return [];
    return getDailyLogs(userId, startDate, endDate);
  }, [userId]);

  return {
    currentDate,
    setCurrentDate,
    dailyLog,
    loading,
    addFood,
    removeFood,
    recentFoods,
    getLogsInRange,
  };
}
