import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { UserProfile } from '../../types/user';
import { getActiveGoals } from '../../types/user';
import type { DailyLog, MealType, MealItem } from '../../types/log';
import { createEmptyDailyLog } from '../../types/log';
import type { FoodItem } from '../../types/food';
import type { BloodSugarReading } from '../../types/bloodSugar';
import { useSwipeDown } from '../../hooks/useSwipeDown';
import { useBloodSugar } from '../../hooks/useBloodSugar';
import { BloodSugarEntryModal } from '../bloodSugar/BloodSugarEntryModal';
import type { RecentFoodEntry } from '../../utils/recentFoods';
import type { SyncStatus } from '../../hooks/useFoodLog';
import type { NutritionStatus } from '../../hooks/useNutrition';
import { computeNutritionStatus } from '../../hooks/useNutrition';
import { getFontSize, ZOOM_MAP } from '../../utils/fontSize';
import { getTodayString, toLocalDateStr } from '../../utils/calculator';
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
  const [pendingQuick, setPendingQuick] = useState<{ grams: number; unit: string } | null>(null);
  const [editingLogItem, setEditingLogItem] = useState<MealItem | null>(null);

  // ── 血糖记录（仅控血糖目标启用）──
  const bsEnabled = getActiveGoals(profile).includes('blood_sugar');
  const bs = useBloodSugar(profile.uid, currentDate, bsEnabled);
  const [bsModal, setBsModal] = useState<{ open: boolean; editing: BloodSugarReading | null }>({ open: false, editing: null });

  const scrollRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const [fontZoom, setFontZoom] = useState(() => ZOOM_MAP[getFontSize()]);

  // ── Date-swipe animation ──────────────────────────────────────────────
  const today = getTodayString();
  const shiftDate = useCallback((d: string, delta: number) => {
    const date = new Date(d + 'T00:00:00');
    date.setDate(date.getDate() + delta);
    return toLocalDateStr(date);
  }, []);

  const prevDate = useMemo(() => shiftDate(currentDate, -1), [currentDate, shiftDate]);
  const nextDate = useMemo(() => shiftDate(currentDate, 1),  [currentDate, shiftDate]);

  const [dragX, setDragX] = useState(0);
  const [snapTransition, setSnapTransition] = useState(false);
  const dragXRef      = useRef(0);
  const snapping      = useRef(false);
  const horizDrag     = useRef(false);
  const touchSX       = useRef(0);
  const touchSY       = useRef(0);

  // Back-swipe animation (sub-view → main)
  const [backX, setBackX]        = useState(0);
  const [backTrans, setBackTrans] = useState(false);
  const backXRef  = useRef(0);

  // Refs so imperative handlers always read current values
  const activeTabRef   = useRef(activeTab);
  const subViewRef     = useRef(subView);
  const currentDateRef = useRef(currentDate);
  useEffect(() => { activeTabRef.current = activeTab; },    [activeTab]);
  useEffect(() => {
    subViewRef.current = subView;
    // Reset back-swipe offset whenever subView changes
    backXRef.current = 0; setBackX(0); setBackTrans(false);
  }, [subView]);
  useEffect(() => { currentDateRef.current = currentDate; },[currentDate]);

  // Adjacent-day + current-day logs — synchronous, always a valid DailyLog (empty fallback)
  const adjLogs = useMemo(() => {
    const empty = (date: string) => createEmptyDailyLog(profile.uid, date);
    const read = (date: string): DailyLog => {
      try {
        const cached = JSON.parse(localStorage.getItem(`nutri_log_${profile.uid}_${date}`) || 'null');
        // Validate: must have 4 meal slots; fall back if malformed
        if (cached && Array.isArray(cached.meals) && cached.meals.length === 4) return cached;
        return empty(date);
      } catch { return empty(date); }
    };
    return { prev: read(prevDate), current: read(currentDate), next: read(nextDate) };
  // dailyLog dependency: re-reads localStorage after Firestore saves fresh data
  }, [prevDate, currentDate, nextDate, profile.uid, dailyLog]);

  const prevNS    = useMemo(() => computeNutritionStatus(profile, adjLogs.prev),    [profile, adjLogs.prev]);
  const currentNS = useMemo(() => computeNutritionStatus(profile, adjLogs.current), [profile, adjLogs.current]);
  const nextNS    = useMemo(() => computeNutritionStatus(profile, adjLogs.next),    [profile, adjLogs.next]);

  const doSnap = useCallback((dir: 'next' | 'prev') => {
    const W = window.innerWidth;
    const target = dir === 'next' ? -W : W;
    snapping.current = true;
    dragXRef.current = target;
    setSnapTransition(true);
    setDragX(target);
    setTimeout(() => {
      const newDate = dir === 'next'
        ? shiftDate(currentDateRef.current, 1)
        : shiftDate(currentDateRef.current, -1);
      // React 18 batches all state updates in setTimeout → single render, no flash
      setSnapTransition(false);
      dragXRef.current = 0;
      setDragX(0);
      onDateChange(newDate);
      snapping.current = false;
    }, 280);
  }, [onDateChange, shiftDate]);

  // Imperative touch listeners (non-passive touchmove to allow preventDefault)
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const onStart = (e: TouchEvent) => {
      touchSX.current = e.touches[0].clientX;
      touchSY.current = e.touches[0].clientY;
      horizDrag.current = false;
    };
    const onMove = (e: TouchEvent) => {
      if (snapping.current) return;
      const dx = e.touches[0].clientX - touchSX.current;
      const dy = e.touches[0].clientY - touchSY.current;

      // ── Date swipe (总览/main only) ──
      if (subViewRef.current !== 'main' || activeTabRef.current !== '总览') return;
      if (!horizDrag.current) {
        const absDx = Math.abs(dx), absDy = Math.abs(dy);
        if (absDx < 2 && absDy < 2) return; // too small to decide
        if (absDx >= absDy) {
          // Clearly horizontal — claim immediately before iOS locks vertical scroll
          horizDrag.current = true;
          e.preventDefault();
        } else {
          // Clearly vertical — let browser scroll, ignore this gesture
          return;
        }
      }
      if (horizDrag.current) {
        e.preventDefault();
        const clamped = (dx < 0 && currentDateRef.current >= today) ? dx / 4 : dx;
        dragXRef.current = clamped;
        setDragX(clamped);
      }
    };
    const onEnd = () => {
      if (!horizDrag.current) return;
      horizDrag.current = false;
      const W = window.innerWidth;
      if (dragXRef.current < -W * 0.3 && currentDateRef.current < today) {
        doSnap('next');
      } else if (dragXRef.current > W * 0.3) {
        doSnap('prev');
      } else {
        setSnapTransition(true);
        dragXRef.current = 0;
        setDragX(0);
        setTimeout(() => setSnapTransition(false), 300);
      }
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove',  onMove,  { passive: false });
    el.addEventListener('touchend',   onEnd,   { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove',  onMove);
      el.removeEventListener('touchend',   onEnd);
    };
  }, [doSnap, today]);

  const handleBackComplete = useCallback(() => setSubView('main'), []);

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
    if (tab === '总览') onDateChange(getTodayString());
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

  const handleSelectFood = async (food: FoodItem, quickGrams?: number, quickUnit?: string) => {
    setSheet(s => ({ ...s, open: false }));
    setPendingFood(food);
    setPendingQuick(quickGrams ? { grams: quickGrams, unit: quickUnit ?? '' } : null);
  };

  const handleConfirmFood = async (food: FoodItem, grams: number, displayUnit: string) => {
    await onAddFood(food, grams, displayUnit, mealTypeRef.current);
    setPendingFood(null);
    setPendingQuick(null);
  };

  // 血糖卡 props（仅传给 current/editable 页的 DiaryHome）
  const bloodSugarProps = bsEnabled ? {
    readings: bs.readings,
    trend: bs.trend,
    onAdd: () => setBsModal({ open: true, editing: null }),
    onEdit: (r: BloodSugarReading) => setBsModal({ open: true, editing: r }),
    onDelete: bs.deleteReading,
  } : undefined;

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
    if (subView === 'pantry') {
      return (
        <FoodPantryPage
          onClose={() => setSubView('main')}
          userId={profile.uid}
          familyId={profile.familyId}
          onAddToLog={(food) => {
            setSubView('main');
            setPendingFood(food);
          }}
        />
      );
    }

    switch (activeTab) {
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
      {/* Navigation container — handles all touch gestures */}
      <div ref={navRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 1 }}>

        {/* ── 3-page date strip (总览/main) ── */}
        {(activeTab === '总览' && subView === 'main') || (activeTab === '总览' && subView !== 'main') ? (
          <>
            {/* 3-page strip — always rendered when on 总览 so back-swipe reveals it */}
            <div style={{
              position: 'absolute', inset: 0, overflow: 'hidden',
              // Parallax behind sub-view: slides left a bit as sub-view slides right
              transform: subView !== 'main'
                ? `translateX(${(backX / Math.max(1, window.innerWidth) - 1) * 22}%)`
                : undefined,
              opacity: subView !== 'main' ? 0.55 + (backX / Math.max(1, window.innerWidth)) * 0.45 : 1,
              pointerEvents: subView !== 'main' ? 'none' : undefined,
              transition: backTrans ? 'transform 0.28s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.28s' : 'none',
            }}>
              <div style={{
                display: 'flex',
                width: '300%',
                height: '100%',
                transform: `translateX(calc(-33.333% + ${dragX}px))`,
                transition: snapTransition ? 'transform 0.28s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none',
                willChange: 'transform',
              }}>
                {([
                  { date: prevDate,    log: adjLogs.prev,              ns: prevNS,                        editable: false },
                  // Use live data only when it belongs to currentDate; otherwise fall back to localStorage
                  { date: currentDate, log: (dailyLog?.date === currentDate ? dailyLog : null) ?? adjLogs.current, ns: (dailyLog?.date === currentDate ? nutritionStatus : null) ?? currentNS, editable: true  },
                  { date: nextDate,    log: adjLogs.next,              ns: nextNS,                        editable: false },
                ] as const).map(({ date, log, ns, editable }) => (
                  <div
                    key={date}
                    className="nt-scroll-hide"
                    style={{
                      width: '33.333%', flexShrink: 0, height: '100%', overflowY: 'auto',
                      paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)',
                      paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 110px)',
                      touchAction: 'pan-y',
                    }}
                  >
                    <div style={{ zoom: fontZoom, WebkitTextSizeAdjust: 'auto' }}>
                      <DiaryHome
                        profile={profile}
                        dailyLog={log}
                        nutritionStatus={ns}
                        currentDate={date}
                        onDateChange={onDateChange}
                        onNav={handleNav}
                        onOpenAdd={editable ? handleAdd : () => {}}
                        onRemoveFood={editable ? props.onRemoveFood : undefined}
                        onEditFood={editable ? handleEditLogItem : undefined}
                        bloodSugar={editable ? bloodSugarProps : undefined}
                        syncStatus={editable ? syncStatus : undefined}
                        syncError={editable ? props.syncError : null}
                        onForceSync={editable ? onForceSync : undefined}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sub-view layer (diversity / macros) — slides right on back-swipe */}
            {subView !== 'main' && (
              <>
                <div
                  ref={scrollRef}
                  className="nt-scroll-hide"
                  style={{
                    position: 'absolute', inset: 0, overflowY: 'auto',
                    background: 'var(--paper)',
                    paddingTop: subView === 'pantry' ? 0 : 'calc(env(safe-area-inset-top, 0px) + 8px)',
                    paddingBottom: subView === 'pantry' ? 0 : 'calc(env(safe-area-inset-bottom, 0px) + 110px)',
                    transform: `translateX(${backX}px)`,
                    transition: backTrans ? 'transform 0.28s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none',
                    willChange: 'transform',
                    zIndex: 2,
                    boxShadow: backX > 0 ? '-4px 0 20px rgba(31,41,32,0.12)' : 'none',
                  }}
                >
                  <div style={{ zoom: fontZoom, WebkitTextSizeAdjust: 'auto' }}>
                    {renderContent()}
                  </div>
                </div>

                {/* Edge strip: separate component so useEffect(fn,[]) binds ONCE on mount.
                    topOffset skips the header row (back button at x=22-54px, top ~60px) */}
                <BackSwipeEdge
                  backXRef={backXRef}
                  setBackX={setBackX}
                  setBackTrans={setBackTrans}
                  onComplete={handleBackComplete}
                  topOffset={68}
                />
              </>
            )}
          </>
        ) : (
          /* Other tabs (趋势, 科学, 我) — single scroll, no animation */
          <div
            ref={scrollRef}
            className="nt-scroll-hide"
            style={{
              position: 'absolute', inset: 0, overflowY: 'auto',
              paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 110px)',
            }}
          >
            <div style={{ zoom: fontZoom, WebkitTextSizeAdjust: 'auto' }}>
              {renderContent()}
            </div>
          </div>
        )}
      </div>

      {/* Fixed top overlay: greeting row + buttons (总览/main only, never moves during date swipe) */}
      {activeTab === '总览' && subView === 'main' && (() => {
        const name = profile.displayName?.split(' ')[0] || '朋友';
        const h = new Date().getHours();
        const greeting = h < 6 ? '夜深了' : h < 11 ? '早安' : h < 14 ? '午安' : h < 18 ? '下午好' : '晚上好';
        const goals = profile.goals ?? [profile.goal];
        const goalMap: Record<string, { emoji: string; label: string; color: string; bg: string; border: string }> = {
          fat_loss:          { emoji: '🔥', label: '减脂',  color: 'var(--tomato)', bg: 'rgba(255,107,87,0.1)', border: 'rgba(255,107,87,0.25)' },
          anti_inflammatory: { emoji: '🫒', label: '抗炎',  color: 'var(--moss)',   bg: 'rgba(45,110,64,0.1)', border: 'rgba(45,110,64,0.25)' },
          muscle_gain:       { emoji: '💪', label: '增肌',  color: 'var(--mustard)',bg: 'rgba(244,181,54,0.1)', border: 'rgba(244,181,54,0.25)' },
          blood_sugar:       { emoji: '🩸', label: '控血糖', color: 'var(--plum)',   bg: 'rgba(212,93,127,0.1)', border: 'rgba(212,93,127,0.25)' },
        };
        return (
          <div style={{
            position: 'absolute',
            top: 'calc(env(safe-area-inset-top, 0px) + 8px)',
            left: 0, right: 0,
            padding: '6px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            zIndex: 10,
            pointerEvents: 'none', // let touches pass through to swipe handler
          }}>
            {/* Left: greeting */}
            <span className="nt-caveat" style={{ fontSize: 16, color: 'var(--ink)', pointerEvents: 'none' }}>
              {greeting}, <span style={{ color: 'var(--ink-mute)' }}>{name}</span>
            </span>
            {/* Right: goal chips + sync + pantry */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, pointerEvents: 'auto' }}>
              {goals.slice(0, 2).filter(g => goalMap[g]).map(g => {
                const info = goalMap[g];
                return (
                  <span key={g} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    padding: '3px 8px', borderRadius: 999,
                    background: info.bg, border: `1px solid ${info.border}`,
                    fontSize: 11, color: info.color, fontWeight: 600,
                  }}>{info.emoji} {info.label}</span>
                );
              })}
              <button
                onClick={onForceSync}
                disabled={syncStatus === 'syncing'}
                style={{
                  display: 'inline-flex', alignItems: 'center',
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.6)', border: '1px solid var(--line-soft)',
                  justifyContent: 'center',
                  fontSize: 14, cursor: syncStatus === 'syncing' ? 'default' : 'pointer',
                  color: syncStatus === 'error' ? 'var(--tomato)' : 'var(--ink-soft)',
                }}
              >
                <span style={{ display: 'inline-block', animation: syncStatus === 'syncing' ? 'spin 1s linear infinite' : 'none' }}>⟳</span>
              </button>
              <button
                onClick={() => handleNav('pantry')}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.6)', border: '1px solid var(--line-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: 'var(--ink-soft)', cursor: 'pointer',
                }}
              >📦</button>
            </div>
          </div>
        );
      })()}

      {/* Bottom dock */}
      <PaperDock
        active={activeTab}
        onAdd={handleAdd}
        onNav={(tab) => { setSubView('main'); setActiveTab(tab as TabKey); if (tab === '总览') onDateChange(getTodayString()); }}
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

            {/* Header — 记一笔 + 餐次 + 关闭，全在一行 */}
            <div style={{ padding: '6px 16px 10px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="nt-display" style={{ fontSize: 20, color: 'var(--ink)', flexShrink: 0 }}>记一笔</span>
              <div style={{ display: 'flex', gap: 5, flex: 1 }}>
                {(['breakfast','lunch','dinner','snack'] as MealType[]).map((key, _, arr) => {
                  const labels: Record<MealType, string> = { breakfast:'早餐', lunch:'午餐', dinner:'晚餐', snack:'加餐' };
                  const active = sheet.meal === key;
                  return (
                    <button
                      key={key}
                      onClick={() => { mealTypeRef.current = key; setSheet(s => ({ ...s, meal: key })); }}
                      style={{
                        flex: 1, padding: '5px 2px', borderRadius: 999,
                        background: active ? '#1F2920' : 'transparent',
                        color: active ? '#F6F9F2' : '#8B9886',
                        border: active ? 'none' : '1px solid #d0d8c8',
                        fontSize: 12, fontWeight: active ? 700 : 400,
                        cursor: 'pointer', fontFamily: 'Noto Serif SC, serif',
                        transition: 'background .15s', whiteSpace: 'nowrap',
                      }}
                    >{labels[key]}</button>
                  );
                })}
              </div>
              <button
                onClick={handleCloseSheet}
                style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--paper-2)', border: '1px solid var(--line-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, color: 'var(--ink-soft)', cursor: 'pointer',
                }}
              >✕</button>
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
          quickGrams={pendingQuick?.grams}
          quickUnit={pendingQuick?.unit}
          onConfirm={handleConfirmFood}
          onBack={() => { setPendingFood(null); setPendingQuick(null); setSheet(s => ({ ...s, open: true })); }}
          onClose={() => { setPendingFood(null); setPendingQuick(null); }}
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

      {/* 血糖录入弹窗 */}
      {bsModal.open && (
        <BloodSugarEntryModal
          editing={bsModal.editing}
          onSave={async (input) => {
            if (bsModal.editing) {
              await bs.updateReading(bsModal.editing.id, input);
            } else {
              await bs.addReading(input);
            }
          }}
          onClose={() => setBsModal({ open: false, editing: null })}
        />
      )}

      {/* Food Pantry is now rendered inside the sub-view layer (with back-swipe animation) */}
    </div>
  );
}

