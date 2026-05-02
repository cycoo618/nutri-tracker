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
  anti_inflammatory: {
    strictCalories: false,
    showAdvancedNutrition: true,
    proteinTarget: false,
    showGI: true,
    showAntiInflammatory: true,
    premiumFeature: true,
    calorieAdjustment: 0,
    macroRatio: { protein: 25, carbs: 45, fat: 30 },
  },
  blood_sugar: {
    strictCalories: false,
    showAdvancedNutrition: true,
    proteinTarget: false,
    showGI: true,
    showAntiInflammatory: true,
    premiumFeature: false,
    calorieAdjustment: 0,
    macroRatio: { protein: 25, carbs: 40, fat: 35 },
  },
};

/**
 * 合并多个目标的配置
 * 规则：
 * - calorieAdjustment：取最严格的体型目标（最小值，即最大缺口）
 * - boolean 标志：OR 合并（任一目标要求则启用）
 * - macroRatio：取最高蛋白质比例目标的那条（增肌/减脂优先）
 */
export function mergeGoalConfigs(goals: GoalType[]): GoalConfig {
  if (goals.length === 0) return GOAL_CONFIGS['anti_inflammatory'];
  if (goals.length === 1) return GOAL_CONFIGS[goals[0]];

  const configs = goals.map(g => GOAL_CONFIGS[g]);

  // calorieAdjustment: 取最小值（最大缺口 or 最大盈余中的"更积极"方向）
  // 若有减脂（负值），用最小（最大缺口）；若有增肌（正值），且无减脂，用最大正值
  const hasFatLoss = goals.includes('fat_loss');
  const hasMuscleGain = goals.includes('muscle_gain');
  let calorieAdjustment: number;
  if (hasFatLoss) {
    calorieAdjustment = Math.min(...configs.map(c => c.calorieAdjustment));
  } else if (hasMuscleGain) {
    calorieAdjustment = Math.max(...configs.map(c => c.calorieAdjustment));
  } else {
    calorieAdjustment = 0;
  }

  // macroRatio: 取最高蛋白质比例的配置
  const highestProteinConfig = configs.reduce((best, c) =>
    c.macroRatio.protein > best.macroRatio.protein ? c : best,
  );

  return {
    strictCalories: configs.some(c => c.strictCalories),
    showAdvancedNutrition: configs.some(c => c.showAdvancedNutrition),
    proteinTarget: configs.some(c => c.proteinTarget),
    showGI: configs.some(c => c.showGI),
    showAntiInflammatory: configs.some(c => c.showAntiInflammatory),
    premiumFeature: configs.some(c => c.premiumFeature),
    calorieAdjustment,
    macroRatio: highestProteinConfig.macroRatio,
  };
}

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
  return config;
}
