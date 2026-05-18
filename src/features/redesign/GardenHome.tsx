import React, { useState } from 'react';
import type { UserProfile } from '../../types/user';
import type { DailyLog } from '../../types/log';
import { MEAL_LABELS, MEAL_ICONS } from '../../types/log';
import type { NutritionStatus } from '../../hooks/useNutrition';
import { Bar } from './shared/Bar';
import { FOOD_GROUPS } from './tokens';

interface GardenHomeProps {
  profile: UserProfile;
  dailyLog: DailyLog | null;
  nutritionStatus: NutritionStatus | null;
  onOpenAdd: () => void;
  onNav: (tab: string) => void;
  onOpenGoalSheet?: () => void;
}

type PlotKey = string;

export function GardenHome({ profile, dailyLog, nutritionStatus, onOpenAdd, onNav, onOpenGoalSheet }: GardenHomeProps) {
  const [selectedPlot, setSelectedPlot] = useState<PlotKey | null>(null);

  const calorieTarget = nutritionStatus?.targetCalories ?? profile.targetCalories ?? 2000;
  const calorieRecorded = nutritionStatus?.consumedCalories ?? dailyLog?.totalCalories ?? 0;

  const doneGroups = FOOD_GROUPS.filter(g => g.done);
  const doneCount = doneGroups.length;

  // Streak mock
  const streak = 23;

  // Grid order for 4-col display
  const plotGroups = [...FOOD_GROUPS];

  const goals = profile.goals ?? [profile.goal];

  return (
    <div style={{ padding: '0 0 8px' }}>
      {/* Goal chips row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '6px 18px 0' }}>
        <button
          onClick={onOpenGoalSheet}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          }}
        >
          {goals.slice(0, 2).map(g => {
            const chipMap: Record<string, { emoji: string; label: string; color: string; bg: string; border: string }> = {
              fat_loss:          { emoji: '🔥', label: '减脂',  color: 'var(--tomato)', bg: 'rgba(255,107,87,0.1)', border: 'rgba(255,107,87,0.25)' },
              anti_inflammatory: { emoji: '🫒', label: '抗炎',  color: 'var(--moss)',   bg: 'rgba(45,110,64,0.1)', border: 'rgba(45,110,64,0.25)' },
              muscle_gain:       { emoji: '💪', label: '增肌',  color: 'var(--mustard)',bg: 'rgba(244,181,54,0.1)', border: 'rgba(244,181,54,0.25)' },
              blood_sugar:       { emoji: '🩸', label: '控血糖', color: 'var(--plum)',   bg: 'rgba(212,93,127,0.1)', border: 'rgba(212,93,127,0.25)' },
            };
            const info = chipMap[g];
            if (!info) return null;
            return (
              <span key={g} style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                padding: '3px 8px', borderRadius: 999,
                background: info.bg, border: `1px solid ${info.border}`,
                fontSize: 11, color: info.color, fontWeight: 600,
              }}>
                {info.emoji} {info.label}
              </span>
            );
          })}
          <span style={{ fontSize: 10, color: 'var(--ink-faint)' }}>✎</span>
        </button>
      </div>

      {/* Slim energy strip */}
      <div className="nt-card" style={{ margin: '8px 16px 8px', padding: '12px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span className="nt-serif" style={{ fontSize: 12, color: 'var(--ink-mute)' }}>能量</span>
              <span className="nt-caveat" style={{ fontSize: 13, color: 'var(--tomato)' }}>
                {Math.round(calorieRecorded)} / {calorieTarget} kcal
              </span>
            </div>
            <Bar value={calorieRecorded} target={calorieTarget} color="var(--tomato)" height={6} />
          </div>
          <button
            onClick={() => onNav('pantry')}
            style={{
              padding: '5px 12px', borderRadius: 999,
              background: 'var(--paper)', border: '1px solid var(--line-soft)',
              fontSize: 12, color: 'var(--ink-soft)', cursor: 'pointer',
            }}
          >
            📦 食材
          </button>
        </div>
      </div>

      {/* Garden hero card */}
      <div className="nt-card" style={{ margin: '8px 16px', padding: '18px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div className="nt-display" style={{ fontSize: 22, color: 'var(--ink)' }}>今日的菜园</div>
            <div className="nt-caveat" style={{ fontSize: 14, color: 'var(--ink-mute)' }}>
              {doneCount} of 7 grown today
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="nt-display" style={{ fontSize: 36, color: 'var(--sage)' }}>{doneCount}</span>
            <span className="nt-serif" style={{ fontSize: 14, color: 'var(--ink-mute)' }}>/7</span>
          </div>
        </div>

        {/* 4-column plot grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {plotGroups.map(g => {
            const isDone = !!g.done;
            const isSelected = selectedPlot === g.key;
            return (
              <div key={g.key}>
                <div
                  onClick={() => setSelectedPlot(isSelected ? null : g.key)}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 12,
                    background: isDone ? g.color + '22' : 'transparent',
                    border: isDone ? `1px solid ${g.color}55` : '1.5px dashed var(--line)',
                    backgroundImage: isDone ? 'none' : 'repeating-linear-gradient(-45deg, var(--line-soft) 0 2px, transparent 2px 8px)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 2, cursor: 'pointer',
                    filter: isDone ? 'none' : 'grayscale(0.8) opacity(0.6)',
                    outline: isSelected ? `2px solid var(--ink)` : 'none',
                    outlineOffset: 2,
                  }}
                >
                  <span style={{ fontSize: 22 }}>{g.emoji}</span>
                  <span className="nt-serif" style={{ fontSize: 9, color: isDone ? 'var(--ink-soft)' : 'var(--ink-mute)', textAlign: 'center' }}>
                    {g.name}
                  </span>
                </div>

                {isSelected && (
                  <div style={{
                    gridColumn: '1 / -1',
                    marginTop: 6,
                    background: 'var(--paper)',
                    borderRadius: 10,
                    padding: '10px 12px',
                    border: '1px solid var(--line-soft)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span className="nt-serif" style={{ fontSize: 12, fontWeight: 700 }}>{g.emoji} {g.name}</span>
                      <span className="nt-serif" style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{g.range}</span>
                    </div>
                    <Bar value={g.v} target={g.t} color={g.color} height={5} />
                    <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 4 }} className="nt-serif">
                      {g.v} / {g.t} {g.isCount ? '次' : 'g'}
                      {g.daysAgo > 0 && ` · 上次 ${g.daysAgo} 天前`}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's meals */}
      <div style={{ padding: '4px 16px' }}>
        <span className="nt-serif" style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>今日餐食</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {(dailyLog?.meals ?? []).map(meal => {
            const isEmpty = meal.items.length === 0;
            const mealCal = meal.items.reduce((s, i) => s + i.calories, 0);
            return (
              <div
                key={meal.type}
                className="nt-card"
                style={{
                  padding: '12px 16px',
                  border: isEmpty ? '1.5px dashed var(--line)' : undefined,
                  background: isEmpty ? 'transparent' : undefined,
                  boxShadow: isEmpty ? 'none' : undefined,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{MEAL_ICONS[meal.type]}</span>
                    <span className="nt-serif" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                      {MEAL_LABELS[meal.type]}
                    </span>
                  </div>
                  {isEmpty ? (
                    <button
                      onClick={onOpenAdd}
                      style={{
                        padding: '4px 12px', borderRadius: 999,
                        background: 'var(--paper)', border: '1px solid var(--line-soft)',
                        fontSize: 12, color: 'var(--ink-mute)', cursor: 'pointer',
                      }}
                    >
                      ＋
                    </button>
                  ) : (
                    <span className="nt-caveat" style={{ fontSize: 13, color: 'var(--ink-mute)' }}>{mealCal} kcal</span>
                  )}
                </div>
                {!isEmpty && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                    {meal.items.map(item => (
                      <span key={item.id} className="nt-chip" style={{ fontSize: 11 }}>
                        {item.foodName}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Streak banner */}
      <div style={{ margin: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span className="nt-display" style={{ fontSize: 22, color: '#fff' }}>{streak}</span>
        </div>
        <div>
          <div className="nt-serif" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
            连续 {streak} 天记录
          </div>
          <div className="nt-caveat" style={{ fontSize: 14, color: 'var(--sage)' }}>nice!</div>
        </div>
      </div>
    </div>
  );
}
