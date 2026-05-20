import React, { useState } from 'react';
import { Bar } from './shared/Bar';
import { FOOD_GROUPS } from './tokens';
import type { UserProfile } from '../../types/user';

type Period = '7天' | '30天' | '年';

// Mock data
const MOCK_DAYS = ['一', '二', '三', '四', '五', '六', '日'];
const MOCK_CALORIES = [1820, 2100, 1650, 1980, 2200, 1900, 1780];
const TARGET_CAL = 2000;
const AVG_CAL = Math.round(MOCK_CALORIES.reduce((a, b) => a + b, 0) / 7);

// Heat types
type DotHeat = 'over' | 'normal' | 'low' | 'missing';
function getDotHeat(cal: number): DotHeat {
  if (cal === 0) return 'missing';
  if (cal > TARGET_CAL * 1.15) return 'over';
  if (cal < TARGET_CAL * 0.75) return 'low';
  return 'normal';
}
const DOT_COLORS: Record<DotHeat, string> = {
  over: 'var(--tomato)',
  normal: 'var(--sage)',
  low: 'var(--mustard)',
  missing: 'var(--ink-faint)',
};

// 7-day heatmap mock data
const HEAT_INTENSITIES = [
  [0.9, 0.2, 0.8, 1.0, 0.5, 0.3, 0.7],
  [0.4, 0.0, 0.6, 0.9, 0.8, 1.0, 0.3],
  [1.0, 0.7, 0.5, 0.2, 0.9, 0.4, 0.6],
  [0.3, 0.8, 0.0, 0.7, 0.5, 0.2, 0.9],
  [0.7, 0.4, 0.9, 0.0, 0.3, 0.8, 0.5],
  [0.5, 1.0, 0.3, 0.8, 0.0, 0.6, 0.4],
  [0.2, 0.6, 0.7, 0.4, 1.0, 0.9, 0.0],
];

const WEEKLY_NOTE = '这周你的蔬菜摄入偏少，尤其是周三到周四。建议明天午餐加一份大叶菜沙拉，同时今晚试试豆腐味噌汤补上发酵食品这一类。蛋白质整体不错，保持！';

interface SevenDayScreenProps {
  profile?: UserProfile;
}

