import React from 'react';
import { Ring } from './shared/Ring';
import { Bar } from './shared/Bar';
import { FOOD_GROUPS } from './tokens';

interface DiversityScreenProps {
  onBack: () => void;
}

// Mock 7-day history: array of 7 intensities (0–1) per group
const MOCK_HISTORY: Record<string, number[]> = {
  veg:   [0.0, 0.8, 0.0, 0.9, 1.0, 0.7, 0.0],
  fruit: [0.5, 0.0, 0.7, 1.0, 0.8, 0.6, 0.3],
  grain: [1.0, 1.0, 1.0, 1.0, 0.9, 1.0, 1.0],
  bean:  [0.3, 0.5, 0.0, 0.4, 0.7, 0.8, 0.2],
  nut:   [0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0],
  fish:  [0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0],
  ferm:  [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
};

const ANTI_INFLAM_FOODS = [
  { color: 'var(--veg)', foods: ['菠菜', '羽衣甘蓝', '西兰花', '绿叶菜'] },
  { color: 'var(--fruit)', foods: ['蓝莓', '草莓', '石榴', '橄榄'] },
  { color: 'var(--fish)', foods: ['三文鱼', '沙丁鱼', '核桃', '亚麻籽'] },
  { color: 'var(--ferm)', foods: ['希腊酸奶', '泡菜', '味噌', '纳豆'] },
  { color: 'var(--grain)', foods: ['燕麦', '糙米', '藜麦', '全麦'] },
];

export function DiversityScreen({ onBack }: DiversityScreenProps) {
  const doneCount = FOOD_GROUPS.filter(g => g.done).length;

  return (
    <div style={{ padding: '0 0 8px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 22px' }}>
        <button
          onClick={onBack}
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--card)', border: '1px solid var(--line-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, color: 'var(--ink-soft)', cursor: 'pointer',
          }}
        >‹</button>
        <div>
          <div className="nt-display" style={{ fontSize: 22, color: 'var(--ink)' }}>食物多样性</div>
          <div className="nt-caveat" style={{ fontSize: 13, color: 'var(--ink-mute)' }}>food diversity</div>
        </div>
      </div>

      {/* Ring summary */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, padding: '8px 22px 12px' }}>
        <Ring value={doneCount} target={7} size={92} stroke={9} color="var(--sage)">
          <span className="nt-display" style={{ fontSize: 28, color: 'var(--sage)' }}>{doneCount}</span>
          <span className="nt-serif" style={{ fontSize: 11, color: 'var(--ink-mute)' }}>/ 7</span>
        </Ring>
        <div>
          <div className="nt-serif" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
            今日吃了 {doneCount} 类食物
          </div>
          <div className="nt-serif" style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.6, maxWidth: 180 }}>
            {doneCount >= 5 ? '非常棒！继续保持多样化饮食习惯。' : '今天可以再加几类，为身体提供更全面的营养素。'}
          </div>
        </div>
      </div>

      <hr className="nt-hr-dash" style={{ margin: '0 22px 16px' }} />

      {/* Group cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 16px' }}>
        {FOOD_GROUPS.map(g => {
          const history = MOCK_HISTORY[g.key] ?? [];
          return (
            <div key={g.key} className="nt-card" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                {/* Emoji square */}
                <div style={{
                  width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                  background: g.color + '22', border: `1px solid ${g.color}55`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>
                  {g.emoji}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span className="nt-serif" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{g.name}</span>
                    <span className="nt-serif" style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
                      {g.v}{g.isCount ? '次' : 'g'} / {g.t}{g.isCount ? '次' : 'g'}
                    </span>
                  </div>
                  <div className="nt-serif" style={{ fontSize: 11, color: 'var(--ink-mute)', marginBottom: 6 }}>
                    {g.range}
                    {g.daysAgo > 0 && <span style={{ color: 'var(--tomato)', marginLeft: 6 }}>· {g.daysAgo}天未吃</span>}
                  </div>
                  <Bar value={g.v} target={g.t} color={g.color} height={5} />

                  {/* 7-day history strip */}
                  <div style={{ display: 'flex', gap: 3, marginTop: 8 }}>
                    {history.map((intensity, i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1, height: 14, borderRadius: 4,
                          background: intensity > 0
                            ? `color-mix(in oklab, ${g.color} ${Math.round(intensity * 80 + 15)}%, var(--paper))`
                            : 'var(--paper-2)',
                        }}
                        title={`Day ${i + 1}: ${Math.round(intensity * 100)}%`}
                      />
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                    <span className="nt-serif" style={{ fontSize: 9, color: 'var(--ink-faint)' }}>7天前</span>
                    <span className="nt-serif" style={{ fontSize: 9, color: 'var(--ink-faint)' }}>今日</span>
                  </div>
                </div>

                <button
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: g.color, border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, color: '#fff', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  ＋
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Anti-inflammatory food list */}
      <div className="nt-card nt-card-warm" style={{ margin: '16px 16px 8px', padding: '16px 18px' }}>
        <div className="nt-serif" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>
          🫒 抗炎清单
        </div>
        {ANTI_INFLAM_FOODS.map((group, i) => (
          <div key={i} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
            {group.foods.map(food => (
              <span
                key={food}
                className="nt-serif"
                style={{
                  fontSize: 12, color: group.color, fontWeight: 600,
                  padding: '2px 8px', borderRadius: 999,
                  background: group.color + '15', border: `1px solid ${group.color}30`,
                }}
              >
                {food}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
