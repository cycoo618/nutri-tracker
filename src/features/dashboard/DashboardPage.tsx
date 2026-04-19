// ============================================
// 主看板页面 — 今日饮食总览
// 饮食记录以时间线形式展示，不再分早中晚餐
// ============================================

import { useState, useRef, useEffect } from 'react';
import { useSwipeDown } from '../../hooks/useSwipeDown';
import { BottomReturnButton } from '../../components/ui/BottomReturnButton';
import type { UserProfile } from '../../types/user';
import { GOAL_LABELS } from '../../types/user';
import type { DailyLog, MealItem } from '../../types/log';
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
import { FamilyPage } from '../family/FamilyPage';
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

// ── 营养详情底部弹窗 ───────────────────────────────────────────────
function NutritionDetailSheet({ item, onClose }: { item: MealItem; onClose: () => void }) {
  const n = item.nutrition;
  const rows: { label: string; value: number; unit: string }[] = [
    { label: '蛋白质', value: n.protein,       unit: 'g'  },
    { label: '碳水化合物', value: n.carbs,      unit: 'g'  },
    { label: '脂肪',   value: n.fat,           unit: 'g'  },
    { label: '膳食纤维', value: n.fiber,        unit: 'g'  },
    ...(n.sugar  != null ? [{ label: '糖',  value: n.sugar,  unit: 'g'  }] : []),
    ...(n.sodium != null ? [{ label: '钠',  value: n.sodium, unit: 'mg' }] : []),
  ];
  const { cardRef, dragHandlers } = useSwipeDown(onClose);

  return (
    <div
      className="fixed inset-x-0 bg-black/40 z-50 flex items-end"
      style={{ top: 'var(--vvt, 0px)', height: 'var(--vvh, 100vh)' }}
      onClick={onClose}
    >
      <div
        ref={cardRef}
        className="bg-white w-full max-w-lg mx-auto rounded-t-2xl modal-enter flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div
          className="flex justify-center pt-3 pb-1 cursor-grab"
          style={{ touchAction: 'none' }}
          {...dragHandlers}
        >
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        {/* Header */}
        <div className="px-5 pt-2 pb-4 border-b border-gray-100">
          <div className="font-semibold text-gray-900 text-base">{item.foodName}</div>
          <div className="text-sm text-gray-400 mt-0.5">{item.unit}</div>
        </div>
        {/* Calories */}
        <div className="flex items-baseline justify-center gap-1 py-5">
          <span className="text-4xl font-bold text-green-600">{item.calories}</span>
          <span className="text-sm text-gray-400">kcal</span>
        </div>
        {/* Macro grid */}
        <div className="px-5 grid grid-cols-2 gap-2 pb-2">
          {rows.map(r => (
            <div key={r.label} className="bg-gray-50 rounded-xl px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-gray-500">{r.label}</span>
              <span className="text-sm font-semibold text-gray-800">{formatNumber(r.value)}{r.unit}</span>
            </div>
          ))}
        </div>
        <BottomReturnButton onClick={onClose} />
      </div>
    </div>
  );
}

const DELETE_REVEAL = 80; // px — width of revealed delete button

interface SwipeableRowProps {
  item: MealItem;
  onRemove: (id: string) => void;
  onTap: (item: MealItem) => void;
}