export function SevenDayScreen({ profile }: SevenDayScreenProps = {}) {
  const [period, setPeriod] = useState<Period>('7天');

  // Get current week number
  const now = new Date();
  const weekNum = Math.ceil(now.getDate() / 7);
  const startDate = new Date(now); startDate.setDate(now.getDate() - 6);
  const dateRange = `${startDate.getMonth() + 1}/${startDate.getDate()} – ${now.getMonth() + 1}/${now.getDate()}`;

  // SVG chart dimensions
  const chartW = 280;
  const chartH = 80;
  const maxCal = Math.max(...MOCK_CALORIES, TARGET_CAL) * 1.1;
  const points = MOCK_CALORIES.map((c, i) => `${(i / 6) * chartW},${chartH - (c / maxCal) * chartH}`).join(' ');
  const targetY = chartH - (TARGET_CAL / maxCal) * chartH;
  const avgY = chartH - (AVG_CAL / maxCal) * chartH;

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

      {/* Rhythm score hero */}
      <div className="nt-card" style={{ margin: '0 16px 12px', padding: '18px 20px' }}>
        <div className="nt-serif" style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
          <span className="nt-mark">本周节奏分</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
          <span className="nt-display" style={{ fontSize: 64, color: 'var(--ink)' }}>82</span>
          <div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 10px', borderRadius: 999,
              background: 'rgba(79,166,99,0.12)', border: '1px solid rgba(79,166,99,0.25)',
              fontSize: 11, color: 'var(--sage)', fontWeight: 600,
            }}>
              +5 比上周
            </span>
            <div className="nt-serif" style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 6, lineHeight: 1.5 }}>
              整体热量控制良好，蔬菜摄入需加强。
            </div>
          </div>
        </div>

        {/* 7 day dots */}
        <div style={{ display: 'flex', gap: 6, marginTop: 14, justifyContent: 'center' }}>
          {MOCK_CALORIES.map((cal, i) => {
            const heat = getDotHeat(cal);
            const isToday = i === 6;
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: DOT_COLORS[heat],
                  border: isToday ? '2px solid var(--ink)' : '2px solid transparent',
                  opacity: isToday ? 1 : 0.75,
                }} />
                <span className="nt-serif" style={{ fontSize: 10, color: 'var(--ink-mute)' }}>{MOCK_DAYS[i]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sub-scores */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, margin: '0 16px 12px' }}>
        {[
          { label: '能量', value: 88, unit: '分', pct: 88, color: 'var(--tomato)', hint: '5天达标' },
          { label: '营养', value: 75, unit: '分', pct: 75, color: 'var(--sky)', hint: '蛋白偏低' },
          { label: '多样', value: 62, unit: '分', pct: 62, color: 'var(--sage)', hint: '缺4类' },
        ].map(s => (
          <div key={s.label} className="nt-card" style={{ padding: '12px 14px' }}>
            <div className="nt-serif" style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{s.label}</div>
            <div className="nt-display" style={{ fontSize: 28, color: s.color }}>
              {s.value}<span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{s.unit}</span>
            </div>
            <Bar value={s.pct} target={100} color={s.color} height={4} />
            <div className="nt-serif" style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: 4 }}>{s.hint}</div>
          </div>
        ))}
      </div>

      {/* Energy chart */}
      <div className="nt-card" style={{ margin: '0 16px 12px', padding: '16px 18px' }}>
        <div className="nt-serif" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>热量走势</div>
        <div style={{ overflowX: 'auto' }}>
          <svg viewBox={`0 0 ${chartW} ${chartH + 20}`} style={{ width: '100%', minWidth: 240 }} preserveAspectRatio="none">
            {/* Filled area */}
            <defs>
              <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--tomato)" stopOpacity="0.18" />
                <stop offset="100%" stopColor="var(--tomato)" stopOpacity="0.01" />
              </linearGradient>
            </defs>
            <polygon
              points={`0,${chartH} ${points} ${chartW},${chartH}`}
              fill="url(#calGrad)"
            />
            {/* Target line (dashed) */}
            <line x1="0" y1={targetY} x2={chartW} y2={targetY} stroke="var(--tomato)" strokeWidth="1" strokeDasharray="4 3" />
            {/* Avg line (dashed) */}
            <line x1="0" y1={avgY} x2={chartW} y2={avgY} stroke="var(--sage)" strokeWidth="1" strokeDasharray="4 3" />
            {/* Polyline */}
            <polyline points={points} fill="none" stroke="var(--tomato)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {/* Dots */}
            {MOCK_CALORIES.map((_, i) => {
              const [cx, cy] = points.split(' ')[i].split(',').map(Number);
              const isLast = i === 6;
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
            {/* Day labels */}
            {MOCK_DAYS.map((d, i) => (
              <text key={i} x={(i / 6) * chartW} y={chartH + 14} textAnchor="middle" fontSize="9" fill="var(--ink-mute)" fontFamily="'Noto Serif SC', serif">
                {d}
              </text>
            ))}
          </svg>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 16, height: 1.5, background: 'var(--tomato)', borderStyle: 'dashed', borderWidth: '0 0 1.5px' }} />
            <span className="nt-serif" style={{ fontSize: 10, color: 'var(--ink-mute)' }}>目标 {TARGET_CAL}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 16, height: 1.5, background: 'var(--sage)', borderStyle: 'dashed', borderWidth: '0 0 1.5px' }} />
            <span className="nt-serif" style={{ fontSize: 10, color: 'var(--ink-mute)' }}>均值 {AVG_CAL}</span>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="nt-card" style={{ margin: '0 16px 12px', padding: '16px 18px' }}>
        <div className="nt-serif" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>
          七色 × 七日
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)', gap: 3 }}>
          {/* Header row */}
          <div />
          {MOCK_DAYS.map((d, i) => (
            <div key={i} style={{
              textAlign: 'center', fontSize: 10,
              fontFamily: 'Noto Serif SC, serif',
              fontWeight: i === 6 ? 700 : 400,
              color: i === 6 ? 'var(--ink)' : 'var(--ink-mute)',
            }}>
              {d}
            </div>
          ))}
          {/* Data rows */}
          {FOOD_GROUPS.map((g, gi) => (
            <React.Fragment key={g.key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 14 }}>{g.emoji}</span>
                <span className="nt-serif" style={{ fontSize: 9, color: 'var(--ink-mute)' }}>{g.name}</span>
              </div>
              {HEAT_INTENSITIES[gi].map((intensity, di) => (
                <div
                  key={di}
                  style={{
                    height: 20, borderRadius: 4,
                    background: intensity > 0
                      ? `color-mix(in oklab, ${g.color} ${Math.round(intensity * 80 + 10)}%, var(--paper-2))`
                      : 'var(--paper)',
                    border: di === 6 ? `1px solid var(--ink)` : '1px solid transparent',
                  }}
                />
              ))}
            </React.Fragment>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
          <span className="nt-serif" style={{ fontSize: 10, color: 'var(--ink-faint)' }}>少</span>
          {[0.1, 0.3, 0.6, 0.9].map((v, i) => (
            <div key={i} style={{
              width: 14, height: 10, borderRadius: 3,
              background: `color-mix(in oklab, var(--sage) ${Math.round(v * 80 + 10)}%, var(--paper-2))`,
            }} />
          ))}
          <span className="nt-serif" style={{ fontSize: 10, color: 'var(--ink-faint)' }}>多</span>
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
              // Flat sparkline — we only have one data point (current value)
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

      {/* Weekly note */}
      <div className="nt-card nt-card-warm" style={{ margin: '0 16px 12px', padding: '16px 18px' }}>
        <div className="nt-serif" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
          这一周想对你说
        </div>
        <p className="nt-serif" style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.75, margin: 0 }}>
          {WEEKLY_NOTE}
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button style={{
            padding: '6px 16px', borderRadius: 999,
            background: 'var(--ink)', color: '#fff',
            fontSize: 12, border: 'none', cursor: 'pointer',
          }} className="nt-serif">
            加购清单
          </button>
          <button style={{
            padding: '6px 16px', borderRadius: 999,
            background: 'transparent', border: '1px solid var(--line)',
            fontSize: 12, color: 'var(--ink-soft)', cursor: 'pointer',
          }} className="nt-serif">
            分享
          </button>
        </div>
      </div>
    </div>
  );
}
