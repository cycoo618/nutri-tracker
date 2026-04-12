// ============================================
// 主看板页面 — 今日饮食总览
// 饮食记录以时间线形式展示，不再分早中晚餐
// ============================================

import { useState } from 'react';
import type { UserProfile } from '../../types/user';
import { GOAL_LABELS } from '../../types/user';
import type { DailyLog } from '../../types/log';
import type { FoodItem } from '../../types/food';
import type { NutritionStatus } from '../../hooks/useNutrition';
import type { RecentFoodEntry } from '../../utils/recentFoods';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { MacroCard } from '../../components/ui/MacroCard';
import { GIBadge } from '../../components/ui/GIBadge';
import { FoodSearch } from '../food-log/FoodSearch';
import { AddFoodModal } from '../food-log/AddFoodModal';
import { formatDateCN, formatNumber } from '../../utils/calculator';

interface DashboardPageProps {
  profile: UserProfile;
  dailyLog: DailyLog | null;
  nutritionStatus: NutritionStatus | null;
  currentDate: string;
  recentFoods: RecentFoodEntry[];
  onDateChange: (date: string) => void;
  onAddFood: (food: FoodItem, grams: number, displayUnit: string) => void;
  onRemoveFood: (itemId: string) => void;
  onLogout: () => void;
}

/** 格式化 ISO 时间为 "HH:mm" */
function fmtTime(iso?: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return '';
  }
}

