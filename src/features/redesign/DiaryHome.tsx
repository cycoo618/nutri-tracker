import React from 'react';
import type { UserProfile } from '../../types/user';
import type { DailyLog, MealItem } from '../../types/log';
import { MEAL_LABELS, MEAL_ICONS } from '../../types/log';
import type { NutritionStatus } from '../../hooks/useNutrition';
import type { SyncStatus } from '../../hooks/useFoodLog';
import { Bar } from './shared/Bar';
import { RotatingBanner } from './shared/RotatingBanner';
import { FOOD_GROUPS } from './tokens';
import { computeCoveredGroups } from '../../utils/foodGroupCoverage';

interface DiaryHomeProps {
  profile: UserProfile;
  dailyLog: DailyLog | null;
  nutritionStatus: NutritionStatus | null;
  currentDate: string;
  onDateChange: (date: string) => void;
  onNav: (tab: string) => void;
  onOpenAdd: (mealType?: string) => void;
  onRemoveFood?: (itemId: string) => Promise<void>;
  onEditFood?: (item: MealItem) => void;
  syncStatus?: SyncStatus;
  syncError?: string | null;
  onForceSync?: () => Promise<void>;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6)  return '夜深了';
  if (h < 11) return '早安';
  if (h < 14) return '午安';
  if (h < 18) return '下午好';
  return '晚上好';
}

function formatDateCompact(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = weekdays[d.getDay()];
  return `${month}月${day}日 周${weekday}`;
}

function getDayNumber(dateStr: string, createdAt: string): number {
  const start = new Date(createdAt).getTime();
  const now = new Date(dateStr + 'T00:00:00').getTime();
  return Math.max(1, Math.floor((now - start) / 86400000) + 1);
}

function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function offsetDate(dateStr: string, delta: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return toLocalDateString(d);
}

function getTodayString(): string {
  return toLocalDateString(new Date());
}

/** 宏量综合得分 0-100 */
function calcMacroScore(ns: NutritionStatus | null): number {
  if (!ns) return 0;
  const s = (consumed: number, target: number) => {
    const pct = target > 0 ? consumed / target : 0;
    if (pct <= 0) return 0;
    if (pct <= 0.9) return Math.round(pct / 0.9 * 100);
    if (pct <= 1.1) return 100;
    return Math.max(0, Math.round(100 - (pct - 1.1) * 150));
  };
  return Math.min(100, Math.round(
    s(ns.macros.protein.consumed, ns.macros.protein.target) * 0.3 +
    s(ns.macros.carbs.consumed, ns.macros.carbs.target) * 0.25 +
    s(ns.macros.fat.consumed, ns.macros.fat.target) * 0.25 +
    s(ns.fiber.consumed, ns.fiber.target) * 0.2
  ));
}

/** 生成宏量简短描述，如"碳水偏多 · 蛋白偏少" */
function macroSummary(ns: NutritionStatus | null): string {
  if (!ns) return '暂无记录';
  const over = [
    ns.macros.carbs.target > 0 && ns.macros.carbs.consumed / ns.macros.carbs.target > 1.15 ? '碳水偏多' : '',
    ns.macros.fat.target > 0 && ns.macros.fat.consumed / ns.macros.fat.target > 1.15 ? '脂肪偏多' : '',
    ns.macros.protein.target > 0 && ns.macros.protein.consumed / ns.macros.protein.target > 1.15 ? '蛋白偏多' : '',
  ].filter(Boolean);
  const under = [
    ns.macros.protein.target > 0 && ns.macros.protein.consumed / ns.macros.protein.target < 0.6 ? '蛋白偏少' : '',
    ns.macros.fat.target > 0 && ns.macros.fat.consumed / ns.macros.fat.target < 0.5 ? '脂肪偏少' : '',
    ns.fiber.target > 0 && ns.fiber.consumed / ns.fiber.target < 0.5 ? '纤维偏少' : '',
  ].filter(Boolean);
  const parts = [...over, ...under];
  return parts.length > 0 ? parts.slice(0, 2).join(' · ') : '宏量均衡';
}

