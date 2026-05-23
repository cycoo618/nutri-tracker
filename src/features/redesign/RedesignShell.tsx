import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { UserProfile } from '../../types/user';
import type { DailyLog, MealType, MealItem } from '../../types/log';
import type { FoodItem } from '../../types/food';
import { useSwipeDown } from '../../hooks/useSwipeDown';
import type { RecentFoodEntry } from '../../utils/recentFoods';
import type { SyncStatus } from '../../hooks/useFoodLog';
import type { NutritionStatus } from '../../hooks/useNutrition';
import { getFontSize, ZOOM_MAP } from '../../utils/fontSize';
import type { FontSize } from '../../utils/fontSize';
import { PaperDock } from './shared/PaperDock';
import { DiaryHome } from './DiaryHome';
import { SevenDayScreen } from './SevenDayScreen';
import { ScienceScreen } from './ScienceScreen';
import { DiversityScreen } from './DiversityScreen';
import { MacrosScreen } from './MacrosScreen';
import { ProfileRedesign } from './ProfileRedesign';
import { FoodSearch } from '../food-log/FoodSearch';
import { AddFoodModal } from '../food-log/AddFoodModal';
import { FoodPantryPage } from '../pantry/FoodPantryPage';

type TabKey = '总览' | '趋势' | '科学' | '我';
type SubView = 'main' | 'diversity' | 'macros' | 'pantry';

export interface RedesignShellProps {
  profile: UserProfile;
  dailyLog: DailyLog | null;
  nutritionStatus: NutritionStatus | null;
  currentDate: string;
  recentFoods: RecentFoodEntry[];
  syncStatus: SyncStatus;
  syncError: string | null;
  onForceSync: () => Promise<void>;
  onDateChange: (date: string) => void;
  onAddFood: (food: FoodItem, grams: number, displayUnit?: string, mealType?: MealType) => Promise<void>;
  onRemoveFood: (itemId: string) => Promise<void>;
  onUpdateFood: (itemId: string, grams: number, displayUnit: string, per100g: FoodItem['per100g']) => Promise<void>;
  onLogout: () => Promise<void>;
  onProfileUpdate: (updates: Partial<UserProfile>) => Promise<void>;
}

