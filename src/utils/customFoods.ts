// ============================================
// 自定义食物（食谱）— localStorage 存储
// 允许用户组合多种食材创建专属食物，如"手打黑豆浆"
// ============================================

import type { FoodItem, NutritionData, ServingSize } from '../types/food';

const STORAGE_KEY = 'nutri_custom_foods';

/** 食谱中的单个食材 */
export interface RecipeIngredient {
  foodId: string;
  foodName: string;
  grams: number;
  per100g: NutritionData;  // 快照，避免依赖数据库
}

/** 自定义食物记录（含食谱详情） */
export interface CustomFoodRecord {
  id: string;
  name: string;
  description?: string;
  /** 来源：recipe=组合食材, scanned=拍照识别, manual=手动录入 */
  pantrySource?: 'recipe' | 'scanned' | 'manual';
  ingredients: RecipeIngredient[];
  /** 所有食材总克重 */
  totalGrams: number;
  /** 每100g合并后的营养（用于 FoodItem.per100g） */
  per100g: NutritionData;
  servingSizes: ServingSize[];
  /** 压缩后的标签图片（base64 dataURL，仅扫码录入时存在） */
  imageDataUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ── 计算 ────────────────────────────────────────────────────────────

/** 把食材列表合并成 per100g 营养数据 */
export function calcRecipeNutrition(ingredients: RecipeIngredient[]): {
  per100g: NutritionData;
  totalGrams: number;
} {
  const totalGrams = ingredients.reduce((s, i) => s + i.grams, 0);
  if (totalGrams === 0) {
    return { per100g: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }, totalGrams: 0 };
  }

  // 每种食材的绝对营养 = per100g × (grams/100)
  // 合并后 per100g = (各食材绝对营养之和) / totalGrams × 100
  const sum = (key: keyof NutritionData): number =>
    ingredients.reduce((s, ing) => {
      const v = ing.per100g[key];
      return s + (v ?? 0) * ing.grams / 100;
    }, 0);

  const perGram = 1 / totalGrams;
  return {
    totalGrams,
    per100g: {
      calories:     Math.round(sum('calories')     * 100 * perGram * 10) / 10,
      protein:      Math.round(sum('protein')      * 100 * perGram * 10) / 10,
      carbs:        Math.round(sum('carbs')        * 100 * perGram * 10) / 10,
      fat:          Math.round(sum('fat')          * 100 * perGram * 10) / 10,
      fiber:        Math.round(sum('fiber')        * 100 * perGram * 10) / 10,
      sugar:        nullable(sum('sugar')          * 100 * perGram),
      sodium:       nullable(sum('sodium')         * 100 * perGram),
      saturatedFat: nullable(sum('saturatedFat')   * 100 * perGram),
      omega3:       nullable(sum('omega3')         * 100 * perGram),
      potassium:    nullable(sum('potassium')      * 100 * perGram),
      calcium:      nullable(sum('calcium')        * 100 * perGram),
      iron:         nullable(sum('iron')           * 100 * perGram),
    },
  };
}

function nullable(v: number): number | undefined {
  return v > 0 ? Math.round(v * 10) / 10 : undefined;
}

// ── 转换 ─────────────────────────────────────────────────────────────

/** 将 CustomFoodRecord 转成搜索/添加用的 FoodItem */
export function recordToFoodItem(rec: CustomFoodRecord): FoodItem {
  const tag = rec.pantrySource === 'scanned' ? '扫码'
    : rec.pantrySource === 'manual' ? '手动'
    : '自制';
  return {
    id: rec.id,
    name: rec.name,
    category: 'other',
    per100g: rec.per100g,
    servingSizes: rec.servingSizes,
    source: 'user_added',
    tags: [tag],
  };
}

// ── CRUD ─────────────────────────────────────────────────────────────

function load(): CustomFoodRecord[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function save(records: CustomFoodRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {}
}

export function getAllCustomFoods(): CustomFoodRecord[] {
  return load();
}

/**
 * 合并远端食材到本地 localStorage（以 updatedAt 较新的为准）
 * 用于 Firestore pull 回来后的合并
 */
export function mergeCustomFoods(remoteRecords: CustomFoodRecord[]): void {
  const local = load();
  const map = new Map<string, CustomFoodRecord>();
  // 先放本地，再用远端覆盖（远端更新时间更新则覆盖，否则保留本地）
  for (const r of local) map.set(r.id, r);
  for (const r of remoteRecords) {
    const existing = map.get(r.id);
    if (!existing || r.updatedAt >= existing.updatedAt) {
      map.set(r.id, r);
    }
  }
  save(Array.from(map.values()).sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt)
  ));
}

export function getCustomFoodItems(): FoodItem[] {
  return load().map(recordToFoodItem);
}

export function saveCustomFood(record: Omit<CustomFoodRecord, 'id' | 'createdAt' | 'updatedAt'>): CustomFoodRecord {
  const records = load();
  const now = new Date().toISOString();
  const newRecord: CustomFoodRecord = {
    ...record,
    id: `custom_${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  records.unshift(newRecord);
  save(records);
  return newRecord;
}

export function updateCustomFood(id: string, update: Partial<Omit<CustomFoodRecord, 'id' | 'createdAt'>>): void {
  const records = load();
  const idx = records.findIndex(r => r.id === id);
  if (idx >= 0) {
    records[idx] = { ...records[idx], ...update, updatedAt: new Date().toISOString() };
    save(records);
  }
}

export function deleteCustomFood(id: string): void {
  const records = load().filter(r => r.id !== id);
  save(records);
}

/** 搜索自定义食物（名称模糊匹配） */
export function searchCustomFoods(query: string): FoodItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return getCustomFoodItems();
  return load()
    .filter(r => r.name.toLowerCase().includes(q))
    .map(recordToFoodItem);
}