/** 多样性小 nudge 文字 */
function diversityNudge(doneCount: number): string {
  if (doneCount >= 7) return '今日全部达成 🎉';
  if (doneCount >= 5) return `再加 ${7 - doneCount} 类更稳`;
  if (doneCount >= 3) return `加 ${7 - doneCount} 类更稳`;
  return `加 ${7 - doneCount} 类更稳`;
}

function GoalChip({ goalKey }: { goalKey: string }) {
  const map: Record<string, { emoji: string; label: string; color: string; bg: string; border: string }> = {
    fat_loss:          { emoji: '🔥', label: '减脂',  color: 'var(--tomato)', bg: 'rgba(255,107,87,0.1)', border: 'rgba(255,107,87,0.25)' },
    anti_inflammatory: { emoji: '🫒', label: '抗炎',  color: 'var(--moss)',   bg: 'rgba(45,110,64,0.1)', border: 'rgba(45,110,64,0.25)' },
    muscle_gain:       { emoji: '💪', label: '增肌',  color: 'var(--mustard)',bg: 'rgba(244,181,54,0.1)', border: 'rgba(244,181,54,0.25)' },
    blood_sugar:       { emoji: '🩸', label: '控血糖', color: 'var(--plum)',   bg: 'rgba(212,93,127,0.1)', border: 'rgba(212,93,127,0.25)' },
  };
  const info = map[goalKey];
  if (!info) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '3px 8px', borderRadius: 999,
      background: info.bg, border: `1px solid ${info.border}`,
      fontSize: 11, color: info.color, fontWeight: 600,
    }}>
      {info.emoji} {info.label}
    </span>
  );
}

