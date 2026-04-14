// ============================================
// 我的食材库 — 管理自定义食物
// 支持：扫码录入包装袋、组合食材、删除、添加到今日记录
// ============================================

import { useState, useCallback } from 'react';
import type { FoodItem } from '../../types/food';
import { getAllCustomFoods, deleteCustomFood, recordToFoodItem } from '../../utils/customFoods';
import type { CustomFoodRecord } from '../../utils/customFoods';
import { formatNumber } from '../../utils/calculator';
import { NutritionLabelScanner } from '../food-log/NutritionLabelScanner';
import { RecipeBuilder } from '../food-log/RecipeBuilder';

interface FoodPantryPageProps {
  onClose: () => void;
  /** 可选：添加到今日饮食日志 */
  onAddToLog?: (food: FoodItem) => void;
}

type SubView = 'list' | 'scanner' | 'recipe';

export function FoodPantryPage({ onClose, onAddToLog }: FoodPantryPageProps) {
  const [subView, setSubView] = useState<SubView>('list');
  const [records, setRecords] = useState<CustomFoodRecord[]>(() => getAllCustomFoods());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setRecords(getAllCustomFoods());
  }, []);

  const handleSaved = (food: FoodItem) => {
    refresh();
    setSubView('list');
    // 短暂高亮新增的食物
    setAddedId(food.id);
    setTimeout(() => setAddedId(null), 2000);
  };

  const handleDelete = (id: string) => {
    deleteCustomFood(id);
    refresh();
    setDeleteConfirm(null);
  };

  const handleAddToLog = (record: CustomFoodRecord) => {
    if (!onAddToLog) return;
    onAddToLog(recordToFoodItem(record));
  };

  // ── 子视图 ─────────────────────────────────────────────────────────
  if (subView === 'scanner') {
    return (
      <NutritionLabelScanner
        onClose={() => setSubView('list')}
        onSaved={handleSaved}
      />
    );
  }

  if (subView === 'recipe') {
    return (
      <RecipeBuilder
        onClose={() => setSubView('list')}
        onSaved={handleSaved}
      />
    );
  }

  // ── 主列表 ──────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-gray-50 z-40 flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 shrink-0">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm shrink-0"
          >
            ← 返回
          </button>
          <h1 className="flex-1 text-center font-semibold text-gray-900">我的食材库</h1>
          <span className="text-xs text-gray-400 shrink-0">{records.length} 种</span>
        </div>
      </header>

      {/* 操作按钮 */}
      <div className="max-w-lg mx-auto w-full px-4 pt-4 pb-2 shrink-0">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSubView('scanner')}
            className="py-3.5 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-semibold transition-colors shadow-sm"
          >
            <span>📷</span> 扫描包装袋
          </button>
          <button
            onClick={() => setSubView('recipe')}
            className="py-3.5 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-2xl text-sm font-semibold transition-colors shadow-sm"
          >
            <span>🧪</span> 组合食材
          </button>
        </div>
      </div>

      {/* 食物列表 */}
      <div className="flex-1 overflow-y-auto max-w-lg mx-auto w-full px-4 pb-8">

        {records.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📦</div>
            <div className="text-gray-600 font-medium mb-1">食材库是空的</div>
            <div className="text-gray-400 text-sm">扫描包装袋或组合食材，保存到这里</div>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {records.map(record => {
              const isNew = addedId === record.id;
              return (
                <div
                  key={record.id}
                  className={`bg-white rounded-2xl border transition-all ${
                    isNew
                      ? 'border-green-300 shadow-md shadow-green-50'
                      : 'border-gray-100 shadow-sm'
                  }`}
                >
                  <div className="p-4">
                    {/* 名称 + 新增标签 */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900">{record.name}</span>
                          {isNew && (
                            <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full shrink-0">
                              ✓ 已保存
                            </span>
                          )}
                        </div>
                        {/* 份量标签 */}
                        {record.servingSizes.length > 0 && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            {record.servingSizes[0].label}
                          </div>
                        )}
                      </div>
                      {/* 删除 */}
                      {deleteConfirm === record.id ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            取消
                          </button>
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="text-xs text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            确认删除
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(record.id)}
                          className="text-gray-300 hover:text-red-400 text-lg leading-none shrink-0 transition-colors"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    {/* 营养数据 */}
                    <div className="grid grid-cols-4 gap-2 text-center mb-3">
                      <NutriBadge label="热量" value={`${record.per100g.calories}`} unit="kcal" color="amber" />
                      <NutriBadge label="蛋白" value={formatNumber(record.per100g.protein)} unit="g" color="blue" />
                      <NutriBadge label="碳水" value={formatNumber(record.per100g.carbs)} unit="g" color="orange" />
                      <NutriBadge label="脂肪" value={formatNumber(record.per100g.fat)} unit="g" color="red" />
                    </div>
                    <div className="text-xs text-gray-400 mb-3 text-center">以上数据均为每100g</div>

                    {/* 食材明细（有配料才显示） */}
                    {record.ingredients.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-2.5 mb-3">
                        <div className="text-xs text-gray-400 mb-1.5">配料</div>
                        <div className="flex flex-wrap gap-1.5">
                          {record.ingredients.map(ing => (
                            <span
                              key={ing.foodId}
                              className="text-xs bg-white border border-gray-100 rounded-lg px-2 py-0.5 text-gray-600"
                            >
                              {ing.foodName} {ing.grams}g
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 添加到今日 */}
                    {onAddToLog && (
                      <button
                        onClick={() => handleAddToLog(record)}
                        className="w-full py-2 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium rounded-xl transition-colors"
                      >
                        ＋ 添加到今日饮食
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function NutriBadge({
  label, value, unit, color
}: {
  label: string; value: string; unit: string;
  color: 'amber' | 'blue' | 'orange' | 'red';
}) {
  const bg = {
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
    orange: 'bg-orange-50 text-orange-700',
    red: 'bg-red-50 text-red-700',
  }[color];

  return (
    <div className={`${bg} rounded-xl py-2 px-1`}>
      <div className="text-xs font-medium opacity-70">{label}</div>
      <div className="text-sm font-bold">{value}</div>
      <div className="text-xs opacity-60">{unit}</div>
    </div>
  );
}
