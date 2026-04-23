// ============================================
// 营养分析 Hook
// ============================================

import { useMemo } from 'react';
import type { UserProfile } from '../types/user';
import type { DailyLog } from '../types/log';
import type { NutritionData } from '../types/food';
import { GOAL_CONFIGS } from '../config/goals';
import { calculateTargetCalories, calculateMacroTargets, DAILY_RECOMMENDED } from '../config/nutrition';

export interface NutritionStatus {
  targetCalories: number;
  consumedCalories: number;
  remainingCalories: number;
  caloriePercent: number;
  macros: {
    protein: { target: number; consumed: number; percent: number };
    carbs: { target: number; consumed: number; percent: number };
    fat: { target: number; consumed: number; percent: number };
  };
  fiber: { target: number; consumed: number; percent: number };
  // 进阶数据（健康饮食模式）
  advanced?: {
    sugar: { consumed: number; max: number; status: 'good' | 'warning' | 'danger' };
    sodium: { consumed: number; max: number; status: 'good' | 'warning' | 'danger' };
    omega3: { consumed: number; min: number; status: 'good' | 'warning' };
  };
  isOverCalorie: boolean;
  overallStatus: 'excellent' | 'good' | 'warning' | 'danger';
}

export function useNutrition(profile: UserProfile | null, dailyLog: DailyLog | null) {
  return useMemo<NutritionStatus | null>(() => {
    if (!profile || !dailyLog) return null;

    const goalConfig = GOAL_CONFIGS[profile.goal];

    // 计算目标卡路里
    // 规则：存了非零值就用，否则才用公式自动计算
    let targetCalories = profile.targetCalories;
    if ((!targetCalories || targetCalories <= 0) && profile.bodyMetrics) {
      targetCalories = calculateTargetCalories(profile.bodyMetrics, goalConfig.calorieAdjustment);
    }

    // 宏量营养素目标
    const macroTargets = calculateMacroTargets(targetCalories, goalConfig.macroRatio);

    const consumed = dailyLog.totalNutrition;
    const consumedCalories = Math.round(consumed.calories);

    const calcPercent = (value: number, target: number) =>
      target > 0 ? Math.min(200, Math.round((value / target) * 100)) : 0;

    const status: NutritionStatus = {
      targetCalories,
      consumedCalories,
      remainingCalories: targetCalories - consumedCalories,
      caloriePercent: calcPercent(consumedCalories, targetCalories),
      macros: {
        protein: {
          target: macroTargets.protein,
          consumed: Math.round(consumed.protein),
          percent: calcPercent(consumed.protein, macroTargets.protein),
        },
        carbs: {
          target: macroTargets.carbs,
          consumed: Math.round(consumed.carbs),
          percent: calcPercent(consumed.carbs, macroTargets.carbs),
        },
        fat: {
          target: macroTargets.fat,
          consumed: Math.round(consumed.fat),
          percent: calcPercent(consumed.fat, macroTargets.fat),
        },
      },
      fiber: {
        target: DAILY_RECOMMENDED.fiber.min,
        consumed: Math.round(consumed.fiber),
        percent: calcPercent(consumed.fiber, DAILY_RECOMMENDED.fiber.min),
      },
      isOverCalorie: consumedCalories > targetCalories,
      overallStatus: 'good',
    };

    // 进阶数据（健康饮食或付费用户）
    if (goalConfig.showAdvancedNutrition || profile.premiumEnabled) {
      const sugarConsumed = consumed.sugar ?? 0;
      const sodiumConsumed = consumed.sodium ?? 0;
      const omega3Consumed = consumed.omega3 ?? 0;

      status.advanced = {
        sugar: {
          consumed: Math.round(sugarConsumed),
          max: DAILY_RECOMMENDED.sugar.max,
          status: sugarConsumed <= 25 ? 'good' : sugarConsumed <= 50 ? 'warning' : 'danger',
        },
        sodium: {
          consumed: Math.round(sodiumConsumed),
          max: DAILY_RECOMMENDED.sodium.max,
          status: sodiumConsumed <= 1500 ? 'good' : sodiumConsumed <= 2300 ? 'warning' : 'danger',
        },
        omega3: {
          consumed: Math.round(omega3Consumed),
          min: DAILY_RECOMMENDED.omega3.min,
          status: omega3Consumed >= 250 ? 'good' : 'warning',
        },
      };
    }

    // 综合状态评估
    if (status.caloriePercent > 120) {
      status.overallStatus = 'danger';
    } else if (status.caloriePercent > 100) {
      status.overallStatus = 'warning';
    } else if (
      status.macros.protein.percent >= 70 &&
      status.macros.carbs.percent >= 50 &&
      status.fiber.percent >= 60
    ) {
      status.overallStatus = status.caloriePercent >= 80 ? 'excellent' : 'good';
    }

    return status;
  }, [profile, dailyLog]);
}
