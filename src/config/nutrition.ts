// ============================================
// 营养标准值 & TDEE 计算
// ============================================

import type { BodyMetrics, ActivityLevel } from '../types';
import { ACTIVITY_LEVELS } from '../types';

// --- 每日推荐摄入量（DRI / 中国居民膳食指南） ---

export const DAILY_RECOMMENDED = {
  protein: { min: 50, max: 150, unit: 'g', label: '蛋白质' },
  carbs: { min: 130, max: 400, unit: 'g', label: '碳水化合物' },
  fat: { min: 44, max: 100, unit: 'g', label: '脂肪' },
  fiber: { min: 25, max: 35, unit: 'g', label: '膳食纤维' },
  sugar: { min: 0, max: 50, unit: 'g', label: '添加糖' },
  sodium: { min: 500, max: 2300, unit: 'mg', label: '钠' },
  vitaminC: { min: 100, max: 2000, unit: 'mg', label: '维生素C' },
  calcium: { min: 800, max: 2500, unit: 'mg', label: '钙' },
  iron: { min: 8, max: 45, unit: 'mg', label: '铁' },
  omega3: { min: 250, max: 3000, unit: 'mg', label: 'Omega-3' },
  potassium: { min: 2600, max: 4700, unit: 'mg', label: '钾' },
} as const;

/**
 * 计算 BMR（基础代谢率）
 *
 * 两种公式：
 * - 有体脂率 → Katch-McArdle（更精准，基于瘦体重）
 * - 无体脂率 → Mifflin-St Jeor（目前最通用的公式）
 */
export function calculateBMR(metrics: BodyMetrics): number {
  const { weight, height, age, gender, bodyFat } = metrics;

  if (bodyFat !== undefined && bodyFat > 0 && bodyFat < 100) {
    // Katch-McArdle：BMR = 370 + 21.6 × 瘦体重(kg)
    const leanMass = weight * (1 - bodyFat / 100);
    return 370 + 21.6 * leanMass;
  }

  // Mifflin-St Jeor
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }
  return 10 * weight + 6.25 * height - 5 * age - 161;
}

/**
 * 计算 TDEE（每日总消耗）
 */
export function calculateTDEE(metrics: BodyMetrics): number {
  const bmr = calculateBMR(metrics);
  const factor = ACTIVITY_LEVELS[metrics.activityLevel].factor;
  return Math.round(bmr * factor);
}

/**
 * 根据目标计算建议卡路里摄入
 *
 * 减脂设计原则（问题2的回应）：
 * - 默认缺口 -300 kcal/天（约每周减 0.25kg，温和可持续）
 * - 最低不低于 1400 kcal（防止过度节食引发暴食反弹）
 * - 用户可以在 onboarding 选择激进/温和/极温和
 */
export function calculateTargetCalories(
  metrics: BodyMetrics,
  calorieAdjustment: number,
): number {
  const tdee = calculateTDEE(metrics);
  // 无硬性下限——小体重用户 BMR 本来就低，不人为抬高
  // 但保留一个安全底线：不低于 BMR 的 80%（长期低于 BMR 会损害代谢）
  const bmr = calculateBMR(metrics);
  const safeMin = Math.round(bmr * 0.8);
  return Math.max(safeMin, Math.round(tdee + calorieAdjustment));
}

/**
 * 减脂烈度选项
 */
export const FAT_LOSS_INTENSITY = {
  gentle:     { label: '温和',   adjustment: -150, description: '每周约减 0.1kg，几乎感觉不到在节食' },
  moderate:   { label: '标准',   adjustment: -250, description: '每周约减 0.2kg，适合大多数人' },
  aggressive: { label: '积极',   adjustment: -400, description: '每周约减 0.35kg，需要一定自律' },
} as const;

export type FatLossIntensity = keyof typeof FAT_LOSS_INTENSITY;

/**
 * 根据目标和体重计算每日宏量营养素目标（克）
 */
export function calculateMacroTargets(
  targetCalories: number,
  macroRatio: { protein: number; carbs: number; fat: number },
) {
  return {
    protein: Math.round((targetCalories * macroRatio.protein / 100) / 4),
    carbs: Math.round((targetCalories * macroRatio.carbs / 100) / 4),
    fat: Math.round((targetCalories * macroRatio.fat / 100) / 9),
  };
}

/** GI 值参考说明 */
export const GI_REFERENCE = {
  low: { range: '≤ 55', label: '低GI', color: '#22c55e', description: '缓慢升糖，推荐' },
  medium: { range: '56-69', label: '中GI', color: '#f59e0b', description: '适量食用' },
  high: { range: '≥ 70', label: '高GI', color: '#ef4444', description: '注意控制' },
} as const;
