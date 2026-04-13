// ============================================
// 食物查找服务（三层查找策略）
// 第一层：内置数据库
// 第二层：Open Food Facts API（品牌食品）
// 第三层：AI 估算（Claude API）
// ============================================

import type { FoodItem, NutritionData, ServingSize } from '../types/food';
import { inferServingSizes } from '../utils/inferServingSizes';

// 动态导入食物数据库（避免循环依赖）
let _database: FoodItem[] = [];
let _searchFn: ((query: string) => FoodItem[]) | null = null;

/** 初始化食物数据库（应用启动时调用） */
export async function initFoodDatabase(): Promise<void> {
  const module = await import('../data/food-database');
  _database = module.FOOD_DATABASE;
  _searchFn = module.searchFood;
}

/** 获取完整数据库 */
export function getDatabase(): FoodItem[] {
  return _database;
}

// =====================
// 第一层：内置数据库搜索
// =====================

export function searchBuiltinFoods(query: string): FoodItem[] {
  if (!_searchFn) return [];
  return _searchFn(query);
}

// =====================
// 第二层 A：Open Food Facts API（中文查询）
// 多语言食品库，中文食品覆盖较好
// =====================

interface OFFProduct {
  code?: string;
  product_name?: string;
  product_name_zh?: string;
  brands?: string;
  serving_size?: string;
  nutriments?: Record<string, number>;
}

/** 用 Open Food Facts 搜索中文食物 */
async function searchOpenFoodFactsChinese(query: string): Promise<FoodItem[]> {
  try {
    const url =
      `https://world.openfoodfacts.org/cgi/search.pl` +
      `?search_terms=${encodeURIComponent(query)}` +
      `&search_simple=1&action=process&json=1&lc=zh&page_size=20`;

    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const products: OFFProduct[] = data.products ?? [];

    const results: FoodItem[] = [];
    for (const p of products) {
      const n = p.nutriments ?? {};
      const kcal = n['energy-kcal_100g'] ?? n['energy_100g'] ?? 0;
      if (kcal <= 0) continue;

      const name = p.product_name_zh?.trim() || p.product_name?.trim();
      if (!name) continue;

      const brand = p.brands?.split(',')[0].trim() || undefined;

      // 份量推断
      const partialFood = { name, nameEn: name, aliases: [] as string[], category: 'branded' as const };
      const servingSizes = inferServingSizes(partialFood);

      results.push({
        id: `off_${p.code ?? Math.random().toString(36).slice(2)}`,
        name,
        category: 'branded',
        brand,
        per100g: {
          calories: Math.round(kcal),
          protein:  n['proteins_100g']       ?? 0,
          carbs:    n['carbohydrates_100g']   ?? 0,
          fat:      n['fat_100g']             ?? 0,
          fiber:    n['fiber_100g']           ?? 0,
          sugar:    n['sugars_100g']          || undefined,
          sodium:   n['sodium_100g'] != null ? Math.round(n['sodium_100g'] * 1000) : undefined,
        },
        servingSizes,
        source: 'openfoodfacts',
      });
    }
    return results;
  } catch (err) {
    console.warn('Open Food Facts 查询失败:', err);
    return [];
  }
}

// =====================
// 第二层 B：USDA FoodData Central API（英文查询）
// 免费，注册即得 key：https://fdc.nal.usda.gov/api-guide.html
// =====================

const USDA_API_KEY = import.meta.env.VITE_USDA_API_KEY || 'DEMO_KEY';

interface UsdaFood {
  fdcId: number;
  description: string;
  brandOwner?: string;
  brandName?: string;
  /** USDA 提供的份量字段（Branded 食品较多） */
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  foodNutrients: Array<{
    nutrientId: number;
    nutrientName: string;
    value: number;
    unitName: string;
  }>;
}

/** USDA nutrient IDs */
const USDA_NUTRIENT = {
  calories: 1008,   // Energy (kcal)
  protein:  1003,   // Protein
  fat:      1004,   // Total lipid (fat)
  carbs:    1005,   // Carbohydrate, by difference
  fiber:    1079,   // Fiber, total dietary
  sugar:    2000,   // Sugars, total
  sodium:   1093,   // Sodium
} as const;

function getNutrient(food: UsdaFood, id: number): number {
  return food.foodNutrients.find(n => n.nutrientId === id)?.value ?? 0;
}

/** 判断字符串是否主要为中文（超过30%是CJK字符） */
function isChinese(text: string): boolean {
  const cjk = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
  return cjk / text.length > 0.3;
}

