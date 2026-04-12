import { describe, it, expect } from 'vitest';
import {
  scaleNutrition,
  sumNutrition,
  getGILevel,
  EMPTY_NUTRITION,
} from '../types/food';

describe('scaleNutrition', () => {
  const per100g = {
    calories: 200, protein: 20, carbs: 10, fat: 8, fiber: 2,
    sugar: 4, sodium: 100, omega3: 500,
  };

  it('100g 时数据不变', () => {
    const result = scaleNutrition(per100g, 100);
    expect(result.calories).toBe(200);
    expect(result.protein).toBe(20);
    expect(result.fat).toBe(8);
  });

  it('50g 时各数值减半', () => {
    const result = scaleNutrition(per100g, 50);
    expect(result.calories).toBe(100);
    expect(result.protein).toBe(10);
    expect(result.carbs).toBe(5);
  });

  it('200g 时各数值翻倍', () => {
    const result = scaleNutrition(per100g, 200);
    expect(result.calories).toBe(400);
    expect(result.omega3).toBe(1000);
  });

  it('正确缩放进阶字段', () => {
    const result = scaleNutrition(per100g, 150);
    expect(result.sugar).toBe(6);
    expect(result.sodium).toBe(150);
  });

  it('处理 0g 输入', () => {
    const result = scaleNutrition(per100g, 0);
    expect(result.calories).toBe(0);
    expect(result.protein).toBe(0);
  });
});

describe('sumNutrition', () => {
  it('空数组返回全零', () => {
    const result = sumNutrition([]);
    expect(result.calories).toBe(0);
    expect(result.protein).toBe(0);
  });

  it('正确累加多个食物', () => {
    const items = [
      { ...EMPTY_NUTRITION, calories: 100, protein: 10, carbs: 20, fat: 5, fiber: 2 },
      { ...EMPTY_NUTRITION, calories: 200, protein: 20, carbs: 30, fat: 8, fiber: 3 },
    ];
    const result = sumNutrition(items);
    expect(result.calories).toBe(300);
    expect(result.protein).toBe(30);
    expect(result.carbs).toBe(50);
    expect(result.fat).toBe(13);
    expect(result.fiber).toBe(5);
  });

  it('只累加一个食物时数据一致', () => {
    const item = { ...EMPTY_NUTRITION, calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 };
    const result = sumNutrition([item]);
    expect(result.calories).toBe(165);
    expect(result.protein).toBe(31);
  });
});

describe('getGILevel', () => {
  it('GI ≤ 55 为低', () => {
    expect(getGILevel(10)).toBe('low');
    expect(getGILevel(55)).toBe('low');
  });

  it('56-69 为中', () => {
    expect(getGILevel(56)).toBe('medium');
    expect(getGILevel(69)).toBe('medium');
  });

  it('≥ 70 为高', () => {
    expect(getGILevel(70)).toBe('high');
    expect(getGILevel(100)).toBe('high');
  });
});
