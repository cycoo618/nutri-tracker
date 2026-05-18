import React, { useState, useRef, useCallback } from 'react';
import type { UserProfile } from '../../types/user';
import type { DailyLog, MealType } from '../../types/log';
import type { FoodItem } from '../../types/food';
import { useSwipeDown } from '../../hooks/useSwipeDown';
import type { RecentFoodEntry } from '../../utils/recentFoods';
import type { SyncStatus } from '../../hooks/useFoodLog';
import type { NutritionStatus } from '../../hooks/useNutrition';
import { PaperDock } from './shared/PaperDock';
import { DiaryHome } from './DiaryHome';
import { SevenDayScreen } from './SevenDayScreen';
import { ScienceScreen } from './ScienceScreen';
import { DiversityScreen } from './DiversityScreen';
import { ProfileRedesign } from './ProfileRedesign';
import { FoodSearch } from '../food-log/FoodSearch';
import { AddFoodModal } from '../food-log/AddFoodModal';

type TabKey = '总览' | '趋势' | '科学' | '我';
type SubView = 'main' | 'diversity' | 'pantry';

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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [pendingFood, setPendingFood] = useState<FoodItem | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleNav = (tab: string) => {
    if (tab === 'pantry') { setSubView('pantry'); return; }
    if (tab === 'diversity') { setSubView('diversity'); return; }
    setSubView('main');
    setActiveTab(tab as TabKey);
  };

  // 从 DiaryHome 某一餐的 + 点进来时带餐次；底部 dock + 按钮则按时间自动判断
  const handleAdd = useCallback((targetMeal?: string) => {
    if (targetMeal) {
      setMealType(targetMeal as MealType);
    } else {
      const h = new Date().getHours();
      setMealType(h < 10 ? 'breakfast' : h < 14 ? 'lunch' : h < 19 ? 'dinner' : 'snack');
    }
    setSheetOpen(true);
  }, []);

  const handleCloseSheet = useCallback(() => setSheetOpen(false), []);

  // 下滑关闭手势
  const { cardRef: sheetRef, dragHandlers: sheetDragHandlers, cardDragHandlers: sheetCardDragHandlers } = useSwipeDown(handleCloseSheet);

  const handleSelectFood = async (food: FoodItem) => {
    // 关闭搜索 sheet，打开 AddFoodModal 让用户确认份量
    setSheetOpen(false);
    setPendingFood(food);
  };

  const handleConfirmFood = async (food: FoodItem, grams: number, displayUnit: string) => {
    await onAddFood(food, grams, displayUnit, mealType);
    setPendingFood(null);
  };

  const renderContent = () => {
    // Sub-views take precedence
    if (subView === 'diversity') {
      return <DiversityScreen onBack={() => setSubView('main')} />;
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
            syncStatus={syncStatus}
            onForceSync={onForceSync}
          />
        );
      case '趋势':
        return <SevenDayScreen />;
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
          paddingTop: 54,
          paddingBottom: 110,
          zIndex: 1,
        }}
      >
        {renderContent()}
      </div>

      {/* Bottom dock */}
      <PaperDock
        active={activeTab}
        onAdd={handleAdd}
        onNav={(tab) => { setSubView('main'); setActiveTab(tab); }}
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
              <div style={{ display: 'flex', gap: 6, marginTop: 12, marginBottom: 12 }}>
                {([
                  { key: 'breakfast', label: '早餐' },
                  { key: 'lunch',     label: '午餐' },
                  { key: 'dinner',    label: '晚餐' },
                  { key: 'snack',     label: '加餐' },
                ] as const).map(m => (
                  <button
                    key={m.key}
                    onClick={() => setMealType(m.key)}
                    style={{
                      padding: '6px 16px', borderRadius: 999,
                      background: mealType === m.key ? 'var(--ink)' : 'var(--card)',
                      color: mealType === m.key ? 'var(--paper)' : 'var(--ink-mute)',
                      border: mealType === m.key ? 'none' : '1px solid var(--line-soft)',
                      fontSize: 13, fontWeight: mealType === m.key ? 700 : 400,
                      cursor: 'pointer', fontFamily: 'Noto Serif SC, serif',
                      transition: 'background .15s',
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
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
          onBack={() => { setPendingFood(null); setSheetOpen(true); }}
          onClose={() => setPendingFood(null)}
        />
      )}
    </div>
  );
}