export async function searchOpenFoodFacts(query: string): Promise<FoodItem[]> {
  // 中文查询 → Open Food Facts 中文库
  if (isChinese(query)) {
    return searchOpenFoodFactsChinese(query);
  }

  // 英文查询 → USDA
  try {
    const url =
      `https://api.nal.usda.gov/fdc/v1/foods/search` +
      `?query=${encodeURIComponent(query)}` +
      `&dataType=Branded,Foundation,SR%20Legacy` +
      `&pageSize=20` +
      `&api_key=${USDA_API_KEY}`;

    const res = await fetch(url);
    if (!res.ok) {
      console.warn('USDA API error:', res.status);
      return [];
    }
    const data = await res.json();
    const foods: UsdaFood[] = data.foods ?? [];

    const results: FoodItem[] = [];
    for (let i = 0; i < foods.length; i++) {
      const f = foods[i];
      const kcal = getNutrient(f, USDA_NUTRIENT.calories);
      if (kcal <= 0) continue;

      const name = f.description?.trim();
      if (!name) continue;

      const brand = (f.brandName || f.brandOwner)?.trim() || undefined;

      // ── 份量：优先用 USDA 自带字段，不足时用关键词推断补全 ──
      const servingSizes: ServingSize[] = [];

      // 1. USDA 提供的真实份量（部分 Branded 食品有）
      if (f.householdServingFullText && f.servingSize && f.servingSize > 0) {
        const unit = f.servingSizeUnit?.toLowerCase() === 'ml' ? 'ml' : 'g';
        servingSizes.push({
          label: `${f.householdServingFullText} (${f.servingSize}${unit})`,
          grams: f.servingSize,
        });
      }

      // 2. 关键词/分类推断，补充更多选项
      const partialFood = { name, nameEn: name, aliases: [] as string[], category: 'branded' as const };
      const inferred = inferServingSizes(partialFood);
      for (const s of inferred) {
        // 去重：避免和 USDA 真实份量重复
        if (!servingSizes.some(existing => Math.abs(existing.grams - s.grams) < 5)) {
          servingSizes.push(s);
        }
      }

      results.push({
        id: `usda_${f.fdcId}`,
        name,
        category: 'branded',
        brand,
        per100g: {
          calories: Math.round(kcal),
          protein: getNutrient(f, USDA_NUTRIENT.protein),
          carbs:   getNutrient(f, USDA_NUTRIENT.carbs),
          fat:     getNutrient(f, USDA_NUTRIENT.fat),
          fiber:   getNutrient(f, USDA_NUTRIENT.fiber),
          sugar:   getNutrient(f, USDA_NUTRIENT.sugar) || undefined,
          sodium:  getNutrient(f, USDA_NUTRIENT.sodium) || undefined,
        },
        servingSizes,
        source: 'openfoodfacts',
      });
    }

    return results;
  } catch (err) {
    console.warn('USDA FoodData 查询失败:', err);
    return [];
  }
}

// =====================
// 第三层：AI 估算（预留接口）
// =====================

export interface AIEstimateResult {
  food: FoodItem;
  confidence: 'high' | 'medium' | 'low';
  note?: string;
}

/**
 * AI 估算食物营养（需要后端 API 代理）
 * 目前返回 null，后续接入 Claude API
 */
export async function estimateWithAI(_query: string): Promise<AIEstimateResult | null> {
  // TODO: 接入 Claude API
  // 需要通过后端代理调用，避免前端暴露 API Key
  // const response = await fetch('/api/estimate-food', {
  //   method: 'POST',
  //   body: JSON.stringify({ query }),
  // });
  return null;
}

// =====================
// 统一查找入口
// =====================

export interface FoodSearchResult {
  items: FoodItem[];
  source: 'builtin' | 'openfoodfacts' | 'ai_estimated';
}

/**
 * 三层查找：内置 → Open Food Facts → AI
 * 返回第一个有结果的层
 */
export async function searchFood(query: string): Promise<FoodSearchResult> {
  // 第一层
  const builtinResults = searchBuiltinFoods(query);
  if (builtinResults.length > 0) {
    return { items: builtinResults, source: 'builtin' };
  }

  // 第二层
  const offResults = await searchOpenFoodFacts(query);
  if (offResults.length > 0) {
    return { items: offResults, source: 'openfoodfacts' };
  }

  // 第三层
  const aiResult = await estimateWithAI(query);
  if (aiResult) {
    return { items: [aiResult.food], source: 'ai_estimated' };
  }

  return { items: [], source: 'builtin' };
}
