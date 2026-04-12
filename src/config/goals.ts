// ============================================
// 目标模式配置
// premiumFeature 参数用于未来付费功能限制
// ============================================

import type { GoalType } from '../types';

export interface GoalConfig {
  strictCalories: boolean;        // 是否严格控制卡路里
  showAdvancedNutrition: boolean; // 是否显示进阶营养数据（GI、Omega-3 等）
  proteinTarget: boolean;         // 是否强调蛋白质目标
  showGI: boolean;                // 是否显示 GI 值
  showAntiInflammatory: boolean;  // 是否显示抗炎评估
  premiumFeature: boolean;        // 是否为付费功能（未来限制用）
  // --- 卡路里调整 ---
  calorieAdjustment: number;      // 在 TDEE 基础上的调整值（kcal）
  // --- 宏量营养素目标比例 ---
  macroRatio: {
    protein: number;  // 百分比
    carbs: number;
    fat: number;
  };
}

export const GOAL_CONFIGS: Record<GoalType, GoalConfig> = {
  fat_loss: {
    strictCalories: true,
    showAdvancedNutrition: false,
    proteinTarget: true,
    showGI: false,
    showAntiInflammatory: false,
    premiumFeature: false,
    calorieAdjustment: -350,   // 默认温和缺口，onboarding 可选烈度覆盖
    macroRatio: { protein: 35, carbs: 40, fat: 25 },
  },
  muscle_gain: {
    strictCalories: false,
    showAdvancedNutrition: false,
    proteinTarget: true,
    showGI: false,
    showAntiInflammatory: false,
    premiumFeature: false,
    calorieAdjustment: 300,
    macroRatio: { protein: 30, carbs: 45, fat: 25 },
  },
  healthy_eating: {
    strictCalories: false,
    showAdvancedNutrition: true,
    proteinTarget: false,
    showGI: true,
    showAntiInflammatory: true,
    premiumFeature: true,      // 未来设为付费
    calorieAdjustment: 0,
    macroRatio: { protein: 25, carbs: 45, fat: 30 },
  },
};

/**
 * 获取目标配置，考虑用户付费状态
 * 未来加付费限制时，只需修改此函数
 */
export function getEffectiveGoalConfig(
  goal: GoalType,
  _premiumEnabled: boolean,  // 下划线表示暂未使用
): GoalConfig {
  const config = GOAL_CONFIGS[goal];
  // TODO: 未来在此处根据 premiumEnabled 限制功能
  // if (!premiumEnabled && config.premiumFeature) {
  //   return { ...config, showAdvancedNutrition: false, showGI: false, showAntiInflammatory: false };
  // }
  return config;
}
