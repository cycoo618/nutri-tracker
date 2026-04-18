// ============================================
// 主看板页面 — 今日饮食总览
// 饮食记录以时间线形式展示，不再分早中晚餐
// ============================================

import { useState, useRef, useEffect } from 'react';
import type { UserProfile } from '../../types/user';
import { GOAL_LABELS } from '../../types/user';
import type { DailyLog } from '../../types/log';
import type { FoodItem } from '../../types/food';
import type { NutritionStatus } from '../../hooks/useNutrition';
import type { SyncStatus } from '../../hooks/useFoodLog';
import type { RecentFoodEntry } from '../../utils/recentFoods';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { MacroCard } from '../../components/ui/MacroCard';
import { GIBadge } from '../../components/ui/GIBadge';
import { FoodSearch } from '../food-log/FoodSearch';
import { AddFoodModal } from '../food-log/AddFoodModal';
import { FoodPantryPage } from '../pantry/FoodPantryPage';
import { formatDateCN, formatNumber } from '../../utils/calculator';

interface DashboardPageProps {
  profile: UserProfile;
  dailyLog: DailyLog | null;
  nutritionStatus: NutritionStatus | null;
  currentDate: string;
  recentFoods: RecentFoodEntry[];
  syncStatus: SyncStatus;
  syncError: string | null;
  onForceSync: () => Promise<void>;
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
  syncStatus,
  syncError,
  onForceSync,
  onDateChange,
  onAddFood,
  onRemoveFood,
  onLogout,
}: DashboardPageProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [showPantry, setShowPantry] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quickEntry, setQuickEntry] = useState<RecentFoodEntry | null>(null);

  const anyModalOpen = showSearch || showPantry || !!selectedFood;

  // iOS Safari 在 fixed 弹窗内 input 获取焦点时会滚动底层页面。
  // 用 non-passive touchmove 监听器阻止背景滚动，同时允许弹窗内部滚动。
  useEffect(() => {
    if (!anyModalOpen) return;

    const prevent = (e: TouchEvent) => {
      // 如果触摸目标在可滚动容器内，放行
      let el = e.target as Element | null;
      while (el && el !== document.documentElement) {
        const s = window.getComputedStyle(el);
        if (s.overflow.includes('scroll') || s.overflow.includes('auto') ||
            s.overflowY.includes('scroll') || s.overflowY.includes('auto')) {
          return;
        }
        el = el.parentElement;
      }
      e.preventDefault();
    };

    document.addEventListener('touchmove', prevent, { passive: false });
    return () => document.removeEventListener('touchmove', prevent);
  }, [anyModalOpen]);

  // 简单的 lockBody/unlockBody（不再用 position:fixed，避免视觉跳动）
  const lockCount = useRef(0);
  const lockBody = () => { lockCount.current++; };
  const unlockBody = () => { lockCount.current = Math.max(0, lockCount.current - 1); };

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

  const openSearch = () => { lockBody(); setShowSearch(true); };
  const closeSearch = () => { setShowSearch(false); unlockBody(); };
  const openPantry = () => { lockBody(); setShowPantry(true); };
  const closePantry = () => { setShowPantry(false); unlockBody(); };
  const selectFood = (food: FoodItem) => { setSelectedFood(food); };
  const clearFood = () => { setSelectedFood(null); setQuickEntry(null); unlockBody(); };

  const handleQuickAdd = (entry: RecentFoodEntry) => {
    setQuickEntry(entry);
    setSelectedFood(entry.food);
    setShowSearch(false);
    // body 已锁，从 search → addModal 不需要重新 lock/unlock
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
          <div className="flex items-center gap-3">
            {/* 同步状态指示器 */}
            {syncStatus === 'syncing' && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <span className="w-3 h-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin inline-block" />
                同步中
              </span>
            )}
            {syncStatus === 'synced' && (
              <button
                onClick={onForceSync}
                className="text-xs text-green-500 flex items-center gap-1 hover:text-green-600 transition-colors"
                title="点击手动同步"
              >
                ☁️ 已同步
              </button>
            )}
            {(syncStatus === 'error' || syncStatus === 'idle') && (
              <button
                onClick={onForceSync}
                className="text-xs text-red-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                title={syncError ?? '点击重新同步'}
              >
                {syncStatus === 'error' ? '⚠️ 重新同步' : '🔄 同步'}
              </button>
            )}
            <button onClick={onLogout} className="text-sm text-gray-400 hover:text-gray-600">
              登出
            </button>
          </div>
        </div>
        {/* 同步错误详情横幅 */}
        {syncStatus === 'error' && syncError && (
          <div className="max-w-lg mx-auto px-4 pb-2">
            <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-xs text-red-600 flex items-start justify-between gap-3">
              <div>
                <div><strong>云端同步失败：</strong>{syncError}</div>
                <div className="text-red-400 mt-0.5">数据已保存在本设备，跨设备暂不可见。</div>
              </div>
              <button
                onClick={onForceSync}
                className="shrink-0 bg-red-100 hover:bg-red-200 text-red-600 px-2.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap"
              >
                重试
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-lg mx-auto px-4 pb-32">
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
                onClick={openSearch}
                className="w-7 h-7 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-lg hover:bg-green-200 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {allItems.length === 0 ? (
            <div className="px-4 pb-4">
              <button
                onClick={openSearch}
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

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-20 safe-area-inset-bottom">
        <div className="max-w-lg mx-auto flex items-end h-16">
          {/* 今日 tab */}
          <button className="flex-1 flex flex-col items-center justify-center gap-0.5 pb-2 pt-1 text-green-600">
            <span className="text-xl">📊</span>
            <span className="text-xs font-medium">今日</span>
          </button>

          {/* 中间 + 按钮 */}
          <div className="flex flex-col items-center justify-end pb-3 px-4">
            <button
              onClick={openSearch}
              className="w-14 h-14 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-green-700 active:scale-95 transition-all -translate-y-3"
            >
              +
            </button>
          </div>

          {/* 食材库 tab */}
          <button
            onClick={openPantry}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 pb-2 pt-1 text-gray-400 hover:text-green-600 transition-colors"
          >
            <span className="text-xl">📦</span>
            <span className="text-xs font-medium">食材库</span>
          </button>
        </div>
      </nav>

      {/* Search Modal */}
      {showSearch && (
        <FoodSearch
          recentFoods={recentFoods}
          onSelect={(food) => {
            selectFood(food);
            setShowSearch(false);
            setQuickEntry(null);
            // body 仍然锁住，因为 AddFoodModal 马上要开
          }}
          onClose={closeSearch}
        />
      )}

      {/* Food Pantry */}
      {showPantry && (
        <FoodPantryPage
          onClose={closePantry}
          userId={profile.uid}
          onAddToLog={(food) => {
            selectFood(food);
            setQuickEntry(null);
            setShowPantry(false);
            // body 仍然锁住，AddFoodModal 继续保持锁
          }}
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
            clearFood();
          }}
          onBack={() => {
            setSelectedFood(null);
            setQuickEntry(null);
            setShowSearch(true);
            // body 继续锁，FoodSearch 重新打开
          }}
          onClose={clearFood}
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