export function DashboardPage({
  profile,
  dailyLog,
  nutritionStatus,
  currentDate,
  recentFoods,
  onDateChange,
  onAddFood,
  onRemoveFood,
  onLogout,
}: DashboardPageProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quickEntry, setQuickEntry] = useState<RecentFoodEntry | null>(null);

  const ns = nutritionStatus;

  const navigateDate = (offset: number) => {
    const d = new Date(currentDate + 'T00:00:00');
    d.setDate(d.getDate() + offset);
    onDateChange(d.toISOString().split('T')[0]);
  };

  // 所有食物条目按 loggedAt 排序（旧数据无 loggedAt 时保留原顺序）
  const allItems = dailyLog
    ? dailyLog.meals
        .flatMap(m => m.items)
        .sort((a, b) => (a.loggedAt || '').localeCompare(b.loggedAt || ''))
    : [];

  const handleQuickAdd = (entry: RecentFoodEntry) => {
    setQuickEntry(entry);
    setSelectedFood(entry.food);
    setShowSearch(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🥗</span>
            <span className="font-bold text-gray-900">NutriTrack</span>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              {GOAL_LABELS[profile.goal]}
            </span>
          </div>
          <button onClick={onLogout} className="text-sm text-gray-400 hover:text-gray-600">
            登出
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-24">
        {/* Date Navigator */}
        <div className="flex items-center justify-center gap-4 py-4">
          <button onClick={() => navigateDate(-1)} className="text-gray-400 hover:text-gray-600 p-1">
            ← 前一天
          </button>
          <span className="font-medium text-gray-900">{formatDateCN(currentDate)}</span>
          <button onClick={() => navigateDate(1)} className="text-gray-400 hover:text-gray-600 p-1">
            后一天 →
          </button>
        </div>

        {/* Calorie Ring */}
        {ns && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
            <div className="flex items-center justify-center gap-8">
              <ProgressRing percent={ns.caloriePercent} size={140}>
                <div className="text-3xl font-bold text-gray-900">{ns.consumedCalories}</div>
                <div className="text-xs text-gray-400">/ {ns.targetCalories} kcal</div>
              </ProgressRing>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">剩余</span>
                  <div className={`text-lg font-bold ${ns.isOverCalorie ? 'text-red-500' : 'text-green-600'}`}>
                    {ns.isOverCalorie ? '+' : ''}{Math.abs(ns.remainingCalories)} kcal
                  </div>
                </div>
                {ns.isOverCalorie && (
                  <div className="text-red-500 text-xs">⚠️ 已超出目标</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Macros */}
        {ns && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <MacroCard
              label="蛋白质"
              consumed={ns.macros.protein.consumed}
              target={ns.macros.protein.target}
              percent={ns.macros.protein.percent}
              color="#3b82f6"
            />
            <MacroCard
              label="碳水"
              consumed={ns.macros.carbs.consumed}
              target={ns.macros.carbs.target}
              percent={ns.macros.carbs.percent}
              color="#f59e0b"
            />
            <MacroCard
              label="脂肪"
              consumed={ns.macros.fat.consumed}
              target={ns.macros.fat.target}
              percent={ns.macros.fat.percent}
              color="#ef4444"
            />
          </div>
        )}

        {/* Advanced Nutrition */}
        {ns?.advanced && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">进阶营养指标</h3>
            <div className="space-y-2 text-sm">
              <AdvancedRow
                label="添加糖"
                consumed={ns.advanced.sugar.consumed}
                limit={`< ${ns.advanced.sugar.max}g`}
                status={ns.advanced.sugar.status}
              />
              <AdvancedRow
                label="钠"
                consumed={ns.advanced.sodium.consumed}
                limit={`< ${ns.advanced.sodium.max}mg`}
                status={ns.advanced.sodium.status}
                unit="mg"
              />
              <AdvancedRow
                label="Omega-3"
                consumed={ns.advanced.omega3.consumed}
                limit={`≥ ${ns.advanced.omega3.min}mg`}
                status={ns.advanced.omega3.status}
                unit="mg"
              />
            </div>
          </div>
        )}

        {/* ── 今日饮食时间线 ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-3">
          <div className="flex items-center justify-between p-4 pb-3">
            <h3 className="font-semibold text-gray-800">今日饮食</h3>
            <div className="flex items-center gap-2">
              {allItems.length > 0 && (
                <span className="text-sm text-gray-400">
                  {allItems.reduce((s, i) => s + i.calories, 0)} kcal
                </span>
              )}
              <button
                onClick={() => setShowSearch(true)}
                className="w-7 h-7 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-lg hover:bg-green-200 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {allItems.length === 0 ? (
            <div className="px-4 pb-4">
              <button
                onClick={() => setShowSearch(true)}
                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-green-300 hover:text-green-500 transition-colors"
              >
                + 记录今天吃了什么
              </button>
            </div>
          ) : (
            <div className="px-4 pb-3 divide-y divide-gray-50">
              {allItems.map(item => {
                const time = fmtTime(item.loggedAt);
                return (
                  <div key={item.id} className="flex items-center justify-between py-2.5 group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {time && (
                          <span className="text-xs text-gray-300 font-mono shrink-0">{time}</span>
                        )}
                        <span className="text-sm font-medium text-gray-800 truncate">{item.foodName}</span>
                        <GIBadge gi={item.gi} size="sm" />
                      </div>
                      <span className="text-xs text-gray-400 ml-0">{item.unit}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm text-gray-600">{item.calories} kcal</span>
                      <button
                        onClick={() => onRemoveFood(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs transition-opacity"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Floating Add Button */}
      <button
        onClick={() => setShowSearch(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-green-700 active:scale-95 transition-all z-20"
      >
        +
      </button>

      {/* Search Modal */}
      {showSearch && (
        <FoodSearch
          recentFoods={recentFoods}
          onSelect={(food) => {
            setSelectedFood(food);
            setQuickEntry(null);
            setShowSearch(false);
          }}
          onClose={() => setShowSearch(false)}
        />
      )}

      {/* Add Food Modal */}
      {selectedFood && (
        <AddFoodModal
          food={selectedFood}
          quickGrams={quickEntry?.lastGrams}
          quickUnit={quickEntry?.lastUnit}
          onConfirm={(food, grams, displayUnit) => {
            onAddFood(food, grams, displayUnit);
            setSelectedFood(null);
            setQuickEntry(null);
          }}
          onBack={() => {
            setSelectedFood(null);
            setQuickEntry(null);
            setShowSearch(true);
          }}
          onClose={() => {
            setSelectedFood(null);
            setQuickEntry(null);
          }}
        />
      )}
    </div>
  );
}

function AdvancedRow({ label, consumed, limit, status, unit = 'g' }: {
  label: string; consumed: number; limit: string;
  status: 'good' | 'warning' | 'danger'; unit?: string;
}) {
  const statusColors = { good: 'text-green-600', warning: 'text-amber-500', danger: 'text-red-500' };
  const statusIcons = { good: '✓', warning: '⚠', danger: '✗' };

  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-gray-800">{consumed}{unit}</span>
        <span className="text-gray-400 text-xs">{limit}</span>
        <span className={statusColors[status]}>{statusIcons[status]}</span>
      </div>
    </div>
  );
}
