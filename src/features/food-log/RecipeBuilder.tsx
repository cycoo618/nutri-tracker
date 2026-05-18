// ============================================
// 自定义食物构建器
// 用户可以把多种食材按克数组合，生成一个新的自定义食物
// ============================================

import { useState, useRef } from 'react';
import { useSwipeDown } from '../../hooks/useSwipeDown';
import { BottomReturnButton } from '../../components/ui/BottomReturnButton';
import { autoSelect } from '../../utils/inputHelpers';
import type { FoodItem } from '../../types/food';
import { calcRecipeNutrition, saveCustomFood, updateCustomFood, recordToFoodItem } from '../../utils/customFoods';
import type { RecipeIngredient, CustomFoodRecord } from '../../utils/customFoods';
import { saveUserFood } from '../../services/firestore';
import { formatNumber } from '../../utils/calculator';
import { useLocale } from '../../i18n/useLocale';
import { localizeUnit } from '../../utils/servingLabels';
import { FoodSearch } from './FoodSearch';

interface RecipeBuilderProps {
  onClose: () => void;
  onSaved: (foodItem: FoodItem) => void;
  existingRecord?: CustomFoodRecord;
  userId?: string;
  familyId?: string;
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
          onFocus={autoSelect}
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
export function RecipeBuilder({ onClose, onSaved, existingRecord, userId, familyId }: RecipeBuilderProps) {
  const { t, locale } = useLocale();
  const [name, setName] = useState(existingRecord?.name ?? '');
  const [servingLabel, setServingLabel] = useState(existingRecord?.servingSizes?.[0]?.label ?? '');
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(existingRecord?.ingredients ?? []);

  const [showIngFoodSearch, setShowIngFoodSearch] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { cardRef, dragHandlers, cardDragHandlers } = useSwipeDown(onClose);
  const { per100g, totalGrams } = calcRecipeNutrition(ingredients);
  const totalCalories = Math.round(per100g.calories * totalGrams / 100);

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
    setShowIngFoodSearch(false);
  };

  const updateGrams = (idx: number, val: number) => {
    setIngredients(prev => prev.map((ing, i) => i === idx ? { ...ing, grams: val } : ing));
  };

  const removeIngredient = (idx: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (!name.trim()) { setError(t('foodNameRequired')); return; }
    if (ingredients.length === 0) { setError(t('noIngredientError')); return; }
    setSaving(true);
    setError('');

    const defaultLabel = `1份 (${totalGrams}g)`;
    const updates = {
      name: name.trim(),
      pantrySource: 'recipe' as const,
      ingredients,
      totalGrams,
      per100g,
      servingSizes: [{ label: servingLabel.trim() || defaultLabel, grams: totalGrams }],
    };

    let foodItem: FoodItem;
    try {
      if (existingRecord) {
        updateCustomFood(existingRecord.id, updates);
        foodItem = recordToFoodItem({ ...existingRecord, ...updates });
        if (userId) {
          const { imageDataUrl: _img, ...forCloud } = { ...existingRecord, ...updates };
          saveUserFood(userId, forCloud, familyId).catch(() => {});
        }
      } else {
        const record = saveCustomFood(updates);
        if (userId) {
          const { imageDataUrl: _img, ...forCloud } = record;
          saveUserFood(userId, forCloud, familyId).catch(() => {});
        }
        foodItem = recordToFoodItem(record);
      }
    } catch {
      setError(t('saveFailed'));
      setSaving(false);
      return;
    }

    setSaving(false);
    onSaved(foodItem);
  };

