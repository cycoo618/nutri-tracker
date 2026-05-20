import React, { useState, useEffect } from 'react';
import { Bar } from './shared/Bar';
import { FOOD_GROUPS } from './tokens';
import type { UserProfile } from '../../types/user';
import type { DailyLog } from '../../types/log';
import { getDailyLogs } from '../../services/firestore';
import { computeCoveredGroups } from '../../utils/foodGroupCoverage';

type Period = '7天' | '30天' | '年';

// Heat types
type DotHeat = 'over' | 'normal' | 'low' | 'missing';
function getDotHeat(cal: number, targetCal: number): DotHeat {
  if (cal === 0) return 'missing';
  if (cal > targetCal * 1.2) return 'over';
  if (cal < targetCal * 0.7) return 'low';
  return 'normal';
}
const DOT_COLORS: Record<DotHeat, string> = {
  over: 'var(--tomato)',
  normal: 'var(--sage)',
  low: 'var(--mustard)',
  missing: 'var(--ink-faint)',
};

/** Format a Date as 'YYYY-MM-DD' */
function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Build an array of date strings from startDate to endDate inclusive */
function buildDateRange(startDate: Date, endDate: Date): string[] {
  const dates: string[] = [];
  const cur = new Date(startDate);
  while (cur <= endDate) {
    dates.push(fmtDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

/** Chinese weekday label (one char) for a date string */
function weekdayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
}

interface SevenDayScreenProps {
  profile?: UserProfile;
  targetCalories?: number;
}

export function SevenDayScreen({ profile, targetCalories }: SevenDayScreenProps = {}) {
  const [period, setPeriod] = useState<Period>('7天');
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(false);

  const targetCal = targetCalories ?? profile?.targetCalories ?? 2000;

  // Fetch logs whenever period or uid changes
  useEffect(() => {
    if (!profile?.uid) return;
    const days = period === '7天' ? 7 : period === '30天' ? 30 : 365;
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    const startStr = fmtDate(start);
    const endStr = fmtDate(end);
    setLoading(true);
    getDailyLogs(profile.uid, startStr, endStr)
      .then(fetched => setLogs(fetched))
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, [period, profile?.uid]);

  // Build allDates and logMap
  const days = period === '7天' ? 7 : period === '30天' ? 30 : 365;
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  const allDates = buildDateRange(start, end);
  const logMap = new Map<string, DailyLog>(logs.map(l => [l.date, l]));

  // Calories array
  const calories = allDates.map(d => logMap.get(d)?.totalCalories ?? 0);
  const hasData = calories.filter(c => c > 0).length;

  // Average (non-zero days only)
  const avgCal = hasData > 0
    ? Math.round(calories.filter(c => c > 0).reduce((a, b) => a + b, 0) / hasData)
    : 0;

  // Rhythm score: % of non-zero days within healthy range
  const rhythmScore = hasData > 0
    ? Math.round(
        (calories.filter(c => c > 0 && c >= targetCal * 0.7 && c <= targetCal * 1.2).length / hasData) * 100
      )
    : null;

  // Date range display
  const now = new Date();
  const weekNum = Math.ceil(now.getDate() / 7);
  const dateRange = `${start.getMonth() + 1}/${start.getDate()} – ${now.getMonth() + 1}/${now.getDate()}`;

  // SVG chart
  const chartW = 280;
  const chartH = 80;
  const maxCal = Math.max(...calories, targetCal) * 1.1 || targetCal * 1.1;
  const n = allDates.length;

  // x-axis labels
  const getXLabels = (): string[] => {
    if (period === '7天') return allDates.map(d => weekdayLabel(d));
    if (period === '30天') return allDates.map(d => String(new Date(d).getDate()));
    // 年: show month names
    const monthLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return allDates.map(d => monthLabels[new Date(d).getMonth()]);
  };
  const xLabels = getXLabels();

  // For sparse data, only show a subset of labels to avoid crowding
  const shouldShowLabel = (i: number): boolean => {
    if (period === '7天') return true;
    if (period === '30天') return i % 5 === 0 || i === n - 1;
    // year: show first of each month
    const date = allDates[i];
    return new Date(date).getDate() === 1 || i === 0 || i === n - 1;
  };

  const ptX = (i: number) => (n === 1 ? chartW / 2 : (i / (n - 1)) * chartW);
  const ptY = (c: number) => chartH - (c / maxCal) * chartH;

  const points = calories.map((c, i) => `${ptX(i)},${ptY(c)}`).join(' ');
  const targetY = ptY(targetCal);
  const avgY = ptY(avgCal);

  // Last 7 dots (always last 7 days for the hero card)
  const last7Dates = allDates.slice(-7);
  const last7Cals = last7Dates.map(d => logMap.get(d)?.totalCalories ?? 0);
  const last7Labels = last7Dates.map(d => weekdayLabel(d));

  // Heatmap — always last 7 days
  const heatmapDates = allDates.slice(-7);
  const heatmapLogs = heatmapDates.map(d => logMap.get(d) ?? null);

  return (
    <div style={{ padding: '8px 0 8px' }}>
      {/* Header */}
      <div style={{ padding: '8px 22px' }}>
        <div className="nt-serif" style={{ fontSize: 11, letterSpacing: 2, color: 'var(--ink-mute)', textTransform: 'uppercase' }}>
          WEEK · {weekNum}
        </div>
        <div className="nt-display" style={{ fontSize: 28, color: 'var(--ink)', marginTop: 2 }}>这一周</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <span className="nt-serif" style={{ fontSize: 12, color: 'var(--ink-mute)' }}>
            {dateRange}
            <span className="nt-caveat" style={{ marginLeft: 8, fontSize: 14 }}>let's review</span>
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['7天', '30天', '年'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="nt-serif"
                style={{
                  padding: '3px 10px', borderRadius: 999,
                  background: period === p ? 'var(--ink)' : 'transparent',
                  color: period === p ? '#fff' : 'var(--ink-mute)',
                  border: '1px solid var(--line-soft)',
                  fontSize: 11, cursor: 'pointer',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ornament divider */}
      <div style={{ textAlign: 'center', color: 'var(--ink-faint)', fontSize: 18, margin: '2px 0' }}>❦</div>
      <hr className="nt-hr-dash" style={{ margin: '0 22px 12px' }} />

      {/* No data placeholder */}
      {hasData < 2 && !loading && (
        <div className="nt-card" style={{ margin: '0 16px 12px', padding: '24px 20px', textAlign: 'center' }}>
          <div className="nt-display" style={{ fontSize: 22, color: 'var(--ink-soft)', marginBottom: 8 }}>暂无足够数据</div>
          <div className="nt-serif" style={{ fontSize: 13, color: 'var(--ink-mute)', lineHeight: 1.7 }}>
            {hasData === 0
              ? '开始记录饮食后，这里将展示你的趋势分析。'
              : `目前有 ${hasData} 天的记录，再多记几天就能看到完整趋势图表。`}
          </div>
        </div>
      )}

      {/* Rhythm score hero */}
      {hasData >= 2 && (
        <div className="nt-card" style={{ margin: '0 16px 12px', padding: '18px 20px' }}>
          <div className="nt-serif" style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
            <span className="nt-mark">节奏分</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
            <span className="nt-display" style={{ fontSize: 64, color: 'var(--ink)' }}>
              {rhythmScore !== null ? rhythmScore : '—'}
            </span>
            <div>
              <div className="nt-serif" style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 6, lineHeight: 1.5 }}>
                {hasData} 天记录 · 均 {avgCal} kcal/天
              </div>
            </div>
          </div>

          {/* 7 day dots */}
          <div style={{ display: 'flex', gap: 6, marginTop: 14, justifyContent: 'center' }}>
            {last7Cals.map((cal, i) => {
              const heat = getDotHeat(cal, targetCal);
              const isToday = i === last7Cals.length - 1;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: DOT_COLORS[heat],
                    border: isToday ? '2px solid var(--ink)' : '2px solid transparent',
                    opacity: isToday ? 1 : 0.75,
                  }} />
                  <span className="nt-serif" style={{ fontSize: 10, color: 'var(--ink-mute)' }}>{last7Labels[i]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Energy chart */}
      {hasData >= 2 && (
        <div className="nt-card" style={{ margin: '0 16px 12px', padding: '16px 18px' }}>
          <div className="nt-serif" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>热量走势</div>
          <div style={{ overflowX: 'auto' }}>
            <svg viewBox={`0 0 ${chartW} ${chartH + 20}`} style={{ width: '100%', minWidth: 240 }} preserveAspectRatio="none">
              <defs>
                <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--tomato)" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="var(--tomato)" stopOpacity="0.01" />
                </linearGradient>
              </defs>
              <polygon
                points={`${ptX(0)},${chartH} ${points} ${ptX(n - 1)},${chartH}`}
                fill="url(#calGrad)"
              />
              {/* Target line */}
              <line x1="0" y1={targetY} x2={chartW} y2={targetY} stroke="var(--tomato)" strokeWidth="1" strokeDasharray="4 3" />
              {/* Avg line */}
              {avgCal > 0 && (
                <line x1="0" y1={avgY} x2={chartW} y2={avgY} stroke="var(--sage)" strokeWidth="1" strokeDasharray="4 3" />
              )}
              {/* Polyline */}
              <polyline points={points} fill="none" stroke="var(--tomato)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              {/* Dots — only show for 7天 or small sets */}
              {n <= 30 && calories.map((_, i) => {
                const [cx, cy] = points.split(' ')[i].split(',').map(Number);
                const isLast = i === n - 1;
                return (
                  <circle
                    key={i}
                    cx={cx} cy={cy}
                    r={isLast ? 5 : 3}
                    fill={isLast ? 'var(--ink)' : 'var(--tomato)'}
                    stroke="#fff" strokeWidth={1.5}
                  />
                );
              })}
              {/* X labels */}
              {xLabels.map((label, i) => (
                shouldShowLabel(i) ? (
                  <text key={i} x={ptX(i)} y={chartH + 14} textAnchor="middle" fontSize="9" fill="var(--ink-mute)" fontFamily="'Noto Serif SC', serif">
                    {label}
                  </text>
                ) : null
              ))}
            </svg>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 16, height: 1.5, background: 'var(--tomato)', borderStyle: 'dashed', borderWidth: '0 0 1.5px' }} />
              <span className="nt-serif" style={{ fontSize: 10, color: 'var(--ink-mute)' }}>目标 {targetCal}</span>
            </div>
            {avgCal > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 16, height: 1.5, background: 'var(--sage)', borderStyle: 'dashed', borderWidth: '0 0 1.5px' }} />
                <span className="nt-serif" style={{ fontSize: 10, color: 'var(--ink-mute)' }}>均值 {avgCal}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Heatmap — always last 7 days */}
      <div className="nt-card" style={{ margin: '0 16px 12px', padding: '16px 18px' }}>
        <div className="nt-serif" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>
          七色 × 七日
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)', gap: 3 }}>
          {/* Header row */}
          <div />
          {heatmapDates.map((d, i) => (
            <div key={i} style={{
              textAlign: 'center', fontSize: 10,
              fontFamily: 'Noto Serif SC, serif',
              fontWeight: i === 6 ? 700 : 400,
              color: i === 6 ? 'var(--ink)' : 'var(--ink-mute)',
            }}>
              {weekdayLabel(d)}
            </div>
          ))}
          {/* Data rows */}
          {FOOD_GROUPS.map((g) => {
            const coveredByDay = heatmapLogs.map(log => {
              const covered = computeCoveredGroups(log);
              return covered.has(g.key) ? 1 : 0;
            });
            return (
              <React.Fragment key={g.key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 14 }}>{g.emoji}</span>
                  <span className="nt-serif" style={{ fontSize: 9, color: 'var(--ink-mute)' }}>{g.name}</span>
                </div>
                {coveredByDay.map((intensity, di) => (
                  <div
                    key={di}
                    style={{
                      height: 20, borderRadius: 4,
                      background: intensity > 0
                        ? `color-mix(in oklab, ${g.color} 70%, var(--paper-2))`
                        : 'var(--paper)',
                      border: di === 6 ? `1px solid var(--ink)` : '1px solid transparent',
                    }}
                  />
                ))}
              </React.Fragment>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
          <span className="nt-serif" style={{ fontSize: 10, color: 'var(--ink-faint)' }}>未覆盖</span>
          <div style={{ width: 14, height: 10, borderRadius: 3, background: 'var(--paper)', border: '1px solid var(--line-soft)' }} />
          <div style={{ width: 14, height: 10, borderRadius: 3, background: `color-mix(in oklab, var(--sage) 70%, var(--paper-2))` }} />
          <span className="nt-serif" style={{ fontSize: 10, color: 'var(--ink-faint)' }}>已覆盖</span>
        </div>
      </div>

      {/* Sparkline trio — real profile data only */}
      {(profile?.bodyMetrics?.weight || profile?.bodyMetrics?.bodyFat) && (
        <div className="nt-card" style={{ margin: '0 16px 12px', padding: '16px 18px' }}>
          <div className="nt-serif" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>身体指标</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              profile?.bodyMetrics?.weight
                ? { label: '体重', value: profile.bodyMetrics.weight, unit: 'kg', color: 'var(--sky)' }
                : null,
              profile?.bodyMetrics?.bodyFat
                ? { label: '体脂率', value: profile.bodyMetrics.bodyFat, unit: '%', color: 'var(--persimmon)' }
                : null,
            ].filter(Boolean).map(s => {
              const flatY = 12;
              const sp = Array.from({ length: 7 }, (_, i) => `${(i / 6) * 74},${flatY}`).join(' ');
              return (
                <div key={s!.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="nt-serif" style={{ fontSize: 12, color: 'var(--ink-mute)', width: 36 }}>{s!.label}</span>
                  <svg width={74} height={24} style={{ flexShrink: 0 }}>
                    <polyline points={sp} fill="none" stroke={s!.color} strokeWidth="1.5" strokeLinejoin="round" strokeDasharray="3 3" />
                  </svg>
                  <span className="nt-display" style={{ fontSize: 20, color: s!.color }}>
                    {s!.value}<span className="nt-serif" style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{s!.unit}</span>
                  </span>
                </div>
              );
            })}
          </div>
          <p className="nt-serif" style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 8, marginBottom: 0 }}>
            历史曲线将在多次记录后显示
          </p>
        </div>
      )}
    </div>
  );
}
