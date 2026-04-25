// ============================================
// 添加食物弹窗
// 顶部拨动开关：按份量 ↔ 按克重，两种模式完全平等
// ============================================

import { useState, useMemo } from 'react';
import type { FoodItem, NutritionData } from '../../types/food';
import { scaleNutrition } from '../../types/food';
import { GIBadge } from '../../components/ui/GIBadge';
import { formatNumber } from '../../utils/calculator';
import { inferServingSizes } from '../../utils/inferServingSizes';
import { useSwipeDown } from '../../hooks/useSwipeDown';
import { BottomReturnButton } from '../../components/ui/BottomReturnButton';
import { autoSelect } from '../../utils/inputHelpers';
import { getAllCustomFoods } from '../../utils/customFoods';
import { useLocale } from '../../i18n/useLocale';
import { localizeServingLabel, localizeUnit } from '../../utils/servingLabels';

interface AddFoodModalProps {
  food: FoodItem;
  quickGrams?: number;
  quickUnit?: string;
  onConfirm: (food: FoodItem, grams: number, displayUnit: string) => void;
  onBack: () => void;
  onClose: () => void;
}

type InputMode = 'serving' | 'grams';

export function AddFoodModal({ food: foodProp, quickGrams, quickUnit, onConfirm, onBack, onClose }: AddFoodModalProps) {
  const { t, locale } = useLocale();
  // recentFoods stores FoodItem without ingredients; look up fresh from localStorage
  const food = useMemo(() => {
    if (foodProp.source !== 'user_added' || foodProp.ingredients) return foodProp;
    const record = getAllCustomFoods().find(r => r.id === foodProp.id);
    if (!record || !record.ingredients.length) return foodProp;
    return {
      ...foodProp,
      ingredients: record.ingredients.map(i => ({ foodName: i.foodName, grams: i.grams })),
    };
  }, [foodProp]);
  // 用户自定义食物：只用用户明确设置的份量，不做推断（避免豆浆等用豆子克数录入的食物被错误换算成 ml）
  // 内置 / 联网食物：合并自带份量 + 推断份量（useMemo 避免每次渲染重新计算）
  const mergedServings = useMemo(() => {
    const builtinServings = food.servingSizes ?? [];
    // 食物已有明确份量（如荔枝的"5颗"）→ 不再附加推断份量，避免混入通用水果份量
    const inferred = (food.source === 'user_added' || builtinServings.length > 0)
      ? []
      : inferServingSizes(food);
    return [
      ...builtinServings,
      ...inferred.filter(s => !builtinServings.some(b => Math.abs(b.grams - s.grams) < 5)),
    ];
  }, [food]);
  const hasServings = mergedServings.length > 0;

  // 默认模式：有 quickGrams 时用克重；自定义食物且无份量时也默认克重；否则用份量
  const defaultMode: InputMode = (quickGrams || (food.source === 'user_added' && !hasServings)) ? 'grams' : 'serving';
  const [mode, setMode] = useState<InputMode>(defaultMode);

  // 份量模式状态
  const [selectedServing, setSelectedServing] = useState(0);
  const [servingQtyStr, setServingQtyStr] = useState('1'); // 输入框字符串，支持任意小数
  const servingQty = Math.max(0.01, Number(servingQtyStr) || 1);

  // 克重模式状态
  const [grams, setGrams] = useState(quickGrams ? String(quickGrams) : '100');

  // ── 计算实际克数 & 显示单位 ──────────────
  const serving = mergedServings[selectedServing];
  const servingGrams = serving?.grams ?? 100;
  const servingLabel = localizeServingLabel(serving?.label ?? `${servingGrams}g`, locale);

  const actualGrams = mode === 'serving'
    ? servingGrams * servingQty
    : (Number(grams) || 0);

  const displayUnit = mode === 'serving'
    ? (servingQty === 1 ? servingLabel : `${servingQty} × ${servingLabel}`)
    : `${actualGrams}g`;

  const nutrition: NutritionData = scaleNutrition(food.per100g, actualGrams);

  const changeQty = (delta: number) => {
    const next = Math.max(0.5, Math.round((servingQty + delta) * 2) / 2);
    setServingQtyStr(String(next));
  };

  const { cardRef, dragHandlers, cardDragHandlers } = useSwipeDown(onClose);

  return (
    <div
      className="fixed inset-x-0 bg-black/40 z-50 flex items-end sm:items-center justify-center"
      style={{ top: 'var(--vvt, 0px)', height: 'var(--vvh, 100vh)' }}
      onClick={onClose}
    >
      <div
        ref={cardRef}
        className="modal-enter bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl flex flex-col"
        style={{ maxHeight: 'var(--vvh, 90vh)' }}
        onClick={e => e.stopPropagation()}
        {...cardDragHandlers}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-3 pb-1 shrink-0 cursor-grab"
          style={{ touchAction: 'none' }}
          {...dragHandlers}
        >
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 pb-3 shrink-0 border-b border-gray-100 text-center">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{food.name}</h3>
          {food.brand && <div className="text-xs text-gray-400">{food.brand}</div>}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* ── 模式切换开关 ── */}
          <div className="flex items-center justify-center">
            <div className="relative flex bg-gray-100 rounded-xl p-1 w-64">
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-transform duration-200 ${
                  mode === 'grams' ? 'translate-x-[calc(100%+8px)]' : 'translate-x-0'
                }`}
              />
              <button
                onClick={() => setMode('serving')}
                className={`relative z-10 flex-1 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
                  mode === 'serving' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {t('byServing')}
              </button>
              <button
                onClick={() => setMode('grams')}
                className={`relative z-10 flex-1 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
                  mode === 'grams' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {t('byGrams')}
              </button>
            </div>
          </div>

          {/* ── 按份量 ── */}
          {mode === 'serving' && (
            <div className="space-y-3">
              {/* 份量选择 */}
              <div className="flex flex-wrap gap-2">
                {mergedServings.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedServing(i)}
                    className={`px-3 py-2 rounded-xl text-sm border transition-all ${
                      selectedServing === i
                        ? 'bg-green-50 text-green-700 border-green-400 font-medium'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {localizeServingLabel(s.label, locale)}
                  </button>
                ))}
              </div>

              {/* 份数 +/- */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">{t('servings')}</span>
                <div className="flex items-center gap-0 bg-gray-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => changeQty(-0.5)}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-200 text-lg font-light transition-colors"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0.01"
                    step="0.5"
                    value={servingQtyStr}
                    onChange={e => setServingQtyStr(e.target.value)}
                    onFocus={e => { const t = e.target; setTimeout(() => t.select(), 50); }}
                    onBlur={e => {
                      // 失焦时规范化：确保是合法正数
                      const v = parseFloat(e.target.value);
                      setServingQtyStr(isNaN(v) || v <= 0 ? '1' : String(v));
                    }}
                    className="w-14 h-10 text-center text-sm font-semibold text-gray-800 bg-transparent focus:outline-none"
                  />
                  <button
                    onClick={() => changeQty(0.5)}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-200 text-lg font-light transition-colors"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-gray-400">= {actualGrams}g</span>
              </div>

              {/* 推断提示 — 仅当无内置份量时显示 */}
              {(food.servingSizes?.length ?? 0) === 0 && (
                <div className="text-xs text-gray-400">
                  {t('servingInferred')}
                </div>
              )}
            </div>
          )}

          {/* ── 按克重 ── */}
          {mode === 'grams' && (
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="number"
                  value={grams}
                  onChange={e => setGrams(e.target.value)}
                  onFocus={autoSelect}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 text-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={t('gramsPlaceholder')}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">g</span>
              </div>
              {/* 常用克数快捷选 */}
              <div className="flex gap-2 flex-wrap">
                {[30, 50, 100, 150, 200, 300].map(g => (
                  <button
                    key={g}
                    onClick={() => setGrams(String(g))}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                      grams === String(g)
                        ? 'bg-green-50 text-green-700 border-green-400'
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {g}g
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 确认按钮 — 紧接输入区，键盘打开时仍在可视范围内 */}
          <button
            onClick={() => onConfirm(food, actualGrams, displayUnit)}
            disabled={actualGrams <= 0}
            className="w-full bg-green-600 text-white rounded-xl py-3.5 font-semibold hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('addButton')} · {formatNumber(nutrition.calories)} {localizeUnit('kcal', locale)}
          </button>

          {/* 当前选择预览 */}
          <div className="text-xs text-gray-400 text-center">
            {t('selectedPrefix')}{displayUnit}
          </div>

          {/* 食材组成（仅组合食物） */}
          {food.ingredients && food.ingredients.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-sm font-medium text-blue-700 mb-2">{t('ingredients')}</div>
              <div className="grid grid-cols-2 gap-y-1.5 gap-x-6">
                {food.ingredients.map((ing, i) => (
                  <div key={i} className="flex justify-between items-baseline text-xs">
                    <span className="text-gray-700 truncate">{ing.foodName}</span>
                    <span className="text-gray-500 ml-1 shrink-0">{ing.grams}g</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 营养数据 */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">{t('nutritionData')}</span>
              <GIBadge gi={food.gi} />
            </div>
            <div className="grid grid-cols-2 gap-y-2 gap-x-6">
              <NutrientRow label={t('calories')} value={formatNumber(nutrition.calories)} unit="kcal" highlight />
              <NutrientRow label={t('protein')} value={formatNumber(nutrition.protein)} unit="g" />
              <NutrientRow label={t('carbs')} value={formatNumber(nutrition.carbs)} unit="g" />
              <NutrientRow label={t('fat')} value={formatNumber(nutrition.fat)} unit="g" />
              <NutrientRow label={t('fiber')} value={formatNumber(nutrition.fiber)} unit="g" />
              {nutrition.sugar !== undefined && (
                <NutrientRow label={t('sugar')} value={formatNumber(nutrition.sugar)} unit="g" />
              )}
              {nutrition.sodium !== undefined && (
                <NutrientRow label={t('sodium')} value={formatNumber(nutrition.sodium)} unit="mg" />
              )}
            </div>
            {food.source === 'ai_estimated' && (
              <div className="mt-2 text-xs text-amber-500">{t('aiDataNote')}</div>
            )}
            {food.source === 'user_added' && (
              <div className="mt-2 text-xs text-blue-500">{t('userDataNote')}</div>
            )}
          </div>

        </div>

        <BottomReturnButton onClick={onBack} />
      </div>
    </div>
  );
}

function NutrientRow({ label, value, unit, highlight }: {
  label: string; value: string; unit: string; highlight?: boolean;
}) {
  const { locale } = useLocale();
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-sm ${highlight ? 'font-bold text-green-700' : 'font-medium text-gray-700'}`}>
        {value}<span className="text-xs text-gray-400 ml-0.5">{localizeUnit(unit, locale)}</span>
      </span>
    </div>
  );
}