  return (
    <div className="fixed inset-x-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" style={{ top: 'var(--vvt, 0px)', height: 'var(--vvh, 100vh)' }} onClick={onClose}>
      <div ref={cardRef} className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl flex flex-col" style={{ maxHeight: 'var(--vvh, 92vh)' }} onClick={e => e.stopPropagation()} {...cardDragHandlers}>

        {/* Drag handle */}
        <div
          className="flex justify-center pt-3 pb-1 shrink-0 cursor-grab"
          style={{ touchAction: 'none' }}
          {...dragHandlers}
        >
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 pb-3 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="w-8" />
          <h3 className="font-semibold text-gray-900">{existingRecord ? t('editRecipeTitle') : t('createRecipeTitle')}</h3>
          <button
            onMouseDown={e => e.preventDefault()}
            onClick={handleSave}
            disabled={saving || !name.trim() || ingredients.length === 0}
            className="text-sm font-semibold text-green-600 hover:text-green-700 disabled:text-gray-300 disabled:cursor-not-allowed"
          >
            {saving ? t('savingEllipsis') : t('save')}
          </button>
        </div>

        <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 space-y-5">

          {/* 食物名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('foodNameRequiredLabel')}</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onFocus={autoSelect}
              placeholder="例：手打黑豆浆"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            />
          </div>

          {/* 份量标签 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('servingLabelField')} <span className="text-gray-400 font-normal">（{t('servingLabelOptional')}）</span>
            </label>
            <input
              type="text"
              value={servingLabel}
              onChange={e => setServingLabel(e.target.value)}
              onFocus={autoSelect}
              placeholder={`例：1杯 (${totalGrams || '?'}g)  · 1碗 · 1瓶`}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            />
          </div>

          {/* 食材列表 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">{t('ingredientsRatioLabel')}</label>
              {ingredients.length > 0 && (
                <span className="text-xs text-gray-400">{locale === 'zh' ? `共 ${totalGrams}${localizeUnit('g', locale)}` : `${totalGrams}${localizeUnit('g', locale)} total`}</span>
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

            {/* 添加食材 — 打开完整搜索弹窗 */}
            <button
              onClick={() => setShowIngFoodSearch(true)}
              className="w-full flex items-center gap-2 border border-dashed border-green-400 rounded-xl px-4 py-2.5 bg-green-50 hover:bg-green-100 transition-colors text-left"
            >
              <span className="text-green-500 text-lg shrink-0">＋</span>
              <span className="text-sm text-green-600">{t('addIngredientPlaceholder')}</span>
            </button>
          </div>

          {/* 营养预览 */}
          {ingredients.length > 0 && (
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">{t('recipePreviewTitle')}</span>
                <span className="text-xs text-gray-400">{t('basedOnTotal')} {totalGrams}{localizeUnit('g', locale)}</span>
              </div>
              <div className="text-center mb-3 py-2 bg-white rounded-lg">
                <div className="text-2xl font-bold text-green-700">{totalCalories}</div>
                <div className="text-xs text-gray-400">{t('totalCaloriesNote')} ({localizeUnit('kcal', locale)})</div>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>{t('per100gCalories')}</span>
                  <span className="font-medium text-gray-700">{per100g.calories} {localizeUnit('kcal', locale)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('protein')}</span>
                  <span className="font-medium text-gray-700">{formatNumber(per100g.protein)}{localizeUnit('g', locale)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('carbs')}</span>
                  <span className="font-medium text-gray-700">{formatNumber(per100g.carbs)}{localizeUnit('g', locale)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('fat')}</span>
                  <span className="font-medium text-gray-700">{formatNumber(per100g.fat)}{localizeUnit('g', locale)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('fiber')}</span>
                  <span className="font-medium text-gray-700">{formatNumber(per100g.fiber)}{localizeUnit('g', locale)}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-green-100">
                <div className="text-xs text-gray-400 mb-1.5">{t('ingredientsDetail')}</div>
                {ingredients.map(ing => {
                  const cal = Math.round(ing.per100g.calories * ing.grams / 100);
                  return (
                    <div key={ing.foodId} className="flex justify-between text-xs text-gray-500 py-0.5">
                      <span>{ing.foodName} {ing.grams}{localizeUnit('g', locale)}</span>
                      <span>{cal} {localizeUnit('kcal', locale)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {error && <div className="text-sm text-red-500 text-center">{error}</div>}
        </div>

        <BottomReturnButton onClick={onClose} />
      </div>

      {/* 食材搜索弹窗 — 复用完整 FoodSearch（含 AI 估算、联网、自定义食物） */}
      {showIngFoodSearch && (
        <FoodSearch
          userId={userId}
          familyId={familyId}
          onSelect={food => addIngredient(food)}
          onClose={() => setShowIngFoodSearch(false)}
        />
      )}
    </div>
  );
}
