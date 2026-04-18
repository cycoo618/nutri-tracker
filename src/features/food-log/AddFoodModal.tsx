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

interface AddFoodModalProps {
  food: FoodItem;
  quickGrams?: number;
  quickUnit?: string;
  onConfirm: (food: FoodItem, grams: number, displayUnit: string) => void;
  onBack: () => void;
  onClose: () => void;
}

type InputMode = 'serving' | 'grams';

export function AddFoodModal({ food, quickGrams, quickUnit, onConfirm, onBack, onClose }: AddFoodModalProps) {
  // 用户自定义食物：只用用户明确设置的份量，不做推断（避免豆浆等用豆子克数录入的食物被错误换算成 ml）
  // 内置 / 联网食物：合并自带份量 + 推断份量（useMemo 避免每次渲染重新计算）
  const mergedServings = useMemo(() => {
    const builtinServings = food.servingSizes ?? [];
    const inferred = food.source === 'user_added' ? [] : inferServingSizes(food);
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
  const [servingQty, setServingQty] = useState(1);

  // 克重模式状态
  const [grams, setGrams] = useState(quickGrams ? String(quickGrams) : '100');

  // ── 计算实际克数 & 显示单位 ──────────────
  const serving = mergedServings[selectedServing];
  const servingGrams = serving?.grams ?? 100;
  const servingLabel = serving?.label ?? `${servingGrams}g`;

  const actualGrams = mode === 'serving'
    ? servingGrams * servingQty
    : (Number(grams) || 0);

  const displayUnit = mode === 'serving'
    ? (servingQty === 1 ? servingLabel : `${servingQty} × ${servingLabel}`)
    : `${actualGrams}g`;

  const nutrition: NutritionData = scaleNutrition(food.per100g, actualGrams);

  const changeQty = (delta: number) =>
    setServingQty(q => Math.max(0.5, Math.round((q + delta) * 2) / 2));

  return (
    <div
      className="fixed inset-x-0 bg-black/40 z-50 flex items-end sm:items-center justify-center"
      style={{ top: 'var(--vvt, 0px)', height: 'var(--vvh, 100vh)' }}
      onClick={onClose}
    >
      <div
        className="modal-enter bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl overflow-y-auto"
        style={{ maxHeight: 'var(--vvh, 90vh)' }}
        onClick={e => e.stopPropagation()}
      >

        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-sm">← 返回</button>
          <div className="text-center flex-1 px-4">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">{food.name}</h3>
            {food.brand && <div className="text-xs text-gray-400">{food.brand}</div>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">关闭</button>
        </div>

        <div className="p-4 space-y-4">

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
                按份量
              </button>
              <button
                onClick={() => setMode('grams')}
                className={`relative z-10 flex-1 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
                  mode === 'grams' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                按克重
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
                    {s.label}
                  </button>
                ))}
              </div>

              {/* 份数 +/- */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">份数</span>
                <div className="flex items-center gap-0 bg-gray-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => changeQty(-0.5)}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-200 text-lg font-light transition-colors"
                  >
                    −
                  </button>
                  <span className="w-12 text-center text-sm font-semibold text-gray-800">
                    {servingQty % 1 === 0 ? servingQty : servingQty.toFixed(1)}
                  </span>
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
                  份量为系统推断，如不准确请切换「按克重」
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
                  onFocus={e => { const t = e.target; setTimeout(() => t.select(), 50); }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 text-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="输入克数"
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

          {/* 当前选择预览 */}
          <div className="text-xs text-gray-400 text-center">
            已选：{displayUnit}
          </div>

          {/* 营养数据 */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">营养数据</span>
              <GIBadge gi={food.gi} />
            </div>
            <div className="grid grid-cols-2 gap-y-2 gap-x-6">
              <NutrientRow label="热量" value={formatNumber(nutrition.calories)} unit="kcal" highlight />
              <NutrientRow label="蛋白质" value={formatNumber(nutrition.protein)} unit="g" />
              <NutrientRow label="碳水" value={formatNumber(nutrition.carbs)} unit="g" />
              <NutrientRow label="脂肪" value={formatNumber(nutrition.fat)} unit="g" />
              <NutrientRow label="膳食纤维" value={formatNumber(nutrition.fiber)} unit="g" />
              {nutrition.sugar !== undefined && (
                <NutrientRow label="糖" value={formatNumber(nutrition.sugar)} unit="g" />
              )}
              {nutrition.sodium !== undefined && (
                <NutrientRow label="钠" value={formatNumber(nutrition.sodium)} unit="mg" />
              )}
            </div>
            {food.source === 'ai_estimated' && (
              <div className="mt-2 text-xs text-amber-500">⚠ AI 估算数据，仅供参考</div>
            )}
            {food.source === 'user_added' && (
              <div className="mt-2 text-xs text-blue-500">📝 用户录入数据</div>
            )}
          </div>

          {/* 确认按钮 */}
          <button
            onClick={() => onConfirm(food, actualGrams, displayUnit)}
            disabled={actualGrams <= 0}
            className="w-full bg-green-600 text-white rounded-xl py-3.5 font-semibold hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            添加 · {formatNumber(nutrition.calories)} kcal
          </button>
        </div>
      </div>
    </div>
  );
}

function NutrientRow({ label, value, unit, highlight }: {
  label: string; value: string; unit: string; highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-sm ${highlight ? 'font-bold text-green-700' : 'font-medium text-gray-700'}`}>
        {value}<span className="text-xs text-gray-400 ml-0.5">{unit}</span>
      </span>
    </div>
  );
}