export function DiaryHome({ profile, dailyLog, nutritionStatus, currentDate, onDateChange, onNav, onOpenAdd, onRemoveFood, onEditFood, syncStatus, syncError, onForceSync }: DiaryHomeProps) {
  const today = getTodayString();
  const isToday = currentDate === today;
  const dayNum = getDayNumber(currentDate, profile.createdAt);
  const name = profile.displayName?.split(' ')[0] || '朋友';

  const calorieTarget = nutritionStatus?.targetCalories ?? profile.targetCalories ?? 2000;
  const calorieRecorded = nutritionStatus?.consumedCalories ?? dailyLog?.totalCalories ?? 0;
  const calorieRemain = Math.max(0, calorieTarget - calorieRecorded);
  const caloriePct = Math.min(calorieRecorded / calorieTarget, 1);

  const goals = profile.goals ?? [profile.goal];
  const coveredGroups = computeCoveredGroups(dailyLog);
  const doneCount = FOOD_GROUPS.filter(g => coveredGroups.has(g.key)).length;
  const score = calcMacroScore(nutritionStatus);
  const summary = macroSummary(nutritionStatus);
  const nudge = diversityNudge(doneCount);

  return (
    <div style={{ padding: '0 0 8px' }}>
      {/* Top row: greeting + goal chips + sync */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 20px' }}>
        <span className="nt-caveat" style={{ fontSize: 16, color: 'var(--ink)' }}>
          {getGreeting()}, <span style={{ color: 'var(--ink-mute)' }}>{name}</span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {goals.slice(0, 2).map(g => <GoalChip key={g} goalKey={g} />)}
          {onForceSync && (
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
          )}
          <button
            onClick={() => onNav('pantry')}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(255,255,255,0.6)', border: '1px solid var(--line-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, color: 'var(--ink-soft)', cursor: 'pointer',
            }}
          >📦</button>
        </div>
      </div>

      {/* Sync error banner */}
      {syncError && (
        <div style={{ margin: '0 16px 6px', padding: '8px 14px', borderRadius: 10, background: 'rgba(220,80,60,0.08)', border: '1px solid rgba(220,80,60,0.18)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13 }}>⚠️</span>
          <span className="nt-serif" style={{ fontSize: 12, color: 'var(--tomato)', flex: 1 }}>{syncError}</span>
          {onForceSync && (
            <button onClick={onForceSync} className="nt-serif" style={{ fontSize: 11, color: 'var(--tomato)', background: 'none', border: '1px solid rgba(220,80,60,0.3)', borderRadius: 999, padding: '2px 8px', cursor: 'pointer' }}>
              重试
            </button>
          )}
        </div>
      )}

      {/* Date — compact single row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 20px 6px' }}>
        <button
          onClick={() => onDateChange(offsetDate(currentDate, -1))}
          style={{
            width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
            background: 'transparent', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, color: 'var(--ink-soft)', cursor: 'pointer',
          }}
        >‹</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
          <span className="nt-serif" style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>
            {formatDateCompact(currentDate)}
          </span>
          <span className="nt-serif" style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
            · 第 {dayNum} 天
          </span>
          {isToday ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '2px 7px', borderRadius: 999,
              background: 'rgba(79,166,99,0.12)', border: '1px solid rgba(79,166,99,0.25)',
              fontSize: 10, color: 'var(--sage)', fontWeight: 600,
            }}>
              <span className="nt-pulse" style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: 'var(--sage)' }} />
              今日
            </span>
          ) : (
            <button
              onClick={() => onDateChange(today)}
              style={{
                padding: '2px 8px', borderRadius: 999,
                background: 'var(--ink)', color: '#fff',
                fontSize: 10, border: 'none', cursor: 'pointer',
              }}
            >↩ 今日</button>
          )}
        </div>

        <button
          onClick={() => onDateChange(offsetDate(currentDate, 1))}
          disabled={isToday}
          style={{
            width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
            background: 'transparent', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, color: isToday ? 'var(--ink-faint)' : 'var(--ink-soft)',
            cursor: isToday ? 'default' : 'pointer',
          }}
        >›</button>
      </div>

      {/* Calorie hero card */}
      <div className="nt-card" style={{ margin: '2px 16px', padding: '16px 18px 14px' }}>
        <div className="nt-serif" style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 6 }}>
          <span className="nt-mark">还能吃</span>
        </div>
        {/* Two-column: big number left, stats right */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span className="nt-display" style={{ fontSize: 56, color: 'var(--tomato)', lineHeight: 1 }}>
                {calorieRemain.toLocaleString()}
              </span>
              <span className="nt-serif" style={{ fontSize: 16, color: 'var(--ink-mute)' }}>千卡</span>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div className="nt-serif" style={{ fontSize: 11, color: 'var(--ink-mute)', lineHeight: 1.4 }}>
              已吃 {Math.round(calorieRecorded)} / {calorieTarget}
            </div>
            <div style={{ marginTop: 4, width: 80 }}>
              <Bar value={calorieRecorded} target={calorieTarget} color="var(--tomato)" height={4} />
            </div>
            <div className="nt-serif" style={{ fontSize: 11, color: 'var(--tomato)', marginTop: 3, fontWeight: 600 }}>
              {Math.round(caloriePct * 100)}%
            </div>
          </div>
        </div>
        <hr className="nt-hr-dash" style={{ margin: '12px 0 8px' }} />
        <RotatingBanner nutritionStatus={nutritionStatus} coveredGroups={coveredGroups} />
      </div>

      {/* Mini-stats row — both navigate to 今日明细 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '10px 16px' }}>

        {/* 宏量平衡 → MacrosScreen */}
        <div
          className="nt-card"
          onClick={() => onNav('macros')}
          style={{ padding: '12px 14px', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span className="nt-serif" style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)' }}>宏量平衡</span>
            <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>›</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 6 }}>
            <span className="nt-display" style={{ fontSize: 30, color: 'var(--mustard)', lineHeight: 1 }}>{score}</span>
            <span className="nt-serif" style={{ fontSize: 12, color: 'var(--ink-mute)' }}>分</span>
          </div>
          {/* 4 bars in a single horizontal row with small labels below */}
          <div style={{ display: 'flex', gap: 5, marginBottom: 7 }}>
            {[
              { label: '蛋白', v: nutritionStatus?.macros.protein.consumed ?? 0, t: nutritionStatus?.macros.protein.target ?? 60,  c: 'var(--sky)' },
              { label: '碳水', v: nutritionStatus?.macros.carbs.consumed ?? 0,   t: nutritionStatus?.macros.carbs.target ?? 250,   c: 'var(--grain)' },
              { label: '脂肪', v: nutritionStatus?.macros.fat.consumed ?? 0,     t: nutritionStatus?.macros.fat.target ?? 65,      c: 'var(--persimmon)' },
              { label: '纤维', v: nutritionStatus?.fiber.consumed ?? 0,          t: nutritionStatus?.fiber.target ?? 25,           c: 'var(--sage)' },
            ].map((item, i) => {
              const pct = item.t > 0 ? Math.min(item.v / item.t, 1) * 100 : 0;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ height: 8, borderRadius: 999, background: 'var(--line-soft)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: item.c, borderRadius: 999, transition: 'width .3s' }} />
                  </div>
                  <span style={{ fontSize: 8, color: item.c, textAlign: 'center', fontFamily: 'Noto Serif SC, serif', lineHeight: 1 }}>{item.label}</span>
                </div>
              );
            })}
          </div>
          <div className="nt-serif" style={{ fontSize: 10, color: 'var(--tomato)', lineHeight: 1.3 }}>
            {summary}
          </div>
        </div>

        {/* 食物多样性 → MacrosScreen (今日明细) */}
        <div
          className="nt-card"
          onClick={() => onNav('macros')}
          style={{ padding: '12px 14px', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span className="nt-serif" style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)' }}>食物多样性</span>
            <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>›</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 8 }}>
            <span className="nt-display" style={{ fontSize: 30, color: 'var(--sage)', lineHeight: 1 }}>{doneCount}</span>
            <span className="nt-serif" style={{ fontSize: 16, color: 'var(--ink-mute)' }}>/7</span>
          </div>
          {/* 单行 emoji chips，吃了的 highlight，没吃的 grey */}
          <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
            {FOOD_GROUPS.map(g => {
              const done = coveredGroups.has(g.key);
              return (
                <div
                  key={g.key}
                  style={{
                    flex: 1, height: 22, borderRadius: 5,
                    background: done ? g.color + '30' : 'var(--paper-2)',
                    border: `1px solid ${done ? g.color + '60' : 'var(--line-soft)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11,
                    filter: done ? 'none' : 'grayscale(1) opacity(0.4)',
                  }}
                >
                  {g.emoji}
                </div>
              );
            })}
          </div>
          <div className="nt-serif" style={{ fontSize: 10, color: 'var(--sage)', fontWeight: 600 }}>
            {nudge}
          </div>
        </div>
      </div>

      {/* Today's Notes timeline */}
      <div style={{ padding: '4px 16px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
          <span className="nt-serif" style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>今日笔记</span>
          <span className="nt-caveat" style={{ fontSize: 14, color: 'var(--ink-mute)' }}>today's pages</span>
          {dailyLog && (
            <span className="nt-caveat" style={{ fontSize: 12, color: 'var(--ink-mute)', marginLeft: 'auto' }}>
              {Math.round(calorieRecorded)} kcal
            </span>
          )}
        </div>

        <div style={{ position: 'relative', paddingLeft: 52 }}>
          {/* Dashed rail */}
          <div style={{
            position: 'absolute', left: 36, top: 0, bottom: 0, width: 1,
            background: 'repeating-linear-gradient(180deg, var(--line) 0 6px, transparent 6px 12px)',
          }} />

          {(dailyLog?.meals ?? []).map(meal => {
            const mealLabel = MEAL_LABELS[meal.type];
            const mealIcon = MEAL_ICONS[meal.type];
            const mealCal = meal.items.reduce((s, i) => s + i.calories, 0);
            const isEmpty = meal.items.length === 0;

            return (
              <div key={meal.type} style={{ marginBottom: 18, position: 'relative' }}>
                {/* Circle chip */}
                <div style={{
                  position: 'absolute', left: -52, width: 28, height: 28,
                  borderRadius: '50%',
                  background: isEmpty ? 'var(--card)' : 'var(--ink)',
                  border: `1px solid ${isEmpty ? 'var(--line-soft)' : 'var(--ink)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, top: 2,
                }}>
                  {mealIcon}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span className="nt-serif" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{mealLabel}</span>
                  {mealCal > 0 && (
                    <span className="nt-caveat" style={{ fontSize: 13, color: 'var(--ink-mute)' }}>{mealCal} kcal</span>
                  )}
                </div>

                {isEmpty ? (
                  <button
                    onClick={() => onOpenAdd(meal.type)}
                    className="nt-serif"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 14px', borderRadius: 10,
                      border: '1.5px dashed var(--line)',
                      background: 'transparent',
                      fontSize: 12, color: 'var(--ink-mute)', cursor: 'pointer', width: '100%',
                    }}
                  >
                    <span style={{ fontSize: 16 }}>＋</span> 记一笔
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 2 }}>
                    {meal.items.map(item => (
                      <div
                        key={item.id}
                        onClick={() => onEditFood?.(item)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderRadius: 8, padding: '2px 4px', margin: '0 -4px', cursor: onEditFood ? 'pointer' : 'default', minHeight: 32 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                          <span className="nt-serif" style={{ fontSize: 12, color: 'var(--ink-soft)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.foodName}
                          </span>
                          <span className="nt-caveat" style={{ fontSize: 11, color: 'var(--ink-faint)', flexShrink: 0 }}>
                            {item.unit} · {item.calories} kcal
                          </span>
                        </div>
                        {onRemoveFood && (
                          <button
                            onMouseDown={e => e.preventDefault()}
                            onTouchEnd={e => { e.preventDefault(); e.stopPropagation(); onRemoveFood(item.id); }}
                            onClick={e => { e.stopPropagation(); onRemoveFood(item.id); }}
                            style={{
                              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                              background: 'var(--paper)', border: '1px solid var(--line-soft)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 12, color: 'var(--ink-mute)', cursor: 'pointer', lineHeight: 1,
                            }}
                          >×</button>
                        )}
                      </div>
                    ))}
                    {/* 非空餐次追加按钮 */}
                    <button
                      onClick={() => onOpenAdd(meal.type)}
                      className="nt-serif"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        marginTop: 4, padding: '5px 10px', borderRadius: 8,
                        border: '1px dashed var(--line-soft)',
                        background: 'transparent',
                        fontSize: 11, color: 'var(--ink-mute)', cursor: 'pointer',
                        alignSelf: 'flex-start',
                      }}
                    >
                      ＋ 再记一笔
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 今日食物贡献 */}
        {(() => {
          const allItems = dailyLog?.meals.flatMap(m => m.items) ?? [];
          if (allItems.length < 2) return null;
          type NutrKey = 'protein' | 'carbs' | 'fat' | 'fiber';
          const rows: { key: NutrKey | 'sugar' | 'sodium'; label: string; color: string; unit: string }[] = [
            { key: 'protein', label: '蛋白质', color: 'var(--sky)',       unit: 'g'  },
            { key: 'carbs',   label: '碳水',   color: 'var(--grain)',     unit: 'g'  },
            { key: 'fat',     label: '脂肪',   color: 'var(--persimmon)', unit: 'g'  },
            { key: 'fiber',   label: '纤维',   color: 'var(--sage)',      unit: 'g'  },
            { key: 'sugar',   label: '糖分',   color: 'var(--tomato)',    unit: 'g'  },
            { key: 'sodium',  label: '钠',     color: 'var(--mustard)',   unit: 'mg' },
          ];
          const activeRows = rows.filter(r => allItems.some(i => ((i.nutrition as unknown as Record<string, number>)[r.key] ?? 0) > 0));
          if (!activeRows.length) return null;
          return (
            <div style={{ padding: '0 16px', marginTop: 12 }}>
              <div className="nt-card" style={{ padding: '14px 16px' }}>
                <div className="nt-serif" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>今日食物贡献</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {activeRows.map(r => {
                    const vals = allItems.map(i => ({ name: i.foodName, v: (i.nutrition as unknown as Record<string, number>)[r.key] ?? 0 }));
                    const total = vals.reduce((s, x) => s + x.v, 0);
                    if (total <= 0) return null;
                    const top = vals.reduce((a, b) => b.v > a.v ? b : a);
                    const pct = Math.round((top.v / total) * 100);
                    const name = top.name.length > 7 ? top.name.slice(0, 7) + '…' : top.name;
                    return (
                      <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                        <span className="nt-serif" style={{ fontSize: 11, color: 'var(--ink-mute)', width: 38, flexShrink: 0 }}>{r.label}</span>
                        <div style={{ flex: 1, height: 4, borderRadius: 999, background: 'var(--line-soft)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: r.color, borderRadius: 999 }} />
                        </div>
                        <span className="nt-caveat" style={{ fontSize: 11, color: 'var(--ink-soft)', flexShrink: 0, minWidth: 90, textAlign: 'right' }}>
                          {name} {Math.round(top.v)}{r.unit}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
