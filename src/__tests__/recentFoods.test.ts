import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  recordFoodUsage, registerNewFood, refreshRecentFood, removeRecentFood, getRecentFoods,
} from '../utils/recentFoods';
import type { FoodItem } from '../types/food';

// 跑测试的环境里 localStorage 是 Node 的实验实现（没配 --localstorage-file，
// clear() 直接不可用），所以自带一个内存版，测试不依赖环境细节。
const store = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => { store.set(k, v); },
  removeItem: (k: string) => { store.delete(k); },
  clear: () => { store.clear(); },
});

function food(id: string, name = id): FoodItem {
  return {
    id,
    name,
    category: 'other',
    source: 'builtin',
    per100g: { calories: 100, protein: 5, carbs: 10, fat: 2, fiber: 1 },
  };
}

describe('最常使用列表', () => {
  beforeEach(() => {
    store.clear();
  });

  it('刚扫码录入的食材立刻进列表（useCount 记 0）', () => {
    registerNewFood(food('custom_1', '扫码酸奶'), 170, '1杯 (170g)');
    const list = getRecentFoods();
    expect(list.map(e => e.food.name)).toContain('扫码酸奶');
    expect(list[0].useCount).toBe(0);
    expect(list[0].lastGrams).toBe(170);
  });

  it('新食材不会被一堆高频老记录挤出 limit 之外', () => {
    vi.useFakeTimers();
    try {
      // 20 条老记录，每条都吃过很多次
      vi.setSystemTime(new Date('2026-07-01T08:00:00Z'));
      for (let i = 0; i < 20; i++) {
        for (let n = 0; n < 10; n++) recordFoodUsage(food(`old_${i}`), 100, '100g');
      }
      // 今天才扫进来的
      vi.setSystemTime(new Date('2026-07-28T09:00:00Z'));
      registerNewFood(food('custom_new', '新扫的燕麦'), 40, '1份 (40g)');

      const names = getRecentFoods(12).map(e => e.food.name);
      expect(names).toContain('新扫的燕麦');
      // 最近的排在最前，扫完就能点到
      expect(names[0]).toBe('新扫的燕麦');
      expect(names).toHaveLength(12);
    } finally {
      vi.useRealTimers();
    }
  });

  it('列表没被截断时原样返回，不重复条目', () => {
    recordFoodUsage(food('a'), 100, '100g');
    recordFoodUsage(food('b'), 100, '100g');
    registerNewFood(food('c'), 50, '50g');

    const ids = getRecentFoods(12).map(e => e.food.id);
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
  });

  it('重复登记同一食材不会产生第二条，也不会重置使用次数', () => {
    recordFoodUsage(food('a'), 100, '100g');
    recordFoodUsage(food('a'), 100, '100g');
    registerNewFood(food('a', 'a 改名了'), 100, '100g');

    const list = getRecentFoods();
    expect(list).toHaveLength(1);
    expect(list[0].useCount).toBe(2);
    expect(list[0].food.name).toBe('a 改名了');
  });

  it('编辑配料后刷新营养快照，但不会把没在列表里的食材塞回来', () => {
    recordFoodUsage(food('a'), 100, '100g');

    const edited = { ...food('a'), per100g: { calories: 999, protein: 1, carbs: 1, fat: 1, fiber: 1 } };
    refreshRecentFood(edited);
    expect(getRecentFoods()[0].food.per100g.calories).toBe(999);

    refreshRecentFood(food('never_seen'));
    expect(getRecentFoods().map(e => e.food.id)).toEqual(['a']);
  });

  it('删除食材时同步清出列表', () => {
    registerNewFood(food('custom_1'), 100, '100g');
    recordFoodUsage(food('b'), 100, '100g');

    removeRecentFood('custom_1');
    expect(getRecentFoods().map(e => e.food.id)).toEqual(['b']);
  });
});
