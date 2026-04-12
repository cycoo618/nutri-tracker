// ============================================
// 份量推断 — 根据食物名称 + 分类自动推断常用份量
// 优先级：关键词精确匹配 > 食物分类默认值
// ============================================

import type { FoodItem, ServingSize } from '../types/food';
import { KEYWORD_SERVINGS, CATEGORY_DEFAULTS } from '../data/serving-units';

/**
 * 给任意食物推断合理的份量选项。
 * 对内置数据库已有 servingSizes 的食物不需要调用，主要用于 USDA/联网来源的食物。
 */
export function inferServingSizes(
  food: Pick<FoodItem, 'name' | 'nameEn' | 'aliases' | 'category'>,
): ServingSize[] {
  // 把名称、英文名、所有别名拼成一个搜索字符串
  const searchText = [
    food.name,
    food.nameEn ?? '',
    ...(food.aliases ?? []),
  ]
    .join(' ')
    .toLowerCase();

  for (const entry of KEYWORD_SERVINGS) {
    if (entry.keywords.some(k => searchText.includes(k.toLowerCase()))) {
      return entry.servings;
    }
  }

  // 分类兜底
  return CATEGORY_DEFAULTS[food.category] ?? CATEGORY_DEFAULTS['other'];
}
