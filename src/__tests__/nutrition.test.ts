import { describe, it, expect } from 'vitest';
import { calculateBMR, calculateTDEE, calculateTargetCalories, calculateMacroTargets } from '../config/nutrition';
import type { BodyMetrics } from '../types/user';

const maleMedium: BodyMetrics = {
  height: 175, weight: 70, age: 28, gender: 'male', activityLevel: 'light',
};

const femaleLight: BodyMetrics = {
  height: 162, weight: 55, age: 25, gender: 'female', activityLevel: 'sedentary',
};

describe('calculateBMR (Mifflin-St Jeor)', () => {
  it('男性 BMR 计算正确', () => {
    // 10*70 + 6.25*175 - 5*28 + 5 = 700 + 1093.75 - 140 + 5 = 1658.75
    const bmr = calculateBMR(maleMedium);
    expect(bmr).toBeCloseTo(1658.75, 1);
  });

  it('女性 BMR 计算正确', () => {
    // 10*55 + 6.25*162 - 5*25 - 161 = 550 + 1012.5 - 125 - 161 = 1276.5
    const bmr = calculateBMR(femaleLight);
    expect(bmr).toBeCloseTo(1276.5, 1);
  });

  it('BMR 结果大于 0', () => {
    expect(calculateBMR(maleMedium)).toBeGreaterThan(0);
    expect(calculateBMR(femaleLight)).toBeGreaterThan(0);
  });
});

describe('calculateBMR with body fat (Katch-McArdle)', () => {
  it('有体脂率时使用 Katch-McArdle 公式', () => {
    const metrics: BodyMetrics = { ...maleMedium, bodyFat: 20 };
    // 瘦体重 = 70 * 0.8 = 56kg，BMR = 370 + 21.6 * 56 = 370 + 1209.6 = 1579.6
    const bmr = calculateBMR(metrics);
    expect(bmr).toBeCloseTo(1579.6, 1);
  });

  it('体脂率存在时结果与 Mifflin 不同', () => {
    const withFat: BodyMetrics = { ...maleMedium, bodyFat: 20 };
    const withoutFat: BodyMetrics = { ...maleMedium };
    expect(calculateBMR(withFat)).not.toBeCloseTo(calculateBMR(withoutFat), 0);
  });

  it('体脂率为 0 或无效时回退到 Mifflin', () => {
    const zero: BodyMetrics = { ...maleMedium, bodyFat: 0 };
    const none: BodyMetrics = { ...maleMedium };
    expect(calculateBMR(zero)).toBeCloseTo(calculateBMR(none), 0);
  });
});

describe('calculateTDEE', () => {
  it('TDEE = BMR × 活动系数', () => {
    const bmr = calculateBMR(maleMedium); // light = 1.375
    const tdee = calculateTDEE(maleMedium);
    expect(tdee).toBe(Math.round(bmr * 1.375));
  });

  it('TDEE > BMR', () => {
    expect(calculateTDEE(maleMedium)).toBeGreaterThan(calculateBMR(maleMedium));
    expect(calculateTDEE(femaleLight)).toBeGreaterThan(calculateBMR(femaleLight));
  });
});

describe('calculateTargetCalories', () => {
  it('减脂：TDEE - 500', () => {
    const tdee = calculateTDEE(maleMedium);
    const target = calculateTargetCalories(maleMedium, -500);
    expect(target).toBe(Math.max(1200, Math.round(tdee - 500)));
  });

  it('增肌：TDEE + 300', () => {
    const tdee = calculateTDEE(maleMedium);
    const target = calculateTargetCalories(maleMedium, 300);
    expect(target).toBe(Math.round(tdee + 300));
  });

  it('目标不低于 BMR 的 80%（安全底线）', () => {
    const tinyPerson: BodyMetrics = {
      height: 150, weight: 42, age: 25, gender: 'female', activityLevel: 'sedentary',
    };
    const bmr = calculateBMR(tinyPerson);
    const target = calculateTargetCalories(tinyPerson, -500);
    expect(target).toBeGreaterThanOrEqual(Math.round(bmr * 0.8));
  });

  it('小体重用户不会被强制抬到固定最低值', () => {
    // 48kg 女生，TDEE 约 1400，温和缺口 -150 应得到约 1250 而非被强制到 1400
    const smallPerson: BodyMetrics = {
      height: 158, weight: 48, age: 22, gender: 'female', activityLevel: 'sedentary',
    };
    const target = calculateTargetCalories(smallPerson, -150);
    const bmr = calculateBMR(smallPerson);
    // 应低于 1400（旧的硬限），但高于 BMR 的 80%
    expect(target).toBeLessThan(1400);
    expect(target).toBeGreaterThanOrEqual(Math.round(bmr * 0.8));
  });
});

describe('calculateMacroTargets', () => {
  it('减脂宏量比例（35/40/25）', () => {
    const macros = calculateMacroTargets(1800, { protein: 35, carbs: 40, fat: 25 });
    // protein: 1800*0.35/4 = 157.5 → 158
    expect(macros.protein).toBe(158);
    // carbs: 1800*0.40/4 = 180
    expect(macros.carbs).toBe(180);
    // fat: 1800*0.25/9 = 50
    expect(macros.fat).toBe(50);
  });

  it('所有宏量值大于 0', () => {
    const macros = calculateMacroTargets(2000, { protein: 30, carbs: 45, fat: 25 });
    expect(macros.protein).toBeGreaterThan(0);
    expect(macros.carbs).toBeGreaterThan(0);
    expect(macros.fat).toBeGreaterThan(0);
  });

  it('宏量热量之和接近目标卡路里', () => {
    const target = 2000;
    const macros = calculateMacroTargets(target, { protein: 30, carbs: 45, fat: 25 });
    const total = macros.protein * 4 + macros.carbs * 4 + macros.fat * 9;
    // 允许 ±50 kcal 误差（四舍五入造成）
    expect(Math.abs(total - target)).toBeLessThan(50);
  });
});
