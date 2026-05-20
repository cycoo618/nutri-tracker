// ============================================
// 今日明细 — MacrosScreen
// 宏量 · 留心摄入 · 食物多样性 · 微量元素 · 7天评分
// ============================================

import React from 'react';
import type { NutritionStatus } from '../../hooks/useNutrition';
import type { DailyLog } from '../../types/log';
import { Bar } from './shared/Bar';
import { FOOD_GROUPS } from './tokens';

interface MacrosScreenProps {
  nutritionStatus: NutritionStatus | null;
  dailyLog: DailyLog | null;
  currentDate: string;
  onBack: () => void;
  onOpenAdd: (mealType?: string) => void;
  onNav: (tab: string) => void;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return `${month}月${day}日 周${weekdays[d.getDay()]}`;
}

/** 根据完成百分比计算状态 tag */
function macroTag(pct: number): { text: string; color: string } {
  if (pct > 1.2) return { text: '偏多', color: 'var(--mustard)' };
  if (pct >= 0.9) return { text: '充足', color: 'var(--sage)' };
  if (pct >= 0.5) return { text: '偏低', color: 'var(--grain)' };
  return { text: '偏少', color: 'var(--tomato)' };
}

/** 计算今日综合得分 (0–100) */
function calcScore(ns: NutritionStatus | null): number {
  if (!ns) return 0;
  const score = (key: { consumed: number; target: number }) => {
    const pct = key.target > 0 ? key.consumed / key.target : 0;
    // 0→0, 0.5→60, 0.9→100, 1.0→100, 1.3→80, 2.0→40
    if (pct <= 0) return 0;
    if (pct <= 0.9) return Math.round(pct / 0.9 * 100);
    if (pct <= 1.1) return 100;
    return Math.max(0, Math.round(100 - (pct - 1.1) * 150));
  };
  const s =
    score(ns.macros.protein) * 0.3 +
    score(ns.macros.carbs) * 0.25 +
    score(ns.macros.fat) * 0.25 +
    score(ns.fiber) * 0.2;
  return Math.min(100, Math.round(s));
}

