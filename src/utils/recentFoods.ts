// ============================================
// 常用食物记录 — 存在 localStorage
// 记录每种食物的使用次数 & 最近用量，用于快捷添加
// ============================================

import type { FoodItem } from '../types/food';

const STORAGE_KEY = 'nutri_recent_foods';
const MAX_ENTRIES = 30;
/** 列表里预留给"最近用过/刚录入"的位置，保证新食材一定露出 */
const RECENT_SLOTS = 4;

/** localStorage 变更后广播，让 useFoodLog 刷新常用列表 */
export const RECENT_FOODS_EVENT = 'recent-foods-change';

export interface RecentFoodEntry {
  food: FoodItem;
  lastUsed: string;   // ISO timestamp
  useCount: number;   // 0 = 刚录入还没吃过
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
    window.dispatchEvent(new Event(RECENT_FOODS_EVENT));
  } catch (e) { console.warn('[recentFoods] localStorage save failed:', e); }
}

/** 使用次数多的在前，同次数按最近使用时间排 */
function byFrequency(a: RecentFoodEntry, b: RecentFoodEntry): number {
  return b.useCount !== a.useCount
    ? b.useCount - a.useCount
    : b.lastUsed.localeCompare(a.lastUsed);
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

  entries.sort(byFrequency);
  save(entries.slice(0, MAX_ENTRIES));
}

/**
 * 刚录入（扫码 / 手动 / 组合）的食材登记进常用列表，useCount 记 0。
 * 没有这一步的话，新食材要先吃过一次才可能出现，而且 useCount=1
 * 往往排在几十条老记录后面、被 limit 截掉，用户就看不到了。
 */
export function registerNewFood(food: FoodItem, grams: number, unit: string): void {
  const entries = load();
  const idx = entries.findIndex(e => e.food.id === food.id);
  if (idx >= 0) {
    // 已存在（如编辑后重新保存）→ 只刷新食物快照和时间，不动使用次数
    entries[idx].food = food;
    entries[idx].lastUsed = new Date().toISOString();
  } else {
    entries.push({
      food,
      lastUsed: new Date().toISOString(),
      useCount: 0,
      lastGrams: grams,
      lastUnit: unit,
    });
  }
  entries.sort(byFrequency);
  save(entries.slice(0, MAX_ENTRIES));
}

/**
 * 食材被编辑后刷新列表里的营养快照（只在已存在时更新，不会把已经
 * 挤出列表的食材重新塞回来）。不动 lastUsed，避免编辑打乱排序。
 */
export function refreshRecentFood(food: FoodItem): void {
  const entries = load();
  const idx = entries.findIndex(e => e.food.id === food.id);
  if (idx < 0) return;
  entries[idx].food = food;
  save(entries);
}

/** 食材被删除时同步清出常用列表 */
export function removeRecentFood(foodId: string): void {
  const entries = load();
  const next = entries.filter(e => e.food.id !== foodId);
  if (next.length !== entries.length) save(next);
}

/**
 * 获取常用食物列表。
 * 前 RECENT_SLOTS 个位置留给最近用过/刚录入的，其余按使用频次填满——
 * 否则新食材永远排在老记录后面，够不着 limit 就永远看不见。
 */
export function getRecentFoods(limit = 12): RecentFoodEntry[] {
  const entries = load().sort(byFrequency);
  if (entries.length <= limit) return entries;

  const recent = [...entries]
    .sort((a, b) => b.lastUsed.localeCompare(a.lastUsed))
    .slice(0, Math.min(RECENT_SLOTS, limit));

  const picked = new Map(recent.map(e => [e.food.id, e]));
  for (const e of entries) {
    if (picked.size >= limit) break;
    if (!picked.has(e.food.id)) picked.set(e.food.id, e);
  }

  // 最近的排前面（刚扫完就能点到），后面接高频项
  const recentIds = new Set(recent.map(e => e.food.id));
  return [
    ...recent,
    ...entries.filter(e => picked.has(e.food.id) && !recentIds.has(e.food.id)),
  ];
}