export function RedesignShell(props: RedesignShellProps) {
  const { profile, dailyLog, nutritionStatus, currentDate, recentFoods, syncStatus, onForceSync, onDateChange, onAddFood, onLogout, onProfileUpdate } = props;

  const [activeTab, setActiveTab] = useState<TabKey>('总览');
  const [subView, setSubView] = useState<SubView>('main');
  const [sheet, setSheet] = useState<{ open: boolean; meal: MealType }>({ open: false, meal: 'breakfast' });
  const mealTypeRef = useRef<MealType>('breakfast');
  const [pendingFood, setPendingFood] = useState<FoodItem | null>(null);
  const [editingLogItem, setEditingLogItem] = useState<MealItem | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [fontZoom, setFontZoom] = useState(() => ZOOM_MAP[getFontSize()]);

  useEffect(() => {
    if (localStorage.getItem('nutri_dark') === '1') document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      setFontZoom(ZOOM_MAP[(e as CustomEvent<FontSize>).detail] ?? 1);
    };
    window.addEventListener('fontsize-change', handler);
    return () => window.removeEventListener('fontsize-change', handler);
  }, []);

  // 便捷读取
  const sheetOpen = sheet.open;
  const mealType = sheet.meal;

  const handleNav = (tab: string) => {
    if (tab === 'pantry') { setSubView('pantry'); return; }
    if (tab === 'diversity') { setSubView('diversity'); return; }
    if (tab === 'macros') { setSubView('macros'); return; }
    setSubView('main');
    setActiveTab(tab as TabKey);
    // 点总览时回到今日
    if (tab === '总览') onDateChange(new Date().toISOString().slice(0, 10));
  };

  const handleEditLogItem = useCallback((item: MealItem) => {
    setEditingLogItem(item);
  }, []);

  const handleUpdateLogItem = async (food: FoodItem, grams: number, displayUnit: string) => {
    if (!editingLogItem) return;
    await props.onUpdateFood(editingLogItem.id, grams, displayUnit, food.per100g);
    setEditingLogItem(null);
  };

  // 从 DiaryHome 某一餐的 + 点进来时带餐次；底部 dock + 按钮则按时间自动判断
  const handleAdd = useCallback((targetMeal?: string) => {
    const resolved: MealType = targetMeal
      ? (targetMeal as MealType)
      : (() => {
          const h = new Date().getHours();
          return h < 10 ? 'breakfast' : h < 14 ? 'lunch' : h < 19 ? 'dinner' : 'snack';
        })();
    mealTypeRef.current = resolved;
    // 单次 setState，open 和 meal 原子更新，sheet 挂载时一定读到正确的 meal
    setSheet({ open: true, meal: resolved });
  }, []);

  const handleCloseSheet = useCallback(() => setSheet(s => ({ ...s, open: false })), []);

  // 下滑关闭手势
  const { cardRef: sheetRef, dragHandlers: sheetDragHandlers, cardDragHandlers: sheetCardDragHandlers } = useSwipeDown(handleCloseSheet);

  const handleSelectFood = async (food: FoodItem) => {
    // 关闭搜索 sheet，打开 AddFoodModal 让用户确认份量
    setSheet(s => ({ ...s, open: false }));
    setPendingFood(food);
  };

  const handleConfirmFood = async (food: FoodItem, grams: number, displayUnit: string) => {
    await onAddFood(food, grams, displayUnit, mealTypeRef.current);
    setPendingFood(null);
  };

  const renderContent = () => {
    // Sub-views take precedence
    if (subView === 'diversity') {
      return <DiversityScreen onBack={() => setSubView('main')} dailyLog={dailyLog} />;
    }
    if (subView === 'macros') {
      return (
        <MacrosScreen
          nutritionStatus={nutritionStatus}
          dailyLog={dailyLog}
          currentDate={currentDate}
          onBack={() => setSubView('main')}
          onOpenAdd={handleAdd}
          onNav={handleNav}
        />
      );
    }

    switch (activeTab) {
      case '总览':
        return (
          <DiaryHome
            profile={profile}
            dailyLog={dailyLog}
            nutritionStatus={nutritionStatus}
            currentDate={currentDate}
            onDateChange={onDateChange}
            onNav={handleNav}
            onOpenAdd={handleAdd}
            onRemoveFood={props.onRemoveFood}
            onEditFood={handleEditLogItem}
            syncStatus={syncStatus}
            syncError={props.syncError}
            onForceSync={onForceSync}
          />
        );
      case '趋势':
        return <SevenDayScreen profile={profile} targetCalories={profile.targetCalories} />;
      case '科学':
        return <ScienceScreen />;
      case '我':
        return (
          <ProfileRedesign
            profile={profile}
            onProfileUpdate={onProfileUpdate}
            onLogout={onLogout}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="nt-paper nt-grain"
      style={{
        position: 'fixed',
        top: 'var(--vvt, 0px)',
        height: 'var(--vvh, 100vh)',
        left: 0,
        right: 0,
        overflow: 'hidden',
      }}
    >
      {/* Scroll area */}
      <div
        ref={scrollRef}
        className="nt-scroll-hide"
        style={{
          position: 'absolute',
          inset: 0,
          overflowY: 'auto',
          paddingTop: 8,
          paddingBottom: 110,
          zIndex: 1,
        }}
      >
        {/* font-size zoom wrapper — scales all inline px values proportionally.
            WebkitTextSizeAdjust:'auto' overrides Tailwind's 100% on html,
            allowing font sizes to scale with zoom on iOS Safari. */}
        <div style={{ zoom: fontZoom, WebkitTextSizeAdjust: 'auto' }}>
          {renderContent()}
        </div>
      </div>

      {/* Bottom dock */}
      <PaperDock
        active={activeTab}
        onAdd={handleAdd}
        onNav={(tab) => { setSubView('main'); setActiveTab(tab as TabKey); if (tab === '总览') onDateChange(new Date().toISOString().slice(0, 10)); }}
      />

      {/* Add food sheet */}
      {sheetOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={handleCloseSheet}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(31,41,32,0.35)',
              backdropFilter: 'blur(2px)',
              zIndex: 100,
            }}
          />
          {/* Sheet */}
          <div
            ref={sheetRef}
            className="nt-sheet-in"
            style={{
              position: 'absolute',
              bottom: 0, left: 0, right: 0,
              height: '85%',
              background: 'var(--paper)',
              borderRadius: '22px 22px 0 0',
              border: '1px solid var(--line-soft)',
              boxShadow: '0 -8px 40px rgba(31,41,32,0.12)',
              zIndex: 101,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            {...sheetCardDragHandlers}
          >
            {/* Drag handle — swipe here always closes */}
            <div
              style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4, flexShrink: 0, cursor: 'grab', touchAction: 'none' }}
              {...sheetDragHandlers}
            >
              <div style={{
                width: 36, height: 4, borderRadius: 999,
                background: 'var(--ink-faint)',
              }} />
            </div>

            {/* Header */}
            <div style={{ padding: '6px 20px 0', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <span className="nt-display" style={{ fontSize: 22, color: 'var(--ink)' }}>记一笔</span>
                  <span className="nt-caveat" style={{ fontSize: 14, color: 'var(--ink-mute)', marginLeft: 8 }}>jot it down</span>
                </div>
                <button
                  onClick={handleCloseSheet}
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--paper-2)', border: '1px solid var(--line-soft)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, color: 'var(--ink-soft)', cursor: 'pointer', marginTop: 2,
                  }}
                >✕</button>
              </div>
              {/* Meal tabs */}
              {(() => {
                const MEALS = [
                  { key: 'breakfast' as MealType, label: '早餐' },
                  { key: 'lunch'     as MealType, label: '午餐' },
                  { key: 'dinner'    as MealType, label: '晚餐' },
                  { key: 'snack'     as MealType, label: '加餐' },
                ];
                const sel = sheet.meal;
                return (
                  <div style={{ display: 'flex', gap: 6, marginTop: 12, marginBottom: 12 }}>
                    {MEALS.map(m => {
                      const active = sel === m.key;
                      return (
                        <button
                          key={m.key}
                          onClick={() => { mealTypeRef.current = m.key; setSheet(s => ({ ...s, meal: m.key })); }}
                          style={{
                            padding: '6px 16px', borderRadius: 999,
                            background: active ? '#1F2920' : '#ffffff',
                            color: active ? '#F6F9F2' : '#8B9886',
                            border: active ? 'none' : '1px solid #d0d8c8',
                            fontSize: 13, fontWeight: active ? 700 : 400,
                            cursor: 'pointer', fontFamily: 'Noto Serif SC, serif',
                            transition: 'background .15s',
                          }}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
            <div style={{ borderBottom: '1px solid var(--line-soft)', marginBottom: 0 }} />

            {/* FoodSearch */}
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
              <FoodSearch
                recentFoods={recentFoods}
                userId={profile.uid}
                familyId={profile.familyId}
                onSelect={handleSelectFood}
                onClose={handleCloseSheet}
                embedded={true}
              />
            </div>
          </div>
        </>
      )}

      {/* AddFoodModal — 确认份量后才真正写入 */}
      {pendingFood && (
        <AddFoodModal
          food={pendingFood}
          onConfirm={handleConfirmFood}
          onBack={() => { setPendingFood(null); setSheet(s => ({ ...s, open: true })); }}
          onClose={() => setPendingFood(null)}
        />
      )}

      {/* EditFoodModal — 修改已记录食物的份量 */}
      {editingLogItem && (() => {
        const food: FoodItem = {
          id: editingLogItem.foodId || editingLogItem.id,
          name: editingLogItem.foodName,
          category: 'other',
          source: 'builtin',
          per100g: editingLogItem.nutrition as FoodItem['per100g'],
          servingSizes: [{ label: editingLogItem.unit || '份', grams: editingLogItem.amount }],
        };
        return (
          <AddFoodModal
            food={food}
            quickGrams={editingLogItem.amount}
            quickUnit={editingLogItem.unit}
            onConfirm={handleUpdateLogItem}
            onBack={() => setEditingLogItem(null)}
            onClose={() => setEditingLogItem(null)}
          />
        );
      })()}

      {/* Food Pantry — full-screen overlay */}
      {subView === 'pantry' && (
        <FoodPantryPage
          onClose={() => setSubView('main')}
          userId={profile.uid}
          familyId={profile.familyId}
          onAddToLog={(food) => {
            setSubView('main');
            setPendingFood(food);
          }}
        />
      )}
    </div>
  );
}