/** Score ring SVG (no Canvas) */
function ScoreRing({ value, size, stroke, color }: { value: number; size: number; stroke: number; color: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (value / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line-soft)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MacrosScreen({ nutritionStatus: ns, dailyLog, currentDate, onBack, onOpenAdd, onNav }: MacrosScreenProps) {
  const totalNutrition = dailyLog?.totalNutrition;
  const score = calcScore(ns);

  const macros = [
    {
      label: '蛋白质', emoji: '🥚', desc: '肌肉合成 · 修复',
      v: ns?.macros.protein.consumed ?? 0, t: ns?.macros.protein.target ?? 60,
      color: 'var(--sky)',
    },
    {
      label: '碳水', emoji: '🌾', desc: '能量来源 · 大脑燃料',
      v: ns?.macros.carbs.consumed ?? 0, t: ns?.macros.carbs.target ?? 250,
      color: 'var(--grain)',
    },
    {
      label: '脂肪', emoji: '🥑', desc: '细胞健康 · 激素',
      v: ns?.macros.fat.consumed ?? 0, t: ns?.macros.fat.target ?? 65,
      color: 'var(--persimmon)',
    },
    {
      label: '膳食纤维', emoji: '🥬', desc: '肠道菌群 · 饱腹感',
      v: ns?.fiber.consumed ?? 0, t: ns?.fiber.target ?? 25,
      color: 'var(--sage)',
    },
  ];

  // 留心摄入 (limits) — ceiling type: less is better
  const caps = [
    { label: '添加糖', emoji: '🍬', v: Math.round(totalNutrition?.sugar ?? 0), t: 50, unit: 'g' },
    { label: '钠', emoji: '🧂', v: Math.round(totalNutrition?.sodium ?? 0), t: 2300, unit: 'mg' },
    { label: '胆固醇', emoji: '🥚', v: Math.round(totalNutrition?.cholesterol ?? 0), t: 300, unit: 'mg' },
    { label: '反式脂肪', emoji: '🍟', v: Math.round((totalNutrition?.transFat ?? 0) * 10) / 10, t: 2, unit: 'g' },
  ];

  // 微量元素 — floor type: more is better
  const trace = [
    { label: '钙', emoji: '🥛', v: Math.round(totalNutrition?.calcium ?? 0), t: 800, unit: 'mg', color: 'var(--sage)' },
    { label: '铁', emoji: '🩸', v: Math.round(totalNutrition?.iron ?? 0), t: 20, unit: 'mg', color: 'var(--tomato)' },
    { label: '钾', emoji: '🍌', v: Math.round(totalNutrition?.potassium ?? 0), t: 2000, unit: 'mg', color: 'var(--mustard)' },
    { label: '镁', emoji: '🌰', v: Math.round(totalNutrition?.magnesium ?? 0), t: 330, unit: 'mg', color: 'var(--moss)' },
    { label: '锌', emoji: '🦪', v: Math.round((totalNutrition?.zinc ?? 0) * 10) / 10, t: 12, unit: 'mg', color: 'var(--sky)' },
  ];

  // Score description
  const overMacros = macros.filter(m => m.t > 0 && m.v / m.t > 1.2).map(m => m.label);
  const underMacros = macros.filter(m => m.t > 0 && m.v / m.t < 0.5).map(m => m.label);
  const scoreDesc = [
    ...overMacros.map(l => `${l}偏多`),
    ...underMacros.map(l => `${l}偏少`),
  ].join(' · ') || '今日营养摄入均衡';

  const doneCount = FOOD_GROUPS.filter(g => g.done).length;

  return (
    <div style={{ padding: '0 0 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 22px 0' }}>
        <button
          onClick={onBack}
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'transparent', border: '1px solid var(--line)',
            color: 'var(--ink-soft)', fontSize: 18, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >‹</button>
        <div style={{ flex: 1 }}>
          <div className="nt-display" style={{ fontSize: 22, color: 'var(--ink)', lineHeight: 1.1 }}>今日明细</div>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>宏量 · 留心摄入 · 多样性 · 微量元素 · {formatDate(currentDate)}</div>
        </div>
      </div>

      {/* Hero score card */}
      <div style={{ padding: '14px 18px 0' }}>
        <div className="nt-card" style={{ padding: '18px 18px 14px', position: 'relative', overflow: 'hidden' }}>
          {/* Corner accent */}
          <div style={{
            position: 'absolute', top: 0, right: 0,
            width: 32, height: 32,
            background: 'linear-gradient(225deg, var(--paper-2) 50%, transparent 50%)',
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Ring */}
            <div style={{ position: 'relative', width: 92, height: 92, flexShrink: 0 }}>
              <ScoreRing value={score} size={92} stroke={9} color="var(--mustard)" />
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="nt-display" style={{ fontSize: 28, color: 'var(--ink)', lineHeight: 1 }}>{score}</span>
                <span style={{ fontSize: 10, color: 'var(--ink-mute)' }}>/ 100 分</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="nt-serif" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>
                今日得分 {score} 分
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
                {scoreDesc}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 四大宏量 + 留心摄入 — 2-column grid */}
      <div style={{ padding: '12px 18px 6px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {/* 四大宏量 */}
        <div className="nt-card" style={{ padding: '10px 8px 10px' }}>
          <div style={{ padding: '0 4px 8px' }}>
            <h3 className="nt-serif" style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>四大宏量</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {macros.map(m => {
              const pct = m.t > 0 ? Math.min(m.v / m.t, 1) : 0;
              const { text: tagText, color: tagColor } = macroTag(m.t > 0 ? m.v / m.t : 0);
              return (
                <div key={m.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '4px 2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, lineHeight: 1 }}>
                    <span style={{ fontSize: 12 }}>{m.emoji}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink)' }}>{m.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                    <span className="nt-display" style={{ fontSize: 14, color: m.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{m.v}</span>
                    <span style={{ fontSize: 8, color: 'var(--ink-mute)', fontVariantNumeric: 'tabular-nums' }}>/{m.t}g</span>
                  </div>
                  <div style={{ width: '100%', height: 3, borderRadius: 2, background: 'var(--line-soft)', overflow: 'hidden', marginTop: 1 }}>
                    <div style={{ width: `${pct * 100}%`, height: '100%', background: m.color }} />
                  </div>
                  <span style={{ fontSize: 8.5, color: tagColor, fontWeight: 600, lineHeight: 1 }}>{tagText}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 留心摄入 */}
        <div className="nt-card" style={{ padding: '10px 8px 10px' }}>
          <div style={{ padding: '0 4px 8px' }}>
            <h3 className="nt-serif" style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>留心摄入</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {caps.map(c => {
              const pct = c.t > 0 ? Math.min(c.v / c.t, 1) : 0;
              const ratio = c.t > 0 ? c.v / c.t : 0;
              const tone = ratio < 0.5 ? 'var(--sage)' : ratio < 0.8 ? 'var(--mustard)' : 'var(--tomato)';
              const tagText = ratio < 0.5 ? '正常' : ratio < 0.8 ? '注意' : '偏高';
              return (
                <div key={c.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '4px 2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, lineHeight: 1 }}>
                    <span style={{ fontSize: 12 }}>{c.emoji}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{c.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                    <span className="nt-display" style={{ fontSize: 14, color: tone, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{c.v}</span>
                    <span style={{ fontSize: 8, color: 'var(--ink-mute)', fontVariantNumeric: 'tabular-nums' }}>/{c.t}{c.unit}</span>
                  </div>
                  <div style={{ width: '100%', height: 3, borderRadius: 2, background: 'var(--line-soft)', overflow: 'hidden', marginTop: 1 }}>
                    <div style={{ width: `${pct * 100}%`, height: '100%', background: tone, opacity: 0.85 }} />
                  </div>
                  <span style={{ fontSize: 8.5, color: tone, fontWeight: 600, lineHeight: 1 }}>{tagText}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 食物多样性 compact */}
      <div style={{ padding: '12px 18px 4px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h3 className="nt-serif" style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>食物多样性</h3>
        <button
          onClick={() => onNav('diversity')}
          style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontSize: 11, color: 'var(--ink-mute)' }}
        >
          查看全部 ›
        </button>
      </div>
      <div style={{ padding: '4px 18px 0' }}>
        <div className="nt-card" style={{ padding: '14px 14px 12px' }}>
          {/* Ring + nudge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
              <ScoreRing value={doneCount / 7 * 100} size={56} stroke={6} color="var(--sage)" />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span className="nt-display" style={{ fontSize: 16, color: 'var(--ink)', lineHeight: 1 }}>{doneCount}</span>
                <span style={{ fontSize: 8, color: 'var(--ink-mute)' }}>/ 7</span>
              </div>
            </div>
            <div style={{ flex: 1, fontSize: 11, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
              抗炎建议 <strong style={{ color: 'var(--sage)' }}>每天 5–7 类</strong>。今日已达 {doneCount} 类食物。
            </div>
          </div>
          {/* 7 emoji chips */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {FOOD_GROUPS.map(g => (
              <div
                key={g.key}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  padding: '6px 2px 4px',
                  background: g.done
                    ? `color-mix(in oklab, ${g.color} 14%, var(--card))`
                    : 'var(--paper-2)',
                  border: `1px solid ${g.done ? `color-mix(in oklab, ${g.color} 35%, transparent)` : 'var(--line-soft)'}`,
                  borderRadius: 8,
                  opacity: g.done ? 1 : 0.7,
                }}
              >
                <span style={{ fontSize: 15, filter: g.done ? 'none' : 'grayscale(0.4)' }}>{g.emoji}</span>
                <span style={{
                  fontSize: 8, color: g.done ? g.color : 'var(--ink-mute)',
                  fontWeight: g.done ? 600 : 400, lineHeight: 1, whiteSpace: 'nowrap',
                  fontFamily: 'Noto Serif SC, serif',
                }}>{g.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 微量元素 */}
      <div style={{ padding: '14px 18px 4px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h3 className="nt-serif" style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>微量元素</h3>
        <span className="nt-caveat" style={{ fontSize: 15, color: 'var(--ink-mute)' }}>trace minerals</span>
      </div>
      <div style={{ padding: '4px 18px 0' }}>
        <div className="nt-card" style={{ padding: '14px 12px 12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
            {trace.map(tr => {
              const pct = tr.t > 0 ? Math.min(tr.v / tr.t, 1) : 0;
              const isHit = pct >= 1;
              const displayV = tr.v >= 1000 ? `${(tr.v / 1000).toFixed(1)}k` : String(tr.v);
              const displayT = tr.t >= 1000 ? `${(tr.t / 1000).toFixed(1)}k` : String(tr.t);
              return (
                <div key={tr.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 2px' }}>
                  <span style={{ fontSize: 16, opacity: isHit ? 1 : 0.7 }}>{tr.emoji}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)', lineHeight: 1 }}>{tr.label}</span>
                  <span className="nt-display" style={{ fontSize: 14, color: isHit ? tr.color : 'var(--ink-soft)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                    {displayV}
                  </span>
                  <span style={{ fontSize: 8.5, color: 'var(--ink-mute)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                    /{displayT} {tr.unit}
                  </span>
                  <div style={{ width: '100%', height: 3, borderRadius: 2, background: 'var(--line-soft)', overflow: 'hidden', marginTop: 2 }}>
                    <div style={{ width: `${pct * 100}%`, height: '100%', background: tr.color, opacity: isHit ? 1 : 0.6 }} />
                  </div>
                </div>
              );
            })}
          </div>
          {(() => {
            const low = trace.filter(tr => tr.t > 0 && tr.v / tr.t < 0.5).map(tr => tr.label);
            if (low.length === 0) return null;
            return (
              <>
                <hr className="nt-hr-dash" style={{ margin: '10px 0 8px' }} />
                <div style={{ fontSize: 11, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--ink)' }}>{low.join('、')}</strong> 仍偏低 · 多吃深色蔬菜、豆类和乳制品可补充
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* 今晚怎么吃 */}
      <div style={{ padding: '14px 18px 4px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h3 className="nt-serif" style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>今晚怎么吃</h3>
        <span className="nt-caveat" style={{ fontSize: 15, color: 'var(--ink-mute)' }}>tonight</span>
      </div>
      <div style={{ padding: '4px 18px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {buildSuggestions(ns).map((s, i) => (
          <div key={i} className="nt-card" style={{
            padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 12,
            borderLeft: `3px solid ${s.tone}`,
          }}>
            <span style={{ fontSize: 22 }}>{s.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{s.title}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 1 }}>{s.sub}</div>
            </div>
            <button
              onClick={() => onOpenAdd('dinner')}
              style={{
                width: 28, height: 28, borderRadius: '50%',
                background: s.tone, color: 'white', border: 'none',
                fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >＋</button>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Suggestion {
  emoji: string;
  title: string;
  sub: string;
  tone: string;
}

function buildSuggestions(ns: NutritionStatus | null): Suggestion[] {
  const suggestions: Suggestion[] = [];
  if (!ns) {
    suggestions.push({ emoji: '🥗', title: '均衡晚餐', sub: '蛋白质 + 蔬菜 + 适量主食', tone: 'var(--sage)' });
    return suggestions;
  }
  const proteinPct = ns.macros.protein.target > 0 ? ns.macros.protein.consumed / ns.macros.protein.target : 1;
  const carbsPct = ns.macros.carbs.target > 0 ? ns.macros.carbs.consumed / ns.macros.carbs.target : 1;
  const fatPct = ns.macros.fat.target > 0 ? ns.macros.fat.consumed / ns.macros.fat.target : 1;
  const fiberPct = ns.fiber.target > 0 ? ns.fiber.consumed / ns.fiber.target : 1;

  if (proteinPct < 0.7) {
    suggestions.push({ emoji: '🐟', title: '清蒸鱼 100g', sub: `补充蛋白质 +约22g · 距目标还差${Math.round((1 - proteinPct) * ns.macros.protein.target)}g`, tone: 'var(--sky)' });
  }
  if (fiberPct < 0.7) {
    suggestions.push({ emoji: '🥦', title: '炒西兰花 200g', sub: '补充膳食纤维 +约5g · 支持肠道健康', tone: 'var(--moss)' });
  }
  if (carbsPct > 1.1) {
    suggestions.push({ emoji: '🌾', title: '主食减半', sub: '今日碳水已偏多 · 晚餐可减少米饭', tone: 'var(--mustard)' });
  }
  if (fatPct < 0.6) {
    suggestions.push({ emoji: '🥑', title: '加点橄榄油', sub: '优质不饱和脂肪 · 补充今日脂肪摄入', tone: 'var(--grain)' });
  }
  if (suggestions.length === 0) {
    suggestions.push({ emoji: '✨', title: '今日营养均衡', sub: '保持这个饮食节奏！', tone: 'var(--sage)' });
  }
  return suggestions.slice(0, 3);
}
