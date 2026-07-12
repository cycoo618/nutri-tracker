// ============================================
// 血糖记录卡（redesign 风格，仅控血糖目标 + 当前编辑日显示）
// ============================================

import { useState } from 'react';
import type { BloodSugarReading } from '../../types/bloodSugar';
import {
  CONTEXT_META, getGlucoseStatus, toMmol,
  STATUS_COLOR, STATUS_LABEL, targetHint,
} from '../../types/bloodSugar';

interface Props {
  readings: BloodSugarReading[];   // 当天读数（已按时间升序）
  trend: BloodSugarReading[];      // 近 7 天读数（升序）
  onAdd: () => void;
  onEdit: (reading: BloodSugarReading) => void;
  onDelete: (id: string) => void;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** 近 7 天迷你趋势折线（自绘 SVG，值统一换算成 mmol/L 作 Y 轴） */
function TrendSparkline({ trend }: { trend: BloodSugarReading[] }) {
  const pts = trend.filter(r => Number.isFinite(r.value));
  if (pts.length < 2) return null;

  const W = 300, H = 80, padX = 6, padTop = 8, padBottom = 14;
  const times = pts.map(r => new Date(r.measuredAt).getTime());
  const tMin = Math.min(...times), tMax = Math.max(...times);
  const tSpan = Math.max(1, tMax - tMin);

  const vals = pts.map(r => toMmol(r.value, r.unit));
  const vMin = Math.min(4, ...vals) - 0.5;
  const vMax = Math.max(10, ...vals) + 0.5;
  const vSpan = Math.max(1, vMax - vMin);

  const x = (t: number) => padX + ((t - tMin) / tSpan) * (W - padX * 2);
  const y = (v: number) => padTop + (1 - (v - vMin) / vSpan) * (H - padTop - padBottom);

  // 参考带：空腹达标 4.4–7.0（浅色，仅作视觉参考）
  const bandTop = y(7.0), bandBottom = y(4.4);

  const line = pts.map((r, i) => `${i === 0 ? 'M' : 'L'}${x(times[i]).toFixed(1)},${y(vals[i]).toFixed(1)}`).join(' ');

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
        <span className="nt-serif" style={{ fontSize: 11, color: 'var(--ink-mute)' }}>近 7 天趋势</span>
        <span className="nt-caveat" style={{ fontSize: 10, color: 'var(--ink-faint)' }}>参考带 4.4–7.0</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
        {/* 参考带 */}
        <rect x={0} y={bandTop} width={W} height={Math.max(0, bandBottom - bandTop)}
          fill="var(--sage)" opacity={0.1} />
        {/* 折线 */}
        <path d={line} fill="none" stroke="var(--plum)" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" opacity={0.6} />
        {/* 数据点：按各自场景达标状态着色；服药点加外圈 */}
        {pts.map((r, i) => {
          const st = getGlucoseStatus(r.value, r.context, r.unit);
          return (
            <g key={r.id}>
              {r.tookMedication && (
                <circle cx={x(times[i])} cy={y(vals[i])} r={5} fill="none" stroke="var(--mustard)" strokeWidth={1.2} />
              )}
              <circle cx={x(times[i])} cy={y(vals[i])} r={2.6} fill={STATUS_COLOR[st]} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function BloodSugarCard({ readings, trend, onAdd, onEdit, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const latest = readings.length ? readings[readings.length - 1] : null;
  const latestStatus = latest ? getGlucoseStatus(latest.value, latest.context, latest.unit) : null;

  return (
    <div style={{ padding: '4px 16px' }}>
      <div className="nt-card" style={{ padding: '14px 16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: latest ? 12 : 4 }}>
          <span className="nt-serif" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>🩸 血糖</span>
          <button
            onMouseDown={e => e.preventDefault()}
            onTouchEnd={e => { e.preventDefault(); e.stopPropagation(); onAdd(); }}
            onClick={onAdd}
            className="nt-serif"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '4px 12px', borderRadius: 999,
              background: 'rgba(212,93,127,0.12)', border: '1px solid rgba(212,93,127,0.25)',
              fontSize: 12, color: 'var(--plum)', fontWeight: 600, cursor: 'pointer',
            }}
          >＋ 记录</button>
        </div>

        {latest ? (
          <>
            {/* 最近一条读数 */}
            <div
              onClick={() => setExpanded(e => !e)}
              style={{ display: 'flex', alignItems: 'flex-end', gap: 12, cursor: 'pointer' }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                  <span className="nt-display" style={{ fontSize: 44, lineHeight: 1, color: STATUS_COLOR[latestStatus!] }}>
                    {latest.value}
                  </span>
                  <span className="nt-serif" style={{ fontSize: 13, color: 'var(--ink-mute)' }}>{latest.unit}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 999,
                    background: STATUS_COLOR[latestStatus!] + '22',
                    fontSize: 10, color: STATUS_COLOR[latestStatus!], fontWeight: 600,
                  }}>{STATUS_LABEL[latestStatus!]}</span>
                  <span className="nt-serif" style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
                    {CONTEXT_META[latest.context].emoji} {CONTEXT_META[latest.context].label}
                    {latest.tookMedication && ' · 已服药'}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div className="nt-caveat" style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{fmtTime(latest.measuredAt)}</div>
                <div className="nt-serif" style={{ fontSize: 10, color: 'var(--ink-faint)', marginTop: 2 }}>
                  {targetHint(latest.context)}
                </div>
                {readings.length > 1 && (
                  <div className="nt-serif" style={{ fontSize: 10, color: 'var(--plum)', marginTop: 3 }}>
                    今日 {readings.length} 次 {expanded ? '▲' : '▼'}
                  </div>
                )}
              </div>
            </div>

            {/* 趋势 */}
            <TrendSparkline trend={trend} />

            {/* 展开：当天读数列表 */}
            {expanded && (
              <div style={{ marginTop: 10, borderTop: '1px solid var(--line-soft)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {readings.map(r => {
                  const st = getGlucoseStatus(r.value, r.context, r.unit);
                  return (
                    <div
                      key={r.id}
                      onClick={() => onEdit(r)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 4px', margin: '0 -4px', borderRadius: 8, cursor: 'pointer', minHeight: 32 }}
                    >
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_COLOR[st], flexShrink: 0 }} />
                      <span className="nt-display" style={{ fontSize: 16, color: 'var(--ink)', minWidth: 44 }}>{r.value}</span>
                      <span className="nt-serif" style={{ fontSize: 11, color: 'var(--ink-mute)', flex: 1, minWidth: 0 }}>
                        {CONTEXT_META[r.context].label}{r.tookMedication ? ' · 💊' : ''}{r.note ? ` · ${r.note}` : ''}
                      </span>
                      <span className="nt-caveat" style={{ fontSize: 11, color: 'var(--ink-faint)', flexShrink: 0 }}>{fmtTime(r.measuredAt)}</span>
                      <button
                        onMouseDown={e => e.preventDefault()}
                        onTouchEnd={e => { e.preventDefault(); e.stopPropagation(); onDelete(r.id); }}
                        onClick={e => { e.stopPropagation(); onDelete(r.id); }}
                        style={{
                          width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                          background: 'var(--paper)', border: '1px solid var(--line-soft)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, color: 'var(--ink-mute)', cursor: 'pointer', lineHeight: 1,
                        }}
                      >×</button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <button
            onMouseDown={e => e.preventDefault()}
            onTouchEnd={e => { e.preventDefault(); e.stopPropagation(); onAdd(); }}
            onClick={onAdd}
            className="nt-serif"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              width: '100%', padding: '10px', borderRadius: 10,
              border: '1.5px dashed var(--line)', background: 'transparent',
              fontSize: 12, color: 'var(--ink-mute)', cursor: 'pointer', marginTop: 4,
            }}
          >
            <span style={{ fontSize: 16 }}>＋</span> 记录今天的血糖
          </button>
        )}
      </div>
    </div>
  );
}
