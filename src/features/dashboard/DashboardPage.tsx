// ============================================
// 主看板页面 — 今日饮食总览
// 饮食记录以时间线形式展示，不再分早中晚餐
// ============================================

import { useState, useRef, useEffect } from 'react';
import { useSwipeDown } from '../../hooks/useSwipeDown';
import { BottomReturnButton } from '../../components/ui/BottomReturnButton';
import type { UserProfile, GoalType } from '../../types/user';
import { GOAL_LABELS, GOAL_ICONS, GOAL_MUTEX_GROUPS, getActiveGoals } from '../../types/user';
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
import { ProfileEditorModal } from '../profile/ProfileEditorModal';
import { InsightsPage } from '../insights/InsightsPage';
import { formatDate, formatNumber, getTodayString } from '../../utils/calculator';
import { t as tStatic } from '../../i18n';
import { setFontSize, getFontSize } from '../../utils/fontSize';
import type { FontSize } from '../../utils/fontSize';
import { useLocale } from '../../i18n/useLocale';
import { localizeServingLabel, localizeUnit } from '../../utils/servingLabels';
import { getFoodWarning } from '../../utils/goalAlerts';
import { getDailyProgress, analyzeRollingWindow, getCategoryAlerts, CATEGORY_INFO } from '../../utils/nutritionTargets';
import type { RollingStats } from '../../utils/nutritionTargets';
import type { MedCategory } from '../../utils/goalAlerts';
import { getDailyLogs } from '../../services/firestore';
import { SCIENCE_ARTICLES } from '../../data/scienceArticles';

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
  onUpdateFood: (itemId: string, grams: number, displayUnit: string, per100g: import('../../types/food').NutritionData) => void;
  onLogout: () => void;
  onProfileUpdate: (updates: Partial<UserProfile>) => Promise<void>;
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
function NutritionDetailSheet({ item, onClose, onEdit, warning }: {
  item: MealItem;
  onClose: () => void;
  onEdit: (item: MealItem) => void;
  warning?: import('../../utils/goalAlerts').FoodWarning | null;
}) {
  const { locale } = useLocale();
  const n = item.nutrition;
  const rows: { label: string; value: number; unit: string }[] = [
    { label: tStatic('protein'),  value: n.protein, unit: 'g'  },
    { label: tStatic('carbs'),    value: n.carbs,   unit: 'g'  },
    { label: tStatic('fat'),      value: n.fat,     unit: 'g'  },
    { label: tStatic('fiber'),    value: n.fiber,   unit: 'g'  },
    ...(n.sugar  != null ? [{ label: tStatic('sugar'),  value: n.sugar,  unit: 'g'  }] : []),
    ...(n.sodium != null ? [{ label: tStatic('sodium'), value: n.sodium, unit: 'mg' }] : []),
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
        <div className="px-5 pt-2 pb-4 border-b border-gray-100 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 text-base">{item.foodName}</div>
            <div className="text-sm text-gray-400 mt-0.5">{localizeServingLabel(item.unit, locale)}</div>
            {warning && (
              <div className={`mt-2 text-xs px-3 py-1.5 rounded-lg ${
                warning.level === 'warn'
                  ? 'bg-red-50 text-red-600 border border-red-100'
                  : 'bg-amber-50 text-amber-700 border border-amber-100'
              }`}>
                {warning.emoji} {locale === 'zh' ? warning.reason : warning.reasonEn}
              </div>
            )}
          </div>
          <button
            onClick={() => onEdit(item)}
            className="shrink-0 text-xs text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors font-medium"
          >
            {tStatic('editAmount')}
          </button>
        </div>
        {/* Calories */}
        <div className="flex items-baseline justify-center gap-1 py-5">
          <span className="text-4xl font-bold text-green-600">{item.calories}</span>
          <span className="text-sm text-gray-400">{localizeUnit('kcal', locale)}</span>
        </div>
        {/* Macro grid */}
        <div className="px-5 grid grid-cols-2 gap-2 pb-2">
          {rows.map(r => (
            <div key={r.label} className="bg-gray-50 rounded-xl px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-gray-500">{r.label}</span>
              <span className="text-sm font-semibold text-gray-800">{formatNumber(r.value)}{localizeUnit(r.unit, locale)}</span>
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
  warning?: import('../../utils/goalAlerts').FoodWarning | null;
}

function SwipeableRow({ item, onRemove, onTap, warning }: SwipeableRowProps) {
  const { locale } = useLocale();
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
          {tStatic('deleteQuestion')}「<span className="font-medium text-gray-700">{item.foodName}</span>」？
        </span>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleCancel}
            className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 active:bg-gray-200 transition-colors"
          >{tStatic('cancel')}</button>
          <button
            onClick={handleConfirm}
            className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white active:bg-red-600 transition-colors"
          >{tStatic('confirmDelete')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <button
        onClick={handleDeleteClick}
        className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center bg-red-500 text-white text-sm font-medium"
      >{tStatic('delete')}</button>

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
            {warning && (
              <span
                title={warning.reason}
                className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${
                  warning.level === 'warn'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-amber-100 text-amber-600'
                }`}
              >
                {warning.emoji}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">{localizeServingLabel(item.unit, locale)}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-gray-600">{item.calories} {localizeUnit('kcal', locale)}</span>
          {/* Reserve space so kcal doesn't shift when arrow hides */}
          <span className={`text-gray-200 text-xs select-none ${isOpen ? 'invisible' : ''}`}>←</span>
        </div>
      </div>
    </div>
  );
}

function MiniDayPane({ log, date, targetCalories, locale }: {
  log: DailyLog | null;
  date: string;
  targetCalories: number;
  locale: string;
}) {
  const items = log ? log.meals.flatMap(m => m.items) : [];
  const calories = log?.totalCalories ?? 0;
  const pct = Math.min(100, Math.round((calories / Math.max(1, targetCalories)) * 100));
  return (
    <div className="pt-0 opacity-75">
      <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100 mb-4">
        <div className="flex items-center gap-4">
          <ProgressRing percent={pct} size={72}>
            <div className="text-base font-bold text-gray-800 leading-tight">{calories}</div>
            <div className="text-[9px] text-gray-400">kcal</div>
          </ProgressRing>
          <div className="flex-1 min-w-0">
            {items.length === 0 ? (
              <span className="text-xs text-gray-300">{locale === 'zh' ? '暂无记录' : 'No entries'}</span>
            ) : (
              <>
                {items.slice(0, 5).map(item => (
                  <div key={item.id} className="truncate text-xs text-gray-500 leading-5">{item.foodName}</div>
                ))}
                {items.length > 5 && (
                  <div className="text-xs text-gray-300">+{items.length - 5}</div>
                )}
              </>
            )}
          </div>
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
  onUpdateFood,
  onLogout,
  onProfileUpdate,
}: DashboardPageProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [showPantry, setShowPantry] = useState(false);
  const [showFamily, setShowFamily] = useState(false);
  const [showMenu,   setShowMenu]   = useState(false); // kept for potential future use
  const [showInsights, setShowInsights] = useState(false);
  const [fontSize, setFontSizeState] = useState<FontSize>(getFontSize());
  const { locale, changeLocale, t } = useLocale();

  const handleFontSize = (size: FontSize) => {
    setFontSize(size);
    setFontSizeState(size);
  };
  const [detailItem, setDetailItem] = useState<MealItem | null>(null);
  const [editingItem, setEditingItem] = useState<MealItem | null>(null);
  const [familyId, setFamilyId] = useState<string | undefined>(profile.familyId);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quickEntry, setQuickEntry] = useState<RecentFoodEntry | null>(null);
  const [weeklyRolling, setWeeklyRolling] = useState<RollingStats | null>(null);
  const [weeklyLogs, setWeeklyLogs] = useState<DailyLog[]>([]);
  const [infoCategory, setInfoCategory] = useState<MedCategory | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'weekly' | 'science' | 'profile'>('overview');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [scienceArticleId, setScienceArticleId] = useState<string | null>(null);

  // Adjacent day logs for 3-pane swipe carousel
  const [adjLogs, setAdjLogs] = useState<{ prev: DailyLog | null; next: DailyLog | null }>({ prev: null, next: null });
  // Native scroll-snap carousel refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const skipScrollRef = useRef(false);   // true while we programmatically reset to center
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Profile tab form state
  const [tabGoals, setTabGoals] = useState<GoalType[]>(getActiveGoals(profile));
  const [tabWeight, setTabWeight] = useState(String(profile.bodyMetrics?.weight ?? ''));
  const [tabBodyFat, setTabBodyFat] = useState(String(profile.bodyMetrics?.bodyFat ?? ''));
  const [tabTargetCal, setTabTargetCal] = useState(String(profile.targetCalories));
  const [tabSaving, setTabSaving] = useState(false);

  const anyModalOpen = showSearch || showPantry || showFamily || !!selectedFood || !!infoCategory;


  const lockCount = useRef(0);
  const lockBody = () => { lockCount.current++; };
  const unlockBody = () => { lockCount.current = Math.max(0, lockCount.current - 1); };

  const ns = nutritionStatus;

  const shiftDate = (base: string, offset: number): string => {
    const d = new Date(base + 'T00:00:00');
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const prevDate = shiftDate(currentDate, -1);
  const nextDate = shiftDate(currentDate, 1);

  // navigateDate: for button clicks — scroll the native scroll-snap container
  const navigateDate = (offset: number) => {
    const el = scrollRef.current; if (!el) return;
    const w = el.offsetWidth;
    el.scrollTo({ left: w + offset * w, behavior: 'smooth' });
    // The scroll-end handler (below) will detect the snap position and call onDateChange
  };

  // Reset scroll container to center pane whenever currentDate changes
  useEffect(() => {
    const el = scrollRef.current; if (!el) return;
    skipScrollRef.current = true;
    el.scrollTo({ left: el.offsetWidth, behavior: 'instant' as ScrollBehavior });
    // Allow a bit of time for the instant scroll to fire its scroll events before re-enabling
    const t = setTimeout(() => { skipScrollRef.current = false; }, 80);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  // Detect when user has snapped to an adjacent pane and navigate
  useEffect(() => {
    const el = scrollRef.current; if (!el) return;
    const onScroll = () => {
      if (skipScrollRef.current) return;
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => {
        if (skipScrollRef.current) return;
        const w = el.offsetWidth;
        if (w === 0) return;
        const idx = Math.round(el.scrollLeft / w); // 0=prev, 1=center, 2=next
        if (idx === 0) {
          // Navigating to prev day — pass current dailyLog as adj for the new center
          setAdjLogs(a => ({ prev: null, next: dailyLog ?? a.next }));
          onDateChange(shiftDate(currentDate, -1));
        } else if (idx === 2) {
          setAdjLogs(a => ({ prev: dailyLog ?? a.prev, next: null }));
          onDateChange(shiftDate(currentDate, 1));
        }
      }, 80);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, dailyLog, onDateChange]);

  // 所有食物条目按 loggedAt 排序（旧数据无 loggedAt 时保留原顺序）
  const allItems = dailyLog
    ? dailyLog.meals
        .flatMap(m => m.items)
        .sort((a, b) => (a.loggedAt || '').localeCompare(b.loggedAt || ''))
    : [];

  // 目标警示 & 地中海量化追踪
  const activeGoals = getActiveGoals(profile);
  const showMedChecklist = activeGoals.includes('anti_inflammatory');

  // 拉取最近7天历史记录，计算滚动窗口统计（7 Days tab 和地中海打卡均需要）
  useEffect(() => {
    const end = currentDate;
    const startDate = new Date(currentDate + 'T00:00:00');
    startDate.setDate(startDate.getDate() - 6);
    const pad = (n: number) => String(n).padStart(2, '0');
    const start = `${startDate.getFullYear()}-${pad(startDate.getMonth()+1)}-${pad(startDate.getDate())}`;
    getDailyLogs(profile.uid, start, end).then(logs => {
      setWeeklyLogs(logs);
      setWeeklyRolling(analyzeRollingWindow(logs, currentDate));
    }).catch(() => {/* 静默失败，不影响主功能 */});
  }, [profile.uid, currentDate]);

  // Fetch adjacent day logs for carousel panes (always, not gated on activeTab)
  useEffect(() => {
    getDailyLogs(profile.uid, prevDate, nextDate).then(logs => {
      setAdjLogs({
        prev: logs.find(l => l.date === prevDate) ?? null,
        next: logs.find(l => l.date === nextDate) ?? null,
      });
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.uid, currentDate]);


  // 今日各类别进度 & 滚动提醒
  const emptyRolling: RollingStats = {
    daysSinceLastEaten: { vegetable: null, fruit: null, whole_grain: null, legume: null, nut: null, seafood: null, fermented: null },
    weeklyCount:        { vegetable: 0,    fruit: 0,    whole_grain: 0,    legume: 0,    nut: 0,    seafood: 0,    fermented: 0    },
    weeklyGrams:        { vegetable: 0,    fruit: 0,    whole_grain: 0,    legume: 0,    nut: 0,    seafood: 0,    fermented: 0    },
  };
  const rolling = weeklyRolling ?? emptyRolling;
  const dailyProgress = showMedChecklist ? getDailyProgress(allItems, rolling) : [];
  const categoryAlerts = showMedChecklist ? getCategoryAlerts(rolling, allItems) : [];

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

  const toggleTabGoal = (g: GoalType) => {
    setTabGoals(prev => {
      if (prev.includes(g)) {
        if (prev.length === 1) return prev;
        return prev.filter(x => x !== g);
      }
      const mutex = GOAL_MUTEX_GROUPS.find(group => group.includes(g));
      const toRemove = mutex ? mutex.filter(x => x !== g) : [];
      return [...prev.filter(x => !toRemove.includes(x)), g];
    });
  };

  const handleTabProfileSave = async () => {
    setTabSaving(true);
    const activeGoals = tabGoals.length > 0 ? tabGoals : ['anti_inflammatory' as GoalType];
    await onProfileUpdate({
      goal: activeGoals[0],
      goals: activeGoals,
      targetCalories: Number(tabTargetCal) || profile.targetCalories,
      targetCaloriesMode: 'manual',
      bodyMetrics: {
        ...(profile.bodyMetrics ?? { height: 170, age: 30, gender: 'female', activityLevel: 'moderate' }),
        weight: Number(tabWeight) || (profile.bodyMetrics?.weight ?? 60),
        bodyFat: tabBodyFat ? Number(tabBodyFat) : undefined,
      },
    });
    setTabSaving(false);
  };

  const todayStr = getTodayString();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🥗</span>
            <span className="font-bold text-gray-900">NutriTrack</span>
            {getActiveGoals(profile).map(g => (
              <span key={g} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                {GOAL_ICONS[g]} {GOAL_LABELS[g]}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {/* 同步状态指示器 */}
            {syncStatus === 'syncing' && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <span className="w-3 h-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin inline-block" />
                {t('syncing')}
              </span>
            )}
            {syncStatus === 'synced' && (
              <button
                onClick={onForceSync}
                className="text-green-500 flex items-center gap-1 hover:text-green-600 transition-colors"
                style={{ fontSize: '0.8rem' }}
                title={t('synced')}
              >
                {t('synced')}
              </button>
            )}
            {(syncStatus === 'error' || syncStatus === 'idle') && (
              <button
                onClick={onForceSync}
                className="text-xs text-red-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                title={syncError ?? t('clickToSync')}
              >
                {syncStatus === 'error' ? t('reSync') : t('syncNow')}
              </button>
            )}
            {/* 食材库快捷入口 */}
            <button
              onClick={openPantry}
              className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
              title={t('pantryTitle')}
            >
              📦
            </button>
          </div>
        </div>
        {/* 同步错误详情横幅 */}
        {syncStatus === 'error' && syncError && (
          <div className="max-w-lg mx-auto px-4 pb-2">
            <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-xs text-red-600 flex items-start justify-between gap-3">
              <div>
                <div><strong>{t('syncFailed')}</strong>{syncError}</div>
                <div className="text-red-400 mt-0.5">{t('syncLocalOnly')}</div>
              </div>
              <button
                onClick={onForceSync}
                className="shrink-0 bg-red-100 hover:bg-red-200 text-red-600 px-2.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap"
              >
                {t('retry')}
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-lg mx-auto pb-32">

        {/* Date navigator — static row, date text updates instantly after swipe */}
        {activeTab === 'overview' && (
          <div className="flex items-center justify-center gap-4 py-4">
            <button onClick={() => navigateDate(-1)} className="text-gray-400 hover:text-gray-600 p-1">← {t('prevDay')}</button>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{formatDate(currentDate, locale)}</span>
              {currentDate !== todayStr && (
                <button
                  onClick={() => onDateChange(todayStr)}
                  className="text-xs text-green-600 bg-green-50 hover:bg-green-100 border border-green-200 px-2 py-0.5 rounded-full transition-colors"
                >
                  {t('today')}
                </button>
              )}
            </div>
            <button onClick={() => navigateDate(1)} className="text-gray-400 hover:text-gray-600 p-1">{t('nextDay')} →</button>
          </div>
        )}

        {/* ══════════════ OVERVIEW TAB — native scroll-snap carousel ══════════════ */}
        {activeTab === 'overview' && (
          <div
            ref={scrollRef}
            style={{
              display: 'flex',
              overflowX: 'scroll',
              overflowY: 'clip',
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            } as React.CSSProperties}
            className="[&::-webkit-scrollbar]:hidden"
          >
              {/* Left pane: prev day — native UIScrollView pre-renders this */}
              <div style={{ flex: '0 0 100%', scrollSnapAlign: 'start', scrollSnapStop: 'always', minWidth: 0 }} className="px-4">
                <div className="flex items-center justify-center py-4 text-sm font-medium text-gray-400">
                  {formatDate(prevDate, locale)}
                </div>
                <MiniDayPane
                  log={adjLogs.prev ?? weeklyLogs.find(l => l.date === prevDate) ?? null}
                  date={prevDate}
                  targetCalories={profile.targetCalories}
                  locale={locale}
                />
              </div>

              {/* Center pane: current day */}
              <div style={{ flex: '0 0 100%', scrollSnapAlign: 'start', scrollSnapStop: 'always', minWidth: 0 }} className="px-4">

        {/* ── 热量环 + 宏量 · 合并卡片 ── */}
        {ns && (
          <div className="bg-white rounded-2xl px-5 py-5 shadow-sm border border-gray-100 mb-4">
            <div className="flex items-center gap-5">
              {/* 左：热量环 */}
              <div className="flex flex-col items-center shrink-0">
                <ProgressRing percent={ns.caloriePercent} size={120}>
                  <div className="text-2xl font-bold text-gray-900 leading-tight">{ns.consumedCalories}</div>
                  <div className="text-[10px] text-gray-400">/ {ns.targetCalories}</div>
                  <div className="text-[10px] text-gray-400">{localizeUnit('kcal', locale)}</div>
                </ProgressRing>
                <div className={`mt-2 text-sm font-semibold ${ns.isOverCalorie ? 'text-red-500' : 'text-green-600'}`}>
                  {ns.isOverCalorie ? '+' : '−'}{Math.abs(ns.remainingCalories)} kcal
                </div>
                <div className="text-[10px] text-gray-400">
                  {ns.isOverCalorie ? t('overTarget') : t('remaining')}
                </div>
              </div>

              {/* 右：两列并排 */}
              <div className="flex-1 min-w-0 grid grid-cols-2 gap-x-3">

                {/* 左列：蛋白 / 碳水 / 脂肪 / 膳食纤维 */}
                <div className="space-y-2">
                  {[
                    { label: t('protein'), m: ns.macros.protein, color: 'bg-blue-500'  },
                    { label: t('carbs'),   m: ns.macros.carbs,   color: 'bg-amber-400' },
                    { label: t('fat'),     m: ns.macros.fat,     color: 'bg-red-400'   },
                    { label: t('fiber'),   m: ns.fiber,          color: 'bg-green-400' },
                  ].map(({ label, m, color }) => (
                    <div key={label}>
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="text-[10px] text-gray-600 font-medium">{label}</span>
                        <span className="text-[10px] text-gray-400 tabular-nums">
                          {m.consumed}<span className="text-gray-300">/{m.target}g</span>
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${color} transition-all`}
                          style={{ width: `${Math.min(100, m.percent)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* 右列：糖 / 钠 / Omega-3（仅有进阶数据时显示） */}
                {ns.advanced ? (
                  <div className="space-y-2">
                    {[
                      {
                        label: t('addedSugar'),
                        display: `${ns.advanced.sugar.consumed}g`,
                        limit: `<${ns.advanced.sugar.max}g`,
                        status: ns.advanced.sugar.status,
                        pct: Math.min(100, Math.round(ns.advanced.sugar.consumed / ns.advanced.sugar.max * 100)),
                      },
                      {
                        label: t('sodium'),
                        display: ns.advanced.sodium.consumed >= 1000
                          ? `${(ns.advanced.sodium.consumed / 1000).toFixed(1)}g`
                          : `${ns.advanced.sodium.consumed}mg`,
                        limit: `<${ns.advanced.sodium.max / 1000}g`,
                        status: ns.advanced.sodium.status,
                        pct: Math.min(100, Math.round(ns.advanced.sodium.consumed / ns.advanced.sodium.max * 100)),
                      },
                      {
                        label: 'Omega-3',
                        display: `${ns.advanced.omega3.consumed}mg`,
                        limit: `≥${ns.advanced.omega3.min}mg`,
                        status: ns.advanced.omega3.status,
                        pct: Math.min(100, Math.round(ns.advanced.omega3.consumed / ns.advanced.omega3.min * 100)),
                      },
                    ].map(item => {
                      const barColor = item.status === 'good' ? 'bg-green-400'
                        : item.status === 'warning' ? 'bg-amber-400' : 'bg-red-400';
                      const valColor = item.status === 'good' ? 'text-green-600'
                        : item.status === 'warning' ? 'text-amber-500' : 'text-red-500';
                      return (
                        <div key={item.label}>
                          <div className="flex justify-between items-baseline mb-0.5">
                            <span className="text-[10px] text-gray-600 font-medium">{item.label}</span>
                            <span className={`text-[10px] tabular-nums ${valColor}`}>{item.display}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${barColor} transition-all`}
                              style={{ width: `${item.pct}%` }} />
                          </div>
                          <div className="text-[9px] text-gray-300 mt-0.5">{item.limit}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : <div />}

              </div>
            </div>
          </div>
        )}

        {/* ── 地中海饮食 · 量化目标进度 ── */}
        {showMedChecklist && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
            {/* 标题 */}
            <div className="px-4 pt-4 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-base">🫒</span>
                <span className="font-semibold text-gray-800 text-sm">
                  {locale === 'zh' ? '食物多样性' : 'Food Diversity'}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {dailyProgress.filter(p => p.met).length}/{dailyProgress.length}
                {' '}{locale === 'zh' ? '达标' : 'met'}
              </span>
            </div>

            {/* 每类别进度条 · 两栏 */}
            <div className="px-4 pb-3 grid grid-cols-2 gap-x-4 gap-y-3">
              {dailyProgress.map(p => {
                const isWeekly = p.weeklyTarget !== null;
                const barPct = p.percent;
                const daysSince = rolling.daysSinceLastEaten[p.category];
                const showDaysChip = daysSince !== null && daysSince > 0 && p.todayGrams === 0 && !isWeekly;
                return (
                  <div key={p.category}>
                    {/* 类别名 + 天数chip + ⓘ */}
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-sm leading-none">{p.icon}</span>
                      <span className="text-xs font-medium text-gray-700 truncate">
                        {locale === 'zh' ? p.label : p.labelEn}
                      </span>
                      {showDaysChip && (
                        <span className="text-[9px] text-amber-500 bg-amber-50 px-1 py-0.5 rounded-full leading-none shrink-0">
                          {daysSince}{locale === 'zh' ? '天前' : 'd'}
                        </span>
                      )}
                      <button
                        onClick={() => setInfoCategory(p.category as MedCategory)}
                        className="ml-auto shrink-0 text-gray-300 hover:text-green-500 transition-colors leading-none"
                        aria-label="learn more"
                      >
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                          <circle cx="8" cy="8" r="7.5" stroke="currentColor" strokeWidth="1" fill="none"/>
                          <text x="8" y="12" textAnchor="middle" fontSize="9" fontWeight="600" fill="currentColor">i</text>
                        </svg>
                      </button>
                    </div>
                    {/* 进度条 */}
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-0.5">
                      <div
                        className={`h-full rounded-full transition-all ${
                          p.met ? 'bg-green-400' : barPct >= 60 ? 'bg-amber-400' : barPct > 0 ? 'bg-orange-300' : 'bg-gray-200'
                        }`}
                        style={{ width: `${Math.max(barPct, p.todayGrams > 0 || (isWeekly && p.weeklyCount > 0) ? 3 : 0)}%` }}
                      />
                    </div>
                    {/* 数值行 */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 tabular-nums">
                        {isWeekly
                          ? `${p.weeklyCount}/${p.weeklyTarget} ${locale === 'zh' ? '次/7天' : 'x/7d'}`
                          : `${p.todayGrams}/${p.targetGrams}g`
                        }
                      </span>
                      {p.met
                        ? <span className="text-[10px] text-green-500 font-medium">✓</span>
                        : <span className="text-[10px] text-gray-300">{locale === 'zh' ? p.targetLabel : p.targetLabelEn}</span>
                      }
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 滚动提醒：N天未吃提示 */}
            {categoryAlerts.length > 0 && (
              <div className="border-t border-gray-50 px-4 py-3 space-y-2">
                <div className="text-xs font-medium text-gray-500 mb-1">
                  💡 {locale === 'zh' ? '建议今天加入' : 'Suggested for today'}
                </div>
                {categoryAlerts.slice(0, 3).map(alert => (
                  <div key={alert.category} className={`flex items-start gap-2 text-xs rounded-xl px-3 py-2 ${
                    alert.severity === 'moderate'
                      ? 'bg-orange-50 text-orange-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    <span className="shrink-0 mt-0.5">{alert.icon}</span>
                    <div className="min-w-0">
                      <span className="font-semibold">
                        {locale === 'zh' ? alert.label : alert.labelEn}
                      </span>
                      <span className="text-opacity-80">
                        {' · '}{locale === 'zh' ? alert.message : alert.messageEn}
                      </span>
                      <div className="text-[10px] mt-0.5 opacity-75">
                        {locale === 'zh' ? alert.suggestion : alert.suggestionEn}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {categoryAlerts.length === 0 && dailyProgress.every(p => p.met) && (
              <div className="border-t border-gray-50 px-4 py-3 text-xs text-green-600 font-medium text-center">
                🎉 {locale === 'zh' ? '今天各类食物都达标了，太棒了！' : 'All food groups met today — great job!'}
              </div>
            )}
          </div>
        )}

        {/* ── 今日食物时间线（overview 底部）── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-3">
            <div className="flex items-center justify-between p-4 pb-3">
              <h3 className="font-semibold text-gray-800">{t('todaysFoodLog')}</h3>
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
                  {t('logFood')}
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {allItems.map(item => {
                  const warn = getFoodWarning(item.foodName, activeGoals);
                  const isExpanded = expandedItemId === item.id;
                  const n = item.nutrition;
                  const nutriRows = [
                    { label: tStatic('protein'), value: n.protein, unit: 'g' },
                    { label: tStatic('carbs'),   value: n.carbs,   unit: 'g' },
                    { label: tStatic('fat'),      value: n.fat,     unit: 'g' },
                    { label: tStatic('fiber'),    value: n.fiber,   unit: 'g' },
                    ...(n.sugar  != null ? [{ label: tStatic('sugar'),  value: n.sugar,  unit: 'g'  }] : []),
                    ...(n.sodium != null ? [{ label: tStatic('sodium'), value: n.sodium, unit: 'mg' }] : []),
                  ];
                  return (
                    <div key={item.id}>
                      {/* Row header — tap to expand */}
                      <button
                        className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-gray-50 transition-colors"
                        onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                      >
                        {warn && (
                          <span className={`shrink-0 text-xs font-bold px-1.5 py-0.5 rounded-md ${
                            warn.level === 'warn'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-amber-100 text-amber-700'
                          }`}>{warn.emoji}</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-800 text-sm truncate">{item.foodName}</div>
                          <div className="text-xs text-gray-400">{localizeServingLabel(item.unit, locale)}</div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="font-semibold text-gray-800 text-sm">{item.calories} kcal</div>
                          <div className="text-xs text-gray-400">{fmtTime(item.loggedAt)}</div>
                        </div>
                        <span className={`shrink-0 text-gray-300 text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                      </button>

                      {/* Expandable nutrition detail */}
                      {isExpanded && (
                        <div className="px-4 pb-3 bg-gray-50 border-t border-gray-100">
                          {warn && (
                            <div className={`mt-2 mb-3 text-xs px-3 py-2 rounded-xl ${
                              warn.level === 'warn'
                                ? 'bg-red-50 text-red-600 border border-red-100'
                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {warn.emoji} {locale === 'zh' ? warn.reason : warn.reasonEn}
                            </div>
                          )}
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            {nutriRows.map(r => (
                              <div key={r.label} className="bg-white rounded-xl px-3 py-2 text-center shadow-sm">
                                <div className="text-xs text-gray-400">{r.label}</div>
                                <div className="text-sm font-semibold text-gray-800">{formatNumber(r.value)}{localizeUnit(r.unit, locale)}</div>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={e => { e.stopPropagation(); setEditingItem(item); setExpandedItemId(null); }}
                              className="flex-1 text-xs text-blue-500 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl font-medium transition-colors"
                            >
                              {tStatic('editAmount')}
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); onRemoveFood(item.id); setExpandedItemId(null); }}
                              className="flex-1 text-xs text-red-400 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl font-medium transition-colors"
                            >
                              {locale === 'zh' ? '删除' : 'Remove'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

              </div>{/* end center pane */}

              {/* Right pane: next day — native UIScrollView pre-renders this */}
              <div style={{ flex: '0 0 100%', scrollSnapAlign: 'start', scrollSnapStop: 'always', minWidth: 0 }} className="px-4">
                <div className="flex items-center justify-center py-4 text-sm font-medium text-gray-400">
                  {formatDate(nextDate, locale)}
                </div>
                <MiniDayPane
                  log={adjLogs.next}
                  date={nextDate}
                  targetCalories={profile.targetCalories}
                  locale={locale}
                />
              </div>

          </div>
        )}{/* end scroll-snap carousel overview */}

        <div className="px-4">
        {/* ══════════════ 7 DAYS TAB ══════════════ */}
        {activeTab === 'weekly' && (() => {
          const today = new Date(currentDate + 'T00:00:00');
          const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today);
            d.setDate(d.getDate() - (6 - i));
            const pad = (n: number) => String(n).padStart(2, '0');
            const dateStr = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
            const log = weeklyLogs.find(l => l.date === dateStr);
            return { dateStr, kcal: log?.totalCalories ?? 0, log };
          });
          const maxKcal = Math.max(...days.map(d => d.kcal), 500);
          const avgKcal = days.filter(d => d.kcal > 0).reduce((s, d) => s + d.kcal, 0)
            / Math.max(1, days.filter(d => d.kcal > 0).length);

          const dayLabels = locale === 'zh'
            ? ['日','一','二','三','四','五','六']
            : ['Su','Mo','Tu','We','Th','Fr','Sa'];

          // Weekly average macros
          const logsWithData = days.filter(d => d.log && d.kcal > 0);
          const avgMacros = logsWithData.length > 0 ? {
            protein: logsWithData.reduce((s, d) => s + (d.log!.totalNutrition.protein ?? 0), 0) / logsWithData.length,
            carbs:   logsWithData.reduce((s, d) => s + (d.log!.totalNutrition.carbs ?? 0), 0) / logsWithData.length,
            fat:     logsWithData.reduce((s, d) => s + (d.log!.totalNutrition.fat ?? 0), 0) / logsWithData.length,
            fiber:   logsWithData.reduce((s, d) => s + (d.log!.totalNutrition.fiber ?? 0), 0) / logsWithData.length,
          } : null;

          return (
            <div className="space-y-4 pt-4">
              {/* 7-day calorie bar chart */}
              <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-gray-800 text-sm">
                    {locale === 'zh' ? '近7天热量' : '7-Day Calories'}
                  </span>
                  {avgKcal > 0 && (
                    <span className="text-xs text-gray-400">
                      {locale === 'zh' ? '均' : 'avg'} {Math.round(avgKcal)} kcal
                    </span>
                  )}
                </div>
                <div className="flex items-end gap-1.5 h-20">
                  {days.map(({ dateStr, kcal }) => {
                    const pct = kcal > 0 ? Math.max(8, Math.round((kcal / maxKcal) * 100)) : 4;
                    const isToday = dateStr === currentDate;
                    const d = new Date(dateStr + 'T00:00:00');
                    const dow = d.getDay();
                    return (
                      <div key={dateStr} className="flex-1 flex flex-col items-center gap-1">
                        <div className="text-[9px] text-gray-400 tabular-nums">
                          {kcal > 0 ? kcal : ''}
                        </div>
                        <div className="w-full flex items-end justify-center" style={{ height: '52px' }}>
                          <div
                            className={`w-full rounded-t-md transition-all ${isToday ? 'bg-green-500' : 'bg-green-200'}`}
                            style={{ height: `${pct}%` }}
                          />
                        </div>
                        <div className={`text-[10px] font-medium ${isToday ? 'text-green-600' : 'text-gray-400'}`}>
                          {dayLabels[dow]}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {ns && (
                  <div className="mt-2 pt-2 border-t border-gray-50 flex items-center gap-1.5 text-xs text-gray-400">
                    <div className="w-2.5 h-2.5 rounded-sm bg-green-100 border border-green-300 inline-block" />
                    {locale === 'zh' ? `目标 ${ns.targetCalories} kcal/天` : `Target ${ns.targetCalories} kcal/day`}
                  </div>
                )}
              </div>

              {/* Weekly average macros */}
              {avgMacros && ns && (
                <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100">
                  <div className="font-semibold text-gray-800 text-sm mb-3">
                    {locale === 'zh' ? '近7天平均营养' : '7-Day Average Nutrition'}
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { label: t('protein'), avg: avgMacros.protein, target: ns.macros.protein.target, color: 'bg-blue-500' },
                      { label: t('carbs'),   avg: avgMacros.carbs,   target: ns.macros.carbs.target,   color: 'bg-amber-400' },
                      { label: t('fat'),     avg: avgMacros.fat,     target: ns.macros.fat.target,     color: 'bg-red-400'   },
                      { label: t('fiber'),   avg: avgMacros.fiber,   target: ns.fiber.target,          color: 'bg-green-400' },
                    ].map(({ label, avg, target, color }) => {
                      const pct = target > 0 ? Math.min(100, Math.round((avg / target) * 100)) : 0;
                      return (
                        <div key={label}>
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="text-xs text-gray-600 font-medium">{label}</span>
                            <span className="text-xs text-gray-400 tabular-nums">
                              {Math.round(avg)}g <span className="text-gray-300">/ {target}g</span>
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${color} transition-all`}
                              style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mediterranean weekly progress */}
              {showMedChecklist && (
                <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-1.5 mb-3">
                    <span>🫒</span>
                    <span className="font-semibold text-gray-800 text-sm">
                      {locale === 'zh' ? '近7天食物多样性' : '7-Day Food Diversity'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {getDailyProgress(allItems, rolling).map(p => {
                      // 7天tab：每日平均克数（周次数类型仍用次数）
                      const daysEaten = rolling.weeklyCount[p.category];
                      const avgG = daysEaten > 0
                        ? Math.round(rolling.weeklyGrams[p.category] / daysEaten)
                        : 0;
                      return (
                      <div key={p.category} className="flex items-center gap-3">
                        <span className="text-base w-6 text-center shrink-0">{p.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <span className="text-xs font-medium text-gray-700 truncate">
                              {locale === 'zh' ? p.label : p.labelEn}
                            </span>
                            <span className="text-xs text-gray-400 tabular-nums shrink-0 ml-1">
                              {p.weeklyTarget !== null
                                ? `${daysEaten}/${p.weeklyTarget} ${locale === 'zh' ? '次/7天' : 'x/7d'}`
                                : avgG > 0
                                  ? `${locale === 'zh' ? '均' : 'avg'} ${avgG}g/天`
                                  : locale === 'zh' ? '未记录' : 'none'
                              }
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${p.met ? 'bg-green-400' : p.percent >= 60 ? 'bg-amber-400' : p.percent > 0 ? 'bg-orange-300' : 'bg-gray-200'}`}
                              style={{ width: `${Math.max(p.percent, p.percent > 0 ? 3 : 0)}%` }}
                            />
                          </div>
                        </div>
                        {p.met && <span className="text-xs text-green-500 shrink-0">✓</span>}
                      </div>
                    ); })}
                  </div>
                </div>
              )}

              {/* No data state */}
              {weeklyLogs.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  {locale === 'zh' ? '暂无近7天数据，开始记录饮食吧' : 'No data for the past 7 days yet — start logging!'}
                </div>
              )}
            </div>
          );
        })()}

        {/* ══════════════ SCIENCE TAB ══════════════ */}
        {activeTab === 'science' && (() => {
          const article = scienceArticleId
            ? SCIENCE_ARTICLES.find(a => a.id === scienceArticleId)
            : null;

          if (article) {
            // 文章详情页
            return (
              <div className="pt-4">
                {/* Back */}
                <button
                  onClick={() => setScienceArticleId(null)}
                  className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 mb-4"
                >
                  ← {locale === 'zh' ? '返回' : 'Back'}
                </button>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Header */}
                  <div className="px-5 pt-5 pb-4 border-b border-gray-50">
                    <span className="text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                      {locale === 'zh' ? article.tag : article.tagEn}
                    </span>
                    <h2 className="text-base font-bold text-gray-900 mt-3 leading-snug">
                      {locale === 'zh' ? article.title.zh : article.title.en}
                    </h2>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>📖 {article.readMinutes} {locale === 'zh' ? '分钟' : 'min read'}</span>
                      <span>·</span>
                      <span>{article.source.split(';')[0].trim()}</span>
                    </div>
                  </div>
                  {/* Body */}
                  <div className="px-5 py-4 space-y-5">
                    {article.body.map((para, i) => {
                      const text = locale === 'zh' ? para.zh : para.en;
                      const parts = text.split('\n\n');
                      return (
                        <div key={i} className="space-y-2">
                          {parts.map((part, j) => {
                            if (part.startsWith('**') && part.includes('**\n\n')) {
                              const [title, ...rest] = part.split('**\n\n');
                              return (
                                <div key={j}>
                                  <div className="font-semibold text-gray-900 text-sm mb-1">
                                    {title.replace(/\*\*/g, '')}
                                  </div>
                                  <p className="text-sm text-gray-700 leading-relaxed">{rest.join('**\n\n')}</p>
                                </div>
                              );
                            }
                            if (part.startsWith('**')) {
                              const cleaned = part.replace(/\*\*/g, '');
                              const colonIdx = cleaned.indexOf('\n');
                              if (colonIdx > -1) {
                                return (
                                  <div key={j}>
                                    <div className="font-semibold text-gray-900 text-sm mb-1">{cleaned.slice(0, colonIdx)}</div>
                                    <p className="text-sm text-gray-700 leading-relaxed">{cleaned.slice(colonIdx + 1)}</p>
                                  </div>
                                );
                              }
                            }
                            return <p key={j} className="text-sm text-gray-700 leading-relaxed">{part.replace(/\*\*/g, '')}</p>;
                          })}
                        </div>
                      );
                    })}
                    <div className="pt-3 border-t border-gray-100 text-xs text-gray-400 leading-relaxed">
                      <span className="font-medium">📚 {locale === 'zh' ? '参考来源' : 'Sources'}：</span>{article.source}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // 文章列表页
          return (
            <div className="pt-4 space-y-3">
              <div className="text-sm font-semibold text-gray-800 px-1 mb-1">
                {locale === 'zh' ? '🔬 营养科学' : '🔬 Nutrition Science'}
              </div>
              <div className="text-xs text-gray-400 px-1 mb-3">
                {locale === 'zh'
                  ? '基于 NEJM、Lancet、Cell 等顶级期刊的营养学研究精读'
                  : 'Key findings from top journals: NEJM, Lancet, Cell, and more'}
              </div>
              {SCIENCE_ARTICLES.map(art => (
                <button
                  key={art.id}
                  onClick={() => setScienceArticleId(art.id)}
                  className="w-full text-left bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:border-green-200 active:bg-gray-50 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                          {locale === 'zh' ? art.tag : art.tagEn}
                        </span>
                        <span className="text-[10px] text-gray-300">
                          {art.readMinutes} {locale === 'zh' ? '分钟' : 'min'}
                        </span>
                      </div>
                      <div className="font-semibold text-gray-900 text-sm leading-snug mb-1.5">
                        {locale === 'zh' ? art.title.zh : art.title.en}
                      </div>
                      <div className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                        {locale === 'zh' ? art.summary.zh : art.summary.en}
                      </div>
                    </div>
                    <span className="shrink-0 text-gray-300 text-sm mt-1">›</span>
                  </div>
                </button>
              ))}
            </div>
          );
        })()}

        {/* ══════════════ MY DATA TAB ══════════════ */}
        {activeTab === 'profile' && (
          <div className="space-y-5 pt-4">
            {/* Goals */}
            <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100">
              <div className="text-sm font-semibold text-gray-800 mb-1">{t('myGoal')}</div>
              <div className="text-xs text-gray-400 mb-3">
                {locale === 'zh' ? '可多选，减脂和增肌不能同时选' : 'Multiple allowed — fat loss and muscle gain are mutually exclusive'}
              </div>
              <div className="space-y-2">
                {(['fat_loss', 'muscle_gain', 'anti_inflammatory', 'blood_sugar'] as GoalType[]).map(g => {
                  const selected = tabGoals.includes(g);
                  const disabledBy = GOAL_MUTEX_GROUPS.find(
                    group => group.includes(g) && group.some(x => x !== g && tabGoals.includes(x))
                  );
                  return (
                    <button
                      key={g}
                      onClick={() => !disabledBy && toggleTabGoal(g)}
                      disabled={!!disabledBy}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                        selected
                          ? 'bg-green-50 border-green-400 text-green-800'
                          : disabledBy
                            ? 'bg-gray-50 border-gray-100 opacity-40 cursor-not-allowed'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{GOAL_ICONS[g]}</span>
                          <span className="font-medium text-sm">{t(`goal_${g}`)}</span>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${selected ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                          {selected && <span className="text-white text-[10px]">✓</span>}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 pl-6">{t(`goal_${g}_desc`)}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Body data */}
            <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100">
              <div className="text-sm font-semibold text-gray-800 mb-3">{t('bodyData')}</div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">{t('bodyWeight')} (kg)</label>
                  <input
                    type="number"
                    value={tabWeight}
                    onChange={e => setTabWeight(e.target.value)}
                    placeholder="65"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    {t('bodyFat')} (%) <span className="text-gray-300">{t('optional')}</span>
                  </label>
                  <input
                    type="number"
                    value={tabBodyFat}
                    onChange={e => setTabBodyFat(e.target.value)}
                    placeholder="22"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Calorie target */}
            <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100">
              <div className="text-sm font-semibold text-gray-800 mb-3">{t('calorieTarget')}</div>
              <div className="relative">
                <input
                  type="number"
                  value={tabTargetCal}
                  onChange={e => setTabTargetCal(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-14 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">kcal</span>
              </div>
            </div>

            {/* Settings */}
            <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100 space-y-4">
              <div className="text-sm font-semibold text-gray-800">{locale === 'zh' ? '设置' : 'Settings'}</div>
              <div>
                <div className="text-xs text-gray-400 mb-1.5">{t('fontSize')}</div>
                <div className="flex gap-1">
                  {(['small', 'standard', 'large'] as FontSize[]).map((s, i) => (
                    <button
                      key={s}
                      onClick={() => handleFontSize(s)}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${
                        fontSize === s ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {[t('fontSmall'), t('fontStandard'), t('fontLarge')][i]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1.5">{t('language')}</div>
                <div className="flex gap-1">
                  {(['zh', 'en'] as const).map(l => (
                    <button
                      key={l}
                      onClick={() => changeLocale(l)}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${
                        locale === l ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {l === 'zh' ? '中文' : 'EN'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Insights + Family */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <button
                onClick={() => setShowInsights(true)}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <span>🔍</span>
                <span className="font-medium">{locale === 'zh' ? '饮食分析' : 'Nutrition Insights'}</span>
                <span className="ml-auto text-gray-300">›</span>
              </button>
              <div className="h-px bg-gray-100 mx-4" />
              <button
                onClick={openFamily}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <span>👨‍👩‍👧</span>
                <span className="font-medium">{t('familyShare')}</span>
                <span className="ml-auto text-gray-300">›</span>
              </button>
            </div>

            {/* Save button */}
            <button
              onClick={handleTabProfileSave}
              disabled={tabSaving}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-4 rounded-2xl transition-colors"
            >
              {tabSaving ? t('savingEllipsis') : t('save')}
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="w-full text-center text-sm text-red-400 hover:text-red-500 py-3 transition-colors"
            >
              🚪 {t('logout')}
            </button>
          </div>
        )}
        </div>{/* end px-4 wrapper for non-overview tabs */}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-20 safe-area-inset-bottom">
        <div className="max-w-lg mx-auto flex items-end h-16">

          {/* Tab 1 — 总览 */}
          <button
            onClick={() => { setActiveTab('overview'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 pb-2 pt-1 transition-colors ${activeTab === 'overview' ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 7.07 17.07"/><path d="M12 12 7 7"/>
            </svg>
            <span className="text-[10px] font-medium">{locale === 'zh' ? '总览' : 'Overview'}</span>
          </button>

          {/* Tab 2 — 7 Days */}
          <button
            onClick={() => { setActiveTab('weekly'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 pb-2 pt-1 transition-colors ${activeTab === 'weekly' ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/>
              <path d="M7 13h2v5H7z"/><path d="M11 15h2v3h-2z"/><path d="M15 12h2v6h-2z"/>
            </svg>
            <span className="text-[10px] font-medium">{locale === 'zh' ? '7天' : '7 Days'}</span>
          </button>

          {/* 中间 + 按钮 */}
          <div className="flex flex-col items-center justify-end pb-3 px-3">
            <button
              onClick={openSearch}
              className="bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-green-700 active:scale-95 transition-all -translate-y-3"
              style={{ width: '52px', height: '52px' }}
            >
              +
            </button>
          </div>

          {/* Tab 3 — 科学 */}
          <button
            onClick={() => { setActiveTab('science'); setScienceArticleId(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 pb-2 pt-1 transition-colors ${activeTab === 'science' ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0H5m4 0h10m0-11v11m0 0h-4M9 14v7m0 0H5m4 0h4m2 0v-7"/>
              <circle cx="17" cy="18" r="3"/><path d="m21 22-1.5-1.5"/>
            </svg>
            <span className="text-[10px] font-medium">{locale === 'zh' ? '科学' : 'Science'}</span>
          </button>

          {/* Tab 4 — 我的 */}
          <button
            onClick={() => { setActiveTab('profile'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 pb-2 pt-1 transition-colors ${activeTab === 'profile' ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <span className="text-[10px] font-medium">{locale === 'zh' ? '我的' : 'Me'}</span>
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

      {detailItem && !editingItem && (
        <NutritionDetailSheet
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onEdit={item => { setEditingItem(item); setDetailItem(null); }}
          warning={getFoodWarning(detailItem.foodName, activeGoals)}
        />
      )}

      {/* 修改用量：重用 AddFoodModal，从已录数据反推 per100g */}
      {editingItem && (() => {
        const amt = editingItem.amount || 100;
        const n   = editingItem.nutrition;
        const f   = 100 / amt;
        const per100g = {
          calories: n.calories * f, protein: n.protein * f,
          carbs: n.carbs * f, fat: n.fat * f, fiber: n.fiber * f,
          sodium: n.sodium != null ? n.sodium * f : undefined,
          sugar:  n.sugar  != null ? n.sugar  * f : undefined,
        };
        const food: FoodItem = {
          id: editingItem.foodId ?? editingItem.id,
          name: editingItem.foodName,
          category: 'other', source: 'user_added',
          per100g,
        };
        return (
          <AddFoodModal
            food={food}
            quickGrams={amt}
            quickUnit={editingItem.unit}
            onConfirm={(_, grams, displayUnit) => {
              onUpdateFood(editingItem.id, grams, displayUnit, per100g);
              setEditingItem(null);
            }}
            onBack={() => setEditingItem(null)}
            onClose={() => setEditingItem(null)}
          />
        );
      })()}

      {showInsights && (
        <InsightsPage
          profile={profile}
          onClose={() => setShowInsights(false)}
        />
      )}

      {/* 食物类别科普弹窗 */}
      {infoCategory && (() => {
        const info = CATEGORY_INFO[infoCategory];
        if (!info) return null;
        const target = getDailyProgress(allItems, rolling).find(p => p.category === infoCategory);
        return (
          <div
            className="fixed inset-x-0 bg-black/40 z-50 flex items-end justify-center"
            style={{ top: 'var(--vvt, 0px)', height: 'var(--vvh, 100vh)' }}
            onClick={() => setInfoCategory(null)}
          >
            <div
              className="bg-white w-full sm:max-w-lg rounded-t-2xl overflow-hidden"
              style={{ maxHeight: '80vh' }}
              onClick={e => e.stopPropagation()}
            >
              {/* drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>

              {/* header */}
              <div className="px-5 pt-1 pb-3 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{target?.icon}</span>
                  <div>
                    <div className="font-semibold text-gray-900 text-base leading-tight">
                      {locale === 'zh' ? target?.label : target?.labelEn}
                    </div>
                    <div className="text-xs text-gray-400">
                      {locale === 'zh' ? target?.targetLabel : target?.targetLabelEn}
                    </div>
                  </div>
                </div>
                <button onClick={() => setInfoCategory(null)} className="text-gray-300 hover:text-gray-500 text-xl leading-none p-1">×</button>
              </div>

              {/* scrollable content */}
              <div className="overflow-y-auto px-5 pb-8 pt-4 space-y-5" style={{ maxHeight: 'calc(80vh - 80px)' }}>

                {/* 健康作用 */}
                <section>
                  <div className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">
                    {locale === 'zh' ? '为什么要吃' : 'Why it matters'}
                  </div>
                  <ul className="space-y-2">
                    {info.benefits.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-green-400 mt-0.5 shrink-0">✦</span>
                        <span>{locale === 'zh' ? b.zh : b.en}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* 推荐食物 */}
                <section>
                  <div className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">
                    {locale === 'zh' ? '推荐食物' : 'Recommended foods'}
                  </div>
                  <div className="space-y-1.5">
                    {info.foods.map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm bg-green-50 rounded-xl px-3 py-2">
                        <span className="text-green-500 shrink-0 mt-0.5">→</span>
                        <span className="text-gray-700">{locale === 'zh' ? f.zh : f.en}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 科学小贴士 */}
                <section className="bg-amber-50 rounded-2xl px-4 py-3">
                  <div className="text-xs font-semibold text-amber-700 mb-1">
                    💡 {locale === 'zh' ? '科学小贴士' : 'Science tip'}
                  </div>
                  <p className="text-sm text-amber-800 leading-relaxed">
                    {locale === 'zh' ? info.tip.zh : info.tip.en}
                  </p>
                </section>

              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function AdvancedRow({ label, consumed, limit, status, unit = 'g' }: {
  label: string; consumed: number; limit: string;
  status: 'good' | 'warning' | 'danger'; unit?: string;
}) {
  const { locale } = useLocale();
  const statusColors = { good: 'text-green-600', warning: 'text-amber-500', danger: 'text-red-500' };
  const statusIcons = { good: '✓', warning: '⚠', danger: '✗' };

  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-gray-800">{consumed}{localizeUnit(unit, locale)}</span>
        <span className="text-gray-400 text-xs">{localizeServingLabel(limit, locale)}</span>
        <span className={statusColors[status]}>{statusIcons[status]}</span>
      </div>
    </div>
  );
}