// ── BackSwipeEdge ─────────────────────────────────────────────────────────
// A 24px-wide transparent overlay on the left edge of sub-views.
// Lives in its own component so useEffect(fn,[]) binds listeners EXACTLY ONCE
// on mount and removes them on unmount — no listener churn during re-renders.
interface BackSwipeEdgeProps {
  backXRef: React.MutableRefObject<number>;
  setBackX: (x: number) => void;
  setBackTrans: (v: boolean) => void;
  onComplete: () => void;
  topOffset?: number;
}
function BackSwipeEdge({ backXRef, setBackX, setBackTrans, onComplete, topOffset = 0 }: BackSwipeEdgeProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const W = () => window.innerWidth;
    const start = { x: 0, y: 0 };
    let active = false;

    const onStart = (e: TouchEvent) => {
      start.x = e.touches[0].clientX;
      start.y = e.touches[0].clientY;
      active = false;
    };
    const onMove = (e: TouchEvent) => {
      e.preventDefault(); // block native scroll — this is the key benefit of a separate element
      const dx = e.touches[0].clientX - start.x;
      const dy = e.touches[0].clientY - start.y;
      if (!active) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        active = dx > 0 && Math.abs(dx) > Math.abs(dy) * 0.7;
      }
      if (active && dx > 0) { backXRef.current = dx; setBackX(dx); }
    };
    const onEnd = () => {
      if (!active) return;
      active = false;
      if (backXRef.current > W() * 0.28) {
        setBackTrans(true);
        backXRef.current = W(); setBackX(W());
        setTimeout(() => { setBackTrans(false); backXRef.current = 0; setBackX(0); onComplete(); }, 280);
      } else {
        setBackTrans(true);
        backXRef.current = 0; setBackX(0);
        setTimeout(() => setBackTrans(false), 300);
      }
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove',  onMove,  { passive: false });
    el.addEventListener('touchend',   onEnd,   { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove',  onMove);
      el.removeEventListener('touchend',   onEnd);
    };
  }, []); // empty deps: runs once on mount, cleans up on unmount

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute', left: 0, top: topOffset, bottom: 0,
        width: 50, zIndex: 10,
        touchAction: 'none',
      }}
    />
  );
}
