// ============================================
// 自定义食物构建器
// 用户可以把多种食材按克数组合，生成一个新的自定义食物
// 例：手打黑豆浆 = 红豆30g + 黑豆30g + 黑米30g + 黑芝麻5g + 红枣3个
// ============================================

import { useState, useEffect, useRef } from 'react';
import type { FoodItem } from '../../types/food';
import { searchBuiltinFoods } from '../../services/food-lookup';
import { searchCustomFoods, calcRecipeNutrition, saveCustomFood } from '../../utils/customFoods';
import type { RecipeIngredient } from '../../utils/customFoods';
import { formatNumber } from '../../utils/calculator';

interface RecipeBuilderProps {
  onClose: () => void;
  onSaved: (foodItem: FoodItem) => void;
}

export function RecipeBuilder({ onClose, onSaved }: RecipeBuilderProps) {
  const [name, setName] = useState('');
  const [servingLabel, setServingLabel] = useState('');   // 可选自定义份量名
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);

  // 食材搜索
  const [ingQuery, setIngQuery] = useState('');
  const [ingResults, setIngResults] = useState<FoodItem[]>([]);
  const [showIngSearch, setShowIngSearch] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // 实时计算营养
  const { per100g, totalGrams } = calcRecipeNutrition(ingredients);
  const totalCalories = Math.round(per100g.calories * totalGrams / 100);

  // 食材搜索防抖
  useEffect(() => {
    const q = ingQuery.trim();
    if (!q) { setIngResults([]); return; }
    const timer = setTimeout(() => {
      const builtin = searchBuiltinFoods(q);
      const custom = searchCustomFoods(q);
      // 合并去重
      const all = [...custom, ...builtin].slice(0, 12);
      setIngResults(all);
    }, 200);
    return () => clearTimeout(timer);
  }, [ingQuery]);

  // 添加食材（默认100g，用户可修改）
  const addIngredient = (food: FoodItem) => {
    setIngredients(prev => {
      const exists = prev.find(i => i.foodId === food.id);
      if (exists) return prev; // 已添加则忽略
      return [...prev, {
        foodId: food.id,
        foodName: food.name,
        grams: food.servingSizes?.[0]?.grams ?? 100,
        per100g: food.per100g,
      }];
    });
    setIngQuery('');
    setIngResults([]);
    setShowIngSearch(false);
  };

  const updateGrams = (idx: number, val: string) => {
    const g = Math.max(0.1, Number(val) || 0);
    setIngredients(prev => prev.map((ing, i) => i === idx ? { ...ing, grams: g } : ing));
  };

  const removeIngredient = (idx: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (!name.trim()) { setError('请输入食物名称'); return; }
    if (ingredients.length === 0) { setError('请至少添加一种食材'); return; }
    setSaving(true);
    setError('');

    const defaultLabel = `1份 (${totalGrams}g)`;
    const record = saveCustomFood({
      name: name.trim(),
      ingredients,
      totalGrams,
      per100g,
      servingSizes: [
        { label: servingLabel.trim() || defaultLabel, grams: totalGrams },
      ],
    });

    // 转成 FoodItem 直接可用
    const foodItem: FoodItem = {
      id: record.id,
      name: record.name,
      category: 'other',
      per100g: record.per100g,
      servingSizes: record.servingSizes,
      source: 'user_added',
      tags: ['自制'],
    };

    setSaving(false);
    onSaved(foodItem);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">取消</button>
          <h3 className="font-semibold text-gray-900">创建自定义食物</h3>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || ingredients.length === 0}
            className="text-sm font-semibold text-green-600 hover:text-green-700 disabled:text-gray-300 disabled:cursor-not-allowed"
          >
            {saving ? '保存中…' : '保存'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">

          {/* 食物名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">食物名称 *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="例：手打黑豆浆"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            />
          </div>

          {/* 自定义份量标签（可选） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              份量标签 <span className="text-gray-400 font-normal">（可选，默认"1份"）</span>
            </label>
            <input
              type="text"
              value={servingLabel}
              onChange={e => setServingLabel(e.target.value)}
              placeholder={`例：1杯 (${totalGrams || '?'}g)  · 1碗 · 1瓶`}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            />
          </div>

          {/* 食材列表 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">食材配比 *</label>
              {ingredients.length > 0 && (
                <span className="text-xs text-gray-400">共 {totalGrams}g</span>
              )}
            </div>

            {/* 已添加食材 */}
            {ingredients.length > 0 && (
              <div className="space-y-2 mb-3">
                {ingredients.map((ing, idx) => (
                  <div key={ing.foodId} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                    <span className="flex-1 text-sm text-gray-800 truncate">{ing.foodName}</span>
                    <div className="relative shrink-0">
                      <input
                        type="number"
                        value={ing.grams}
                        onChange={e => updateGrams(idx, e.target.value)}
                        className="w-20 border border-gray-200 rounded-lg px-2 py-1 pr-5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">g</span>
                    </div>
                    <button
                      onClick={() => removeIngredient(idx)}
                      className="text-gray-300 hover:text-red-400 text-lg leading-none shrink-0 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 添加食材搜索框 */}
            <div className="relative">
              <input
                ref={searchRef}
                type="text"
                value={ingQuery}
                onChange={e => { setIngQuery(e.target.value); setShowIngSearch(true); }}
                onFocus={() => setShowIngSearch(true)}
                placeholder="搜索食材，如「红豆」「黑米」…"
                className="w-full border border-dashed border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {/* 搜索结果下拉 */}
              {showIngSearch && ingResults.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                  {ingResults.map(food => (
                    <button
                      key={food.id}
                      onClick={() => addIngredient(food)}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-800">{food.name}</div>
                        <div className="text-xs text-gray-400">
                          {food.per100g.calories} kcal/100g · 蛋白 {food.per100g.protein}g
                        </div>
                      </div>
                      {ingredients.some(i => i.foodId === food.id) && (
                        <span className="text-xs text-green-500 shrink-0 ml-2">已添加</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 营养预览 */}
          {ingredients.length > 0 && (
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">合并营养预览</span>
                <span className="text-xs text-gray-400">基于配比总量 {totalGrams}g</span>
              </div>
              {/* 这一份总计 */}
              <div className="text-center mb-3 py-2 bg-white rounded-lg">
                <div className="text-2xl font-bold text-green-700">{totalCalories}</div>
                <div className="text-xs text-gray-400">这一份总热量 (kcal)</div>
              </div>
              {/* per100g */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>每100g热量</span>
                  <span className="font-medium text-gray-700">{per100g.calories} kcal</span>
                </div>
                <div className="flex justify-between">
                  <span>蛋白质</span>
                  <span className="font-medium text-gray-700">{formatNumber(per100g.protein)}g</span>
                </div>
                <div className="flex justify-between">
                  <span>碳水</span>
                  <span className="font-medium text-gray-700">{formatNumber(per100g.carbs)}g</span>
                </div>
                <div className="flex justify-between">
                  <span>脂肪</span>
                  <span className="font-medium text-gray-700">{formatNumber(per100g.fat)}g</span>
                </div>
                <div className="flex justify-between">
                  <span>膳食纤维</span>
                  <span className="font-medium text-gray-700">{formatNumber(per100g.fiber)}g</span>
                </div>
              </div>
              {/* 食材明细 */}
              <div className="mt-3 pt-3 border-t border-green-100">
                <div className="text-xs text-gray-400 mb-1.5">食材明细</div>
                {ingredients.map(ing => {
                  const cal = Math.round(ing.per100g.calories * ing.grams / 100);
                  return (
                    <div key={ing.foodId} className="flex justify-between text-xs text-gray-500 py-0.5">
                      <span>{ing.foodName} {ing.grams}g</span>
                      <span>{cal} kcal</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {error && <div className="text-sm text-red-500 text-center">{error}</div>}
        </div>
      </div>
    </div>
  );
}
