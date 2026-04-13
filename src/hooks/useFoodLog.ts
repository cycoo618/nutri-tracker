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

/** localStorage key for a user's daily log */
function localKey(userId: string, date: string) {
  return `nutri_log_${userId}_${date}`;
}

function saveToLocal(userId: string, date: string, log: DailyLog) {
  try {
    localStorage.setItem(localKey(userId, date), JSON.stringify(log));
  } catch { /* storage full — ignore */ }
}

function loadFromLocal(userId: string, date: string): DailyLog | null {
  try {
    const raw = localStorage.getItem(localKey(userId, date));
    return raw ? (JSON.parse(raw) as DailyLog) : null;
  } catch {
    return null;
  }
}

export function useFoodLog(userId: string | undefined) {
  const [currentDate, setCurrentDate] = useState(getTodayString());
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentFoods, setRecentFoods] = useState<RecentFoodEntry[]>(() => getRecentFoods());

  // 加载当天记录：先读 localStorage（即时显示），再从 Firestore 同步
  useEffect(() => {
    if (!userId) return;

    // 1. 立刻从本地缓存恢复（零延迟，防止刷新白屏）
    const cached = loadFromLocal(userId, currentDate);
    if (cached) {
      setDailyLog(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    // 2. 后台从 Firestore 拉取最新数据（可能比本地更新，如跨设备）
    getDailyLog(userId, currentDate)
      .then(log => {
        if (log) {
          // Firestore 有数据（可能是别的设备写的）→ 更新状态和缓存
          setDailyLog(log);
          saveToLocal(userId, currentDate, log);
        } else if (!cached) {
          // Firestore 没数据 + 本地也没缓存 → 创建空白
          setDailyLog(createEmptyDailyLog(userId, currentDate));
          // 不把空白写入 localStorage，等用户真正添加食物再写
        }
        // Firestore 没数据 但 缓存有 → 保持缓存（已经 setDailyLog 过了）
      })
      .catch(() => {
        // Firestore 失败 → 继续用本地缓存（已显示）；没缓存时用空白
        if (!cached) setDailyLog(createEmptyDailyLog(userId, currentDate));
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

    // 先写 localStorage（同步，即时持久化），再写 Firestore（异步）
    saveToLocal(userId, currentDate, finalLog);
    saveDailyLog(finalLog).catch(err => console.warn('Firestore save failed:', err));
  }, [dailyLog, userId, currentDate, recalculateTotal]);

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

    if (userId) saveToLocal(userId, currentDate, finalLog);
    saveDailyLog(finalLog).catch(err => console.warn('Firestore save failed:', err));
  }, [dailyLog, userId, currentDate, recalculateTotal]);

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
