import React, { useState, useRef } from 'react';
import type { UserProfile } from '../../types/user';
import type { DailyLog } from '../../types/log';
import type { FoodItem } from '../../types/food';
import type { RecentFoodEntry } from '../../utils/recentFoods';
import type { SyncStatus } from '../../hooks/useFoodLog';
import type { NutritionStatus } from '../../hooks/useNutrition';
import { PaperDock } from './shared/PaperDock';
import { DiaryHome } from './DiaryHome';
import { GardenHome } from './GardenHome';
import { GoalPrioritySheet } from './GoalPrioritySheet';
import type { GoalType } from '../../types/user';
import { SevenDayScreen } from './SevenDayScreen';
import { ScienceScreen } from './ScienceScreen';
import { DiversityScreen } from './DiversityScreen';
import { ProfileRedesign } from './ProfileRedesign';
import { FoodSearch } from '../food-log/FoodSearch';

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
  onAddFood: (food: FoodItem, grams: number, displayUnit?: string) => Promise<void>;
  onRemoveFood: (itemId: string) => Promise<void>;
  onUpdateFood: (itemId: string, grams: number, displayUnit: string, per100g: FoodItem['per100g']) => Promise<void>;
  onLogout: () => Promise<void>;
  onProfileUpdate: (updates: Partial<UserProfile>) => Promise<void>;
}

export function RedesignShell(props: RedesignShellProps) {
  const { profile, dailyLog, nutritionStatus, currentDate, recentFoods, onDateChange, onAddFood, onLogout, onProfileUpdate } = props;

  const [activeTab, setActiveTab] = useState<TabKey>('总览');
  const [subView, setSubView] = useState<SubView>('main');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [goalSheetOpen, setGoalSheetOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleNav = (tab: string) => {
    if (tab === 'pantry') {
      setSubView('pantry');
      return;
    }
    if (tab === 'diversity') {
      setSubView('diversity');
      return;
    }
    setSubView('main');
    setActiveTab(tab as TabKey);
  };

  const handleAdd = () => setSheetOpen(true);
  const handleCloseSheet = () => setSheetOpen(false);

  const handleSelectFood = async (food: FoodItem) => {
    // Use first available serving size or default to 100g
    const grams = food.servingSizes?.[0]?.grams ?? 100;
    const unit = food.servingSizes?.[0]?.label ?? `${grams}g`;
    await onAddFood(food, grams, unit);
    setSheetOpen(false);
  };

  // Determine home layout based on primary goal
  const primaryGoal = profile.goals?.[0] ?? profile.goal;
  const showGarden = primaryGoal === 'anti_inflammatory';

  const renderContent = () => {
    // Sub-views take precedence
    if (subView === 'diversity') {
      return <DiversityScreen onBack={() => setSubView('main')} />;
    }

    switch (activeTab) {
      case '总览':
        return showGarden ? (
          <GardenHome
            profile={profile}
            dailyLog={dailyLog}
            nutritionStatus={nutritionStatus}
            onOpenAdd={handleAdd}
            onNav={handleNav}
            onOpenGoalSheet={() => setGoalSheetOpen(true)}
          />
        ) : (
          <DiaryHome
            profile={profile}
            dailyLog={dailyLog}
            nutritionStatus={nutritionStatus}
            currentDate={currentDate}
            onDateChange={onDateChange}
            onNav={handleNav}
            onOpenAdd={handleAdd}
            onOpenGoalSheet={() => setGoalSheetOpen(true)}
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

      {/* Goal priority sheet */}
      {goalSheetOpen && (
        <GoalPrioritySheet
          profile={profile}
          onSave={async (goals: GoalType[]) => {
            await onProfileUpdate({ goals, goal: goals[0] });
          }}
          onClose={() => setGoalSheetOpen(false)}
        />
      )}

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
          >
            {/* Drag handle */}
            <div style={{
              display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4, flexShrink: 0,
            }}>
              <div style={{
                width: 36, height: 4, borderRadius: 999,
                background: 'var(--ink-faint)',
              }} />
            </div>

            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 20px 10px', flexShrink: 0,
              borderBottom: '1px solid var(--line-soft)',
            }}>
              <span className="nt-display" style={{ fontSize: 20, color: 'var(--ink)' }}>记一笔</span>
              <button
                onClick={handleCloseSheet}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--paper-2)', border: '1px solid var(--line-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: 'var(--ink-soft)', cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            {/* FoodSearch */}
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
              <FoodSearch
                recentFoods={recentFoods}
                userId={profile.uid}
                familyId={profile.familyId}
                onSelect={handleSelectFood}
                onClose={handleCloseSheet}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