function SwipeableRow({ item, onRemove, onTap }: SwipeableRowProps) {
  const rowRef   = useRef<HTMLDivElement>(null);
  const startX   = useRef(0);
  const curX     = useRef(0);   // current translateX; negative = swiped left
  const dragging = useRef(false);
  const [isOpen,     setIsOpen]     = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Direct DOM mutation bypasses React re-render for 60fps drag
  const applyX = (x: number, animate = false) => {
    if (!rowRef.current) return;
    rowRef.current.style.transition = animate ? 'transform 0.22s ease' : 'none';
    rowRef.current.style.transform  = `translateX(${x}px)`;
    curX.current = x;
  };

  const snapOpen  = () => { applyX(-DELETE_REVEAL, true); setIsOpen(true);  };
  const snapClose = () => { applyX(0, true);              setIsOpen(false); };

  const onTouchStart = (e: React.TouchEvent) => {
    dragging.current = true;
    startX.current   = e.touches[0].clientX - curX.current;
    if (rowRef.current) {
      rowRef.current.style.transition = 'none';
      rowRef.current.style.willChange = 'transform';
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    const x = Math.max(-DELETE_REVEAL, Math.min(0, e.touches[0].clientX - startX.current));
    applyX(x);
  };

  const onTouchEnd = () => {
    dragging.current = false;
    if (rowRef.current) rowRef.current.style.willChange = 'auto';
    curX.current < -DELETE_REVEAL / 2 ? snapOpen() : snapClose();
  };

  const handleDeleteClick = () => { snapClose(); setConfirming(true); };
  const handleConfirm = () => onRemove(item.id);
  const handleCancel  = () => setConfirming(false);
  const onRowClick    = () => { if (isOpen) { snapClose(); } else { onTap(item); } };

  const time = fmtTime(item.loggedAt);

  if (confirming) {
    return (
      <div className="flex items-center justify-between py-2.5 gap-3">
        <span className="text-sm text-gray-500 truncate flex-1">
          删除「<span className="font-medium text-gray-700">{item.foodName}</span>」？
        </span>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleCancel}
            className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 active:bg-gray-200 transition-colors"
          >取消</button>
          <button
            onClick={handleConfirm}
            className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white active:bg-red-600 transition-colors"
          >确认删除</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <button
        onClick={handleDeleteClick}
        className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center bg-red-500 text-white text-sm font-medium"
      >删除</button>

      <div
        ref={rowRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={onRowClick}
        className="flex items-center justify-between py-2.5 bg-white relative"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {time && <span className="text-xs text-gray-300 font-mono shrink-0">{time}</span>}
            <span className="text-sm font-medium text-gray-800 truncate">{item.foodName}</span>
            <GIBadge gi={item.gi} size="sm" />
          </div>
          <span className="text-xs text-gray-400">{item.unit}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-gray-600">{item.calories} kcal</span>
          {/* Reserve space so kcal doesn't shift when arrow hides */}
          <span className={`text-gray-200 text-xs select-none ${isOpen ? 'invisible' : ''}`}>←</span>
        </div>
      </div>
    </div>
  );
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
  const [showFamily, setShowFamily] = useState(false);
  const [showMenu,   setShowMenu]   = useState(false);
  const [detailItem, setDetailItem] = useState<MealItem | null>(null);
  const [familyId, setFamilyId] = useState<string | undefined>(profile.familyId);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quickEntry, setQuickEntry] = useState<RecentFoodEntry | null>(null);

  const anyModalOpen = showSearch || showPantry || showFamily || !!selectedFood;


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
  const openFamily = () => { lockBody(); setShowFamily(true); };
  const closeFamily = () => { setShowFamily(false); unlockBody(); };
  const handleFamilyChange = (fid: string | undefined) => { setFamilyId(fid); };
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
                className="text-green-500 flex items-center gap-1 hover:text-green-600 transition-colors"
                style={{ fontSize: '0.8rem' }}
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
            {/* 汉堡菜单 */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(v => !v)}
                className="w-8 h-8 flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="菜单"
              >
                <span className="block w-4.5 h-0.5 bg-current rounded-full" />
                <span className="block w-4.5 h-0.5 bg-current rounded-full" />
                <span className="block w-4.5 h-0.5 bg-current rounded-full" />
              </button>

              {showMenu && (
                <>
                  {/* 点击背景关闭 */}
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50">
                    <button
                      onClick={() => { setShowMenu(false); openFamily(); }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    >
                      <span>👨‍👩‍👧</span>
                      <span>家庭共享</span>
                    </button>
                    <div className="h-px bg-gray-100 mx-3" />
                    <button
                      onClick={() => { setShowMenu(false); onLogout(); }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors"
                    >
                      <span>🚪</span>
                      <span>登出</span>
                    </button>
                  </div>
                </>
              )}
            </div>
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
              {allItems.map(item => (
                <SwipeableRow
                  key={item.id}
                  item={item}
                  onRemove={onRemoveFood}
                  onTap={setDetailItem}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-20 safe-area-inset-bottom">
        <div className="max-w-lg mx-auto flex items-end h-16">
          {/* 今日 tab */}
          <button
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              if (currentDate !== today) {
                onDateChange(today);
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 pb-2 pt-1 text-green-600"
          >
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

      {/* 全局白色底层：模态框打开时铺满整个布局视口（含键盘下方、浏览器工具栏区域），
          防止 iOS Safari 半透明工具栏（frosted glass）透出主页彩色卡片 */}
      {anyModalOpen && (
        <div className="fixed inset-0 bg-white" style={{ zIndex: 38 }} />
      )}

      {/* Search Modal */}
      {showSearch && (
        <FoodSearch
          recentFoods={recentFoods}
          userId={profile.uid}
          familyId={familyId}
          onSelect={(food) => {
            // 同步批量更新：FoodSearch 和 AddFoodModal 在同一帧切换，
            // 避免 startTransition 导致的多步布局抖动
            setShowSearch(false);
            setQuickEntry(null);
            selectFood(food);
          }}
          onClose={closeSearch}
        />
      )}

      {/* Food Pantry */}
      {showPantry && (
        <FoodPantryPage
          onClose={closePantry}
          userId={profile.uid}
          familyId={familyId}
          onAddToLog={(food) => {
            selectFood(food);
            setQuickEntry(null);
            setShowPantry(false);
            // body 仍然锁住，AddFoodModal 继续保持锁
          }}
        />
      )}

      {/* Family Page */}
      {showFamily && (
        <FamilyPage
          userId={profile.uid}
          userName={profile.displayName}
          familyId={familyId}
          onFamilyChange={handleFamilyChange}
          onClose={closeFamily}
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

      {detailItem && (
        <NutritionDetailSheet item={detailItem} onClose={() => setDetailItem(null)} />
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
