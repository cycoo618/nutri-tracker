import { describe, it, expect } from 'vitest';
import { FOOD_DATABASE, searchFood, getFoodsByCategory } from '../data/food-database';

describe('FOOD_DATABASE', () => {
  it('包含至少 100 种食物', () => {
    expect(FOOD_DATABASE.length).toBeGreaterThanOrEqual(100);
  });

  it('每种食物都有必填字段', () => {
    FOOD_DATABASE.forEach(food => {
      expect(food.id, `${food.name} 缺少 id`).toBeTruthy();
      expect(food.name, `id=${food.id} 缺少 name`).toBeTruthy();
      expect(food.category, `${food.name} 缺少 category`).toBeTruthy();
      expect(food.per100g, `${food.name} 缺少 per100g`).toBeTruthy();
      expect(food.source, `${food.name} 缺少 source`).toBeTruthy();
    });
  });

  it('每种食物的卡路里大于 0', () => {
    FOOD_DATABASE.forEach(food => {
      expect(food.per100g.calories, `${food.name} 卡路里应 > 0`).toBeGreaterThan(0);
    });
  });

  it('每种食物的营养素不含负值', () => {
    FOOD_DATABASE.forEach(food => {
      const n = food.per100g;
      expect(n.protein, `${food.name} 蛋白质为负`).toBeGreaterThanOrEqual(0);
      expect(n.carbs, `${food.name} 碳水为负`).toBeGreaterThanOrEqual(0);
      expect(n.fat, `${food.name} 脂肪为负`).toBeGreaterThanOrEqual(0);
      expect(n.fiber, `${food.name} 纤维为负`).toBeGreaterThanOrEqual(0);
    });
  });

  it('GI 值为有效正数', () => {
    // 注：部分食物 GI 可超过 100（如红枣干 GI=103），属正常学术数据
    FOOD_DATABASE.filter(f => f.gi !== undefined).forEach(food => {
      expect(food.gi!, `${food.name} GI 不应为负`).toBeGreaterThanOrEqual(0);
      expect(food.gi!, `${food.name} GI 异常偏高`).toBeLessThanOrEqual(130);
    });
  });

  it('giLevel 与 gi 值一致', () => {
    FOOD_DATABASE.filter(f => f.gi !== undefined && f.giLevel !== undefined).forEach(food => {
      const gi = food.gi!;
      const expected = gi <= 55 ? 'low' : gi <= 69 ? 'medium' : 'high';
      expect(food.giLevel, `${food.name} giLevel 与 gi 值不一致`).toBe(expected);
    });
  });

  it('id 在整个数据库中唯一', () => {
    const ids = FOOD_DATABASE.map(f => f.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('包含三文鱼（深海鱼测试）', () => {
    const salmon = FOOD_DATABASE.find(f => f.name.includes('三文鱼'));
    expect(salmon).toBeDefined();
    expect(salmon!.per100g.omega3).toBeGreaterThan(0);
  });

  it('包含西兰花（十字花科测试）', () => {
    const broccoli = FOOD_DATABASE.find(f => f.name.includes('西兰花'));
    expect(broccoli).toBeDefined();
    expect(broccoli!.tags).toContain('十字花科');
  });
});

describe('searchFood', () => {
  it('空字符串返回空数组', () => {
    expect(searchFood('')).toHaveLength(0);
  });

  it('精确名称搜索', () => {
    const results = searchFood('三文鱼');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toContain('三文鱼');
  });

  it('别名搜索', () => {
    // 番茄的别名是西红柿
    const results = searchFood('西红柿');
    expect(results.length).toBeGreaterThan(0);
  });

  it('品牌搜索', () => {
    const results = searchFood('麦当劳');
    expect(results.length).toBeGreaterThan(0);
    results.forEach(r => expect(r.brand).toBe('麦当劳'));
  });

  it('英文搜索', () => {
    const results = searchFood('salmon');
    expect(results.length).toBeGreaterThan(0);
  });

  it('标签搜索（高蛋白）', () => {
    const results = searchFood('高蛋白');
    expect(results.length).toBeGreaterThan(0);
  });

  it('不存在的食物返回空数组', () => {
    expect(searchFood('xyzabc不存在的食物123')).toHaveLength(0);
  });
});

describe('getFoodsByCategory', () => {
  it('蔬菜类别有足够数量', () => {
    const vegs = getFoodsByCategory('vegetable');
    expect(vegs.length).toBeGreaterThanOrEqual(10);
  });

  it('返回的食物都属于正确类别', () => {
    const seafoods = getFoodsByCategory('seafood');
    seafoods.forEach(f => expect(f.category).toBe('seafood'));
  });

  it('不存在的类别返回空数组', () => {
    expect(getFoodsByCategory('nonexistent')).toHaveLength(0);
  });
});
