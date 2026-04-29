// ============================================
// 联网 / AI 搜索结果本地缓存
// 搜索过的食物存入 localStorage，下次直接从本地找到，无需再次联网
// ============================================

import type { FoodItem } from '../types/food';

const CACHE_KEY = 'nutri-search-cache';
const MAX_ITEMS = 500; // 防止 localStorage 过大

function readCache(): FoodItem[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as FoodItem[]) : [];
  } catch {
    return [];
  }
}

function writeCache(foods: FoodItem[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(foods));
  } catch (e) {
    console.warn('[SearchCache] write failed:', e);
  }
}

/**
 * 把食物列表存入缓存（按 id 去重；最新的排最前；超出 MAX_ITEMS 截断）
 */
export function cacheFoods(foods: FoodItem[]): void {
  if (!foods.length) return;
  const existing = readCache();
  const existingIds = new Set(existing.map(f => f.id));
  const newFoods = foods.filter(f => !existingIds.has(f.id));
  if (!newFoods.length) return;
  // 新结果插到最前（最近搜索优先）
  const merged = [...newFoods, ...existing].slice(0, MAX_ITEMS);
  writeCache(merged);
}

/**
 * 在缓存中搜索食物（逻辑与内置数据库保持一致）
 */
export function searchCachedFoods(query: string): FoodItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const foods = readCache();
  return foods
    .filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.nameEn?.toLowerCase().includes(q) ||
      f.aliases?.some(a => a.toLowerCase().includes(q)) ||
      f.brand?.toLowerCase().includes(q) ||
      f.tags?.some(t => t.toLowerCase().includes(q))
    )
    .sort((a, b) => {
      // 以搜索词开头的排前面
      const aStart = a.name.toLowerCase().startsWith(q) ? 0 : 1;
      const bStart = b.name.toLowerCase().startsWith(q) ? 0 : 1;
      return aStart - bStart;
    });
}

/** 清空缓存（用于调试或设置页） */
export function clearSearchCache(): void {
  localStorage.removeItem(CACHE_KEY);
}
