// ============================================
// 自定义食物构建器
// 用户可以把多种食材按克数组合，生成一个新的自定义食物
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

// 快捷克数选项
const QUICK_GRAMS = [5, 10, 20, 30, 50, 75, 100, 150, 200];

// ── GramInput 子组件 ────────────────────────────────────────────────
// 用 text+inputMode=decimal 代替 type=number，避免 iOS 小数点删除 bug
// 包含快捷克数芯片
function GramInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [text, setText] = useState(() => String(value));
  const prevRef = useRef(value);

  // 外部值变化时同步（如点击芯片）
  if (prevRef.current !== value) {
    prevRef.current = value;
    setText(String(value));
  }

  const commit = (raw: string) => {
    const n = parseFloat(raw.replace(',', '.'));
    if (!isNaN(n) && n > 0) {
      onChange(n);
      setText(String(n));
      prevRef.current = n;
    } else {
      setText(String(value)); // 无效时恢复
    }
  };

  return (
    <div>
      {/* 输入框 */}
      <div className="flex items-center border-2 border-gray-200 focus-within:border-green-400 rounded-xl bg-white transition-colors">
        <input
          type="text"
          inputMode="decimal"
          value={text}
          onChange={e => setText(e.target.value)}
          onFocus={e => { const t = e.target; setTimeout(() => t.select(), 50); }}
          onBlur={() => commit(text)}
          onKeyDown={e => e.key === 'Enter' && commit(text)}
          className="w-20 py-2.5 pl-3 pr-1 text-sm font-semibold focus:outline-none rounded-l-xl bg-transparent"
          placeholder="100"
        />
        <span className="pr-3 text-xs text-gray-400 font-medium">g</span>
      </div>
      {/* 快捷芯片 */}
      <div className="flex gap-1.5 mt-2 overflow-x-auto pb-0.5 no-scrollbar">
        {QUICK_GRAMS.map(g => (
          <button
            key={g}
            type="button"
            onClick={() => onChange(g)}
            className={`shrink-0 text-xs px-2.5 py-1 rounded-full border transition-colors ${
              value === g
                ? 'bg-green-100 border-green-300 text-green-700 font-semibold'
                : 'border-gray-200 text-gray-400 hover:border-green-300 hover:text-green-600'
            }`}
          >
            {g}g
          </button>
        ))}
      </div>
    </div>
  );
}

// ── 主组件 ─────────────────────────────────────────────────────────
export function RecipeBuilder({ onClose, onSaved }: RecipeBuilderProps) {
  const [name, setName] = useState('');
  const [servingLabel, setServingLabel] = useState('');
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);

  const [ingQuery, setIngQuery] = useState('');
  const [ingResults, setIngResults] = useState<FoodItem[]>([]);
  const [showIngSearch, setShowIngSearch] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { per100g, totalGrams } = calcRecipeNutrition(ingredients);
  const totalCalories = Math.round(per100g.calories * totalGrams / 100);

  // 食材搜索防抖
  useEffect(() => {
    const q = ingQuery.trim();
    if (!q) { setIngResults([]); return; }
    const timer = setTimeout(() => {
      const builtin = searchBuiltinFoods(q);
      const custom = searchCustomFoods(q);
      setIngResults([...custom, ...builtin].slice(0, 12));
    }, 200);
    return () => clearTimeout(timer);
  }, [ingQuery]);

  // 下拉出现时自动滚动，确保用户能看到结果
  useEffect(() => {
    if (ingResults.length > 0 && showIngSearch) {
      setTimeout(() => {
        searchContainerRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 80);
    }
  }, [ingResults.length, showIngSearch]);

  const addIngredient = (food: FoodItem) => {
    setIngredients(prev => {
      if (prev.find(i => i.foodId === food.id)) return prev;
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

  const updateGrams = (idx: number, val: number) => {
    setIngredients(prev => prev.map((ing, i) => i === idx ? { ...ing, grams: val } : ing));
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
      pantrySource: 'recipe',
      ingredients,
      totalGrams,
      per100g,
      servingSizes: [
        { label: servingLabel.trim() || defaultLabel, grams: totalGrams },
      ],
    });

    const foodItem = {
      id: record.id,
      name: record.name,
      category: 'other' as const,
      per100g: record.per100g,
      servingSizes: record.servingSizes,
      source: 'user_added' as const,
      tags: ['自制'],
    };

    setSaving(false);
    onSaved(foodItem);
  };

  return (
    <div className="fixed inset-x-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" style={{ top: 'var(--vvt, 0px)', height: 'var(--vvh, 100vh)' }}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl flex flex-col" style={{ maxHeight: 'var(--vvh, 92vh)' }}>

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

        <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 space-y-5">

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

          {/* 份量标签 */}
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
              <div className="space-y-3 mb-3">
                {ingredients.map((ing, idx) => (
                  <div key={ing.foodId} className="bg-gray-50 rounded-xl px-3 pt-3 pb-2.5">
                    {/* 名称行 */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-800 truncate flex-1">{ing.foodName}</span>
                      <button
                        onClick={() => removeIngredient(idx)}
                        className="text-gray-300 hover:text-red-400 text-xl leading-none ml-2 shrink-0 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                    {/* 克数输入 + 快捷芯片 */}
                    <GramInput
                      value={ing.grams}
                      onChange={v => updateGrams(idx, v)}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 添加食材搜索框 */}
            <div ref={searchContainerRef} className="relative">
              <div className="flex items-center gap-2 border border-dashed border-green-400 rounded-xl px-4 py-2.5 bg-green-50 focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent">
                <span className="text-green-500 text-lg shrink-0">＋</span>
                <input
                  ref={searchRef}
                  type="text"
                  value={ingQuery}
                  onChange={e => { setIngQuery(e.target.value); setShowIngSearch(true); }}
                  onFocus={() => setShowIngSearch(true)}
                  placeholder="搜索并添加食材，如「黑米」「红枣」…"
                  className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700 placeholder-green-400"
                />
              </div>
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
              <div className="text-center mb-3 py-2 bg-white rounded-lg">
                <div className="text-2xl font-bold text-green-700">{totalCalories}</div>
                <div className="text-xs text-gray-400">这一份总热量 (kcal)</div>
              </div>
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
