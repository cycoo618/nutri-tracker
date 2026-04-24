// ============================================
// 常用食物记录 — 存在 localStorage
// 记录每种食物的使用次数 & 最近用量，用于快捷添加
// ============================================

import type { FoodItem } from '../types/food';

const STORAGE_KEY = 'nutri_recent_foods';
const MAX_ENTRIES = 30;

export interface RecentFoodEntry {
  food: FoodItem;
  lastUsed: string;   // ISO timestamp
  useCount: number;
  lastGrams: number;
  lastUnit: string;
}

function load(): RecentFoodEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function save(entries: RecentFoodEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (e) { console.warn('[recentFoods] localStorage save failed:', e); }
}

/** 每次添加食物时调用，更新常用记录 */
export function recordFoodUsage(food: FoodItem, grams: number, unit: string): void {
  const entries = load();
  const idx = entries.findIndex(e => e.food.id === food.id);

  if (idx >= 0) {
    entries[idx].useCount += 1;
    entries[idx].lastUsed = new Date().toISOString();
    entries[idx].lastGrams = grams;
    entries[idx].lastUnit = unit;
    entries[idx].food = food;
  } else {
    entries.push({
      food,
      lastUsed: new Date().toISOString(),
      useCount: 1,
      lastGrams: grams,
      lastUnit: unit,
    });
  }

  // 排序：使用次数多的在前，同次数按最近使用时间排
  entries.sort((a, b) =>
    b.useCount !== a.useCount
      ? b.useCount - a.useCount
      : b.lastUsed.localeCompare(a.lastUsed),
  );

  save(entries.slice(0, MAX_ENTRIES));
}

/** 获取常用食物列表（最多返回指定数量） */
export function getRecentFoods(limit = 12): RecentFoodEntry[] {
  return load().slice(0, limit);
}
