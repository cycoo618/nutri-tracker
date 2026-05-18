import React, { useState } from 'react';
import type { UserProfile } from '../../types/user';
import type { DailyLog } from '../../types/log';
import { MEAL_LABELS, MEAL_ICONS } from '../../types/log';
import type { NutritionStatus } from '../../hooks/useNutrition';
import { Bar } from './shared/Bar';
import { RotatingBanner } from './shared/RotatingBanner';
import { FOOD_GROUPS } from './tokens';

interface DiaryHomeProps {
  profile: UserProfile;
  dailyLog: DailyLog | null;
  nutritionStatus: NutritionStatus | null;
  currentDate: string;
  onDateChange: (date: string) => void;
  onNav: (tab: string) => void;
  onOpenAdd: () => void;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6)  return '夜深了';
  if (h < 11) return '早安';
  if (h < 14) return '午安';
  if (h < 18) return '下午好';
  return '晚上好';
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = weekdays[d.getDay()];
  return { month, day, weekday };
}

function getDayNumber(dateStr: string, createdAt: string): number {
  const start = new Date(createdAt).getTime();
  const now = new Date(dateStr + 'T00:00:00').getTime();
  return Math.max(1, Math.floor((now - start) / 86400000) + 1);
}

function offsetDate(dateStr: string, delta: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

type ExpandedPanel = 'macro' | 'diversity' | null;

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

export function DiaryHome({ profile, dailyLog, nutritionStatus, currentDate, onDateChange, onNav, onOpenAdd }: DiaryHomeProps) {
  const [expanded, setExpanded] = useState<ExpandedPanel>(null);
  const today = getTodayString();
  const isToday = currentDate === today;
  const { month, day, weekday } = formatDate(currentDate);
  const dayNum = getDayNumber(currentDate, profile.createdAt);
  const name = profile.displayName?.split(' ')[0] || '朋友';

  const calorieTarget = nutritionStatus?.targetCalories ?? profile.targetCalories ?? 2000;
  const calorieRecorded = nutritionStatus?.consumedCalories ?? dailyLog?.totalCalories ?? 0;
  const calorieRemain = Math.max(0, calorieTarget - calorieRecorded);
  const caloriePct = Math.min(calorieRecorded / calorieTarget, 1);

  const goals = profile.goals ?? [profile.goal];
  const doneCount = FOOD_GROUPS.filter(g => g.done).length;

  return (
    <div style={{ padding: '0 0 8px' }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 22px' }}>
        <span className="nt-caveat" style={{ fontSize: 16, color: 'var(--ink)' }}>
          {getGreeting()}, <span style={{ color: 'var(--ink-mute)' }}>{name}</span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {goals.slice(0, 2).map(g => <GoalChip key={g} goalKey={g} />)}
          <button
            onClick={() => onNav('pantry')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 9px', borderRadius: 999,
              background: 'rgba(255,255,255,0.6)', border: '1px solid var(--line-soft)',
              fontSize: 11, color: 'var(--ink-soft)', fontWeight: 500, cursor: 'pointer',
            }}
          >
            📦 食材
          </button>
        </div>
      </div>

      {/* Date hero */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 22px 8px' }}>
        <button
          onClick={() => onDateChange(offsetDate(currentDate, -1))}
          style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--card)', border: '1px solid var(--line-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, color: 'var(--ink-soft)', cursor: 'pointer',
          }}
        >‹</button>

        <div style={{ flex: 1 }}>
          <div className="nt-display" style={{ fontSize: 30, color: 'var(--ink)', lineHeight: 1.1 }}>
            {month} 月 {day} 日
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <span className="nt-serif" style={{ fontSize: 12, color: 'var(--ink-mute)' }}>
              周{weekday} · 第 {dayNum} 天
            </span>
            {isToday ? (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '2px 8px', borderRadius: 999,
                background: 'rgba(79,166,99,0.12)', border: '1px solid rgba(79,166,99,0.25)',
                fontSize: 11, color: 'var(--sage)', fontWeight: 600,
              }}>
                <span className="nt-pulse" style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--sage)' }} />
                今日
              </span>
            ) : (
              <button
                onClick={() => onDateChange(today)}
                style={{
                  padding: '2px 10px', borderRadius: 999,
                  background: 'var(--ink)', color: '#fff',
                  fontSize: 11, border: 'none', cursor: 'pointer',
                }}
              >
                ↩ 回到今天
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => onDateChange(offsetDate(currentDate, 1))}
          disabled={isToday}
          style={{
            width: 28, height: 28, borderRadius: '50%',
            background: isToday ? 'transparent' : 'var(--card)',
            border: isToday ? '1px solid transparent' : '1px solid var(--line-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, color: isToday ? 'var(--ink-faint)' : 'var(--ink-soft)', cursor: isToday ? 'default' : 'pointer',
          }}
        >›</button>
      </div>

      {/* Calorie hero card */}
      <div className="nt-card" style={{ margin: '4px 16px', padding: '20px 22px' }}>
        <div className="nt-serif" style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 4 }}>
          <span className="nt-mark">还能吃</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span className="nt-display" style={{ fontSize: 72, color: 'var(--tomato)', lineHeight: 1 }}>
            {calorieRemain.toLocaleString()}
          </span>
          <span className="nt-serif" style={{ fontSize: 18, color: 'var(--ink-mute)' }}>千卡</span>
        </div>
        <div className="nt-serif" style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 4 }}>
          已记录 {Math.round(calorieRecorded)} / {calorieTarget} kcal · {Math.round(caloriePct * 100)}%
        </div>
        <div style={{ marginTop: 10 }}>
          <Bar value={calorieRecorded} target={calorieTarget} color="var(--tomato)" height={5} />
        </div>
        <hr className="nt-hr-dash" style={{ margin: '14px 0 8px' }} />
        <RotatingBanner />
      </div>

      {/* Mini-stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '10px 16px' }}>
        {/* Macro Balance */}
        <div>
          <div
            className="nt-card"
            onClick={() => setExpanded(expanded === 'macro' ? null : 'macro')}
            style={{ padding: '14px 16px', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span className="nt-serif" style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>宏量手账</span>
              <span className="nt-display" style={{ fontSize: 18, color: 'var(--sage)', marginLeft: 'auto' }}>73<span className="nt-serif" style={{ fontSize: 10, color: 'var(--ink-mute)' }}>分</span></span>
            </div>
            {/* Preview: 4 tiny bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { label: '蛋白', v: nutritionStatus?.macros.protein.consumed ?? 0, t: nutritionStatus?.macros.protein.target ?? 60, c: 'var(--sky)' },
                { label: '碳水', v: nutritionStatus?.macros.carbs.consumed ?? 0, t: nutritionStatus?.macros.carbs.target ?? 250, c: 'var(--grain)' },
                { label: '脂肪', v: nutritionStatus?.macros.fat.consumed ?? 0, t: nutritionStatus?.macros.fat.target ?? 65, c: 'var(--persimmon)' },
                { label: '纤维', v: nutritionStatus?.fiber.consumed ?? 0, t: nutritionStatus?.fiber.target ?? 25, c: 'var(--sage)' },
              ].map(item => (
                <div key={item.label}>
                  <Bar value={item.v} target={item.t} color={item.c} height={4} />
                </div>
              ))}
            </div>
          </div>

          {expanded === 'macro' && (
            <div className="nt-card" style={{ marginTop: 6, padding: '14px 16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: '蛋白质', v: nutritionStatus?.macros.protein.consumed ?? 0, t: nutritionStatus?.macros.protein.target ?? 60, c: 'var(--sky)', unit: 'g' },
                  { label: '碳水化合物', v: nutritionStatus?.macros.carbs.consumed ?? 0, t: nutritionStatus?.macros.carbs.target ?? 250, c: 'var(--grain)', unit: 'g' },
                  { label: '脂肪', v: nutritionStatus?.macros.fat.consumed ?? 0, t: nutritionStatus?.macros.fat.target ?? 65, c: 'var(--persimmon)', unit: 'g' },
                  { label: '膳食纤维', v: nutritionStatus?.fiber.consumed ?? 0, t: nutritionStatus?.fiber.target ?? 25, c: 'var(--sage)', unit: 'g' },
                ].map(item => (
                  <div key={item.label} style={{ background: 'var(--paper)', borderRadius: 10, padding: '10px 12px' }}>
                    <div className="nt-serif" style={{ fontSize: 10, color: 'var(--ink-mute)' }}>{item.label}</div>
                    <div className="nt-display" style={{ fontSize: 20, color: item.c }}>
                      {Math.round(item.v)}<span style={{ fontSize: 11, color: 'var(--ink-mute)' }}> / {item.t}{item.unit}</span>
                    </div>
                    <Bar value={item.v} target={item.t} color={item.c} height={3} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Food Diversity */}
        <div>
          <div
            className="nt-card"
            onClick={() => setExpanded(expanded === 'diversity' ? null : 'diversity')}
            style={{ padding: '14px 16px', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span className="nt-serif" style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>食物多样性</span>
              <span className="nt-display" style={{ fontSize: 18, color: 'var(--sage)', marginLeft: 'auto' }}>{doneCount}<span className="nt-serif" style={{ fontSize: 10, color: 'var(--ink-mute)' }}>/7</span></span>
            </div>
            {/* Preview: 7 emoji squares */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {FOOD_GROUPS.map(g => (
                <div
                  key={g.key}
                  style={{
                    width: 26, height: 26, borderRadius: 6,
                    background: g.done ? g.color + '22' : 'var(--paper)',
                    border: `1px solid ${g.done ? g.color + '55' : 'var(--line-soft)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14,
                    filter: g.done ? 'none' : 'grayscale(1) opacity(0.5)',
                  }}
                >
                  {g.emoji}
                </div>
              ))}
            </div>
            <div className="nt-serif" style={{ fontSize: 11, color: 'var(--sage)', marginTop: 6 }}>
              {doneCount}/7 类 今日已达
            </div>
          </div>

          {expanded === 'diversity' && (
            <div className="nt-card" style={{ marginTop: 6, padding: '14px 16px' }}>
              {FOOD_GROUPS.map(g => (
                <div key={g.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: g.color + '22', border: `1px solid ${g.color}55`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                  }}>
                    {g.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="nt-serif" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{g.name}</span>
                      <span className="nt-serif" style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{g.v}/{g.t}</span>
                    </div>
                    <Bar value={g.v} target={g.t} color={g.color} height={4} />
                  </div>
                </div>
              ))}
              <div style={{ textAlign: 'center', marginTop: 4 }}>
                <button
                  onClick={() => onNav('diversity')}
                  className="nt-serif"
                  style={{ fontSize: 12, color: 'var(--sage)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  查看全部 →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Today's Notes timeline */}
      <div style={{ padding: '4px 16px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
          <span className="nt-serif" style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>今日笔记</span>
          <span className="nt-caveat" style={{ fontSize: 14, color: 'var(--ink-mute)' }}>today's pages</span>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="nt-serif" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{mealLabel}</span>
                    {mealCal > 0 && (
                      <span className="nt-caveat" style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
                        {meal.type === 'breakfast' ? '08:20' : meal.type === 'lunch' ? '12:45' : meal.type === 'dinner' ? '18:30' : '15:00'}
                      </span>
                    )}
                  </div>
                  {mealCal > 0 && (
                    <span className="nt-caveat" style={{ fontSize: 13, color: 'var(--ink-mute)' }}>{mealCal} kcal</span>
                  )}
                </div>

                {isEmpty ? (
                  <button
                    onClick={onOpenAdd}
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
                  <div className="nt-serif" style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
                    {meal.items.map((item, idx) => (
                      <span key={item.id}>
                        {item.foodName}
                        {idx < meal.items.length - 1 ? '、' : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
