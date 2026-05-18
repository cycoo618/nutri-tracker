// ============================================
// GoalPrioritySheet — 目标优先级选择底部抽屉
// 从主屏顶部 chips 点击触发，快速设置目标1/目标2
// ============================================

import React, { useState } from 'react';
import type { UserProfile, GoalType } from '../../types/user';

interface GoalPrioritySheetProps {
  profile: UserProfile;
  onSave: (goals: GoalType[]) => Promise<void>;
  onClose: () => void;
}

const GOAL_OPTIONS = [
  { key: 'fat_loss'          as GoalType, emoji: '🔥', name: '减脂',   desc: '温和热量缺口，可持续减脂', color: 'var(--tomato)' },
  { key: 'anti_inflammatory' as GoalType, emoji: '🫒', name: '抗炎',   desc: '地中海饮食，多样蔬果 Omega-3', color: 'var(--moss)' },
  { key: 'muscle_gain'       as GoalType, emoji: '💪', name: '增肌',   desc: '增加蛋白质和优质碳水', color: 'var(--mustard)' },
  { key: 'blood_sugar'       as GoalType, emoji: '🩸', name: '控血糖', desc: '关注 GI 值，稳定血糖波动', color: 'var(--plum)' },
];

const HOME_LAYOUT_LABEL: Record<string, string> = {
  fat_loss:          '📖 营养日记本',
  anti_inflammatory: '🌻 七色花园',
  muscle_gain:       '💪 蛋白仪表盘（即将推出）',
  blood_sugar:       '🩸 时间节奏图（即将推出）',
};

export function GoalPrioritySheet({ profile, onSave, onClose }: GoalPrioritySheetProps) {
  const initial = (profile.goals?.length ? profile.goals : [profile.goal]) as GoalType[];
  const [goals, setGoals] = useState<GoalType[]>(initial);
  const [saving, setSaving] = useState(false);

  const toggleGoal = (key: GoalType) => {
    setGoals(prev => {
      if (prev[0] === key) {
        // 点主目标 → 移除（降级）
        return prev.slice(1);
      }
      if (prev[1] === key) {
        // 点次目标 → 升为主目标，原主降为次
        return [key, prev[0]].filter(Boolean) as GoalType[];
      }
      // 未选中 → 加为次目标（替换现有次目标）
      if (prev.length === 0) return [key];
      if (prev.length === 1) return [prev[0], key];
      return [prev[0], key]; // 替换次目标
    });
  };

  const handleSave = async () => {
    if (goals.length === 0) return;
    setSaving(true);
    try {
      await onSave(goals);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const primaryGoal = goals[0];
  const layoutLabel = primaryGoal ? HOME_LAYOUT_LABEL[primaryGoal] : '';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(31,41,32,0.4)',
          backdropFilter: 'blur(3px)',
        }}
      />

      {/* Sheet */}
      <div
        className="nt-sheet-in"
        style={{
          position: 'fixed', left: 0, right: 0,
          bottom: 0, zIndex: 201,
          background: 'var(--paper)',
          borderRadius: '24px 24px 0 0',
          padding: '0 0 32px',
          boxShadow: '0 -10px 40px rgba(31,41,32,0.14)',
          maxHeight: '82vh',
          overflowY: 'auto',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 999, background: 'var(--ink-faint)' }} />
        </div>

        {/* Header */}
        <div style={{ padding: '6px 22px 14px', borderBottom: '1px solid var(--line-soft)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="nt-display" style={{ fontSize: 20, color: 'var(--ink)' }}>我的目标</span>
            <span className="nt-caveat" style={{ fontSize: 15, color: 'var(--ink-mute)' }}>set priorities</span>
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: 'var(--ink-mute)' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '1px 6px', borderRadius: 999,
              background: 'rgba(255,107,87,0.1)', color: 'var(--tomato)',
              fontSize: 10, fontWeight: 700, marginRight: 4,
            }}>①</span>
            主目标决定首页布局 ·
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '1px 6px', borderRadius: 999,
              background: 'var(--line-soft)', color: 'var(--ink-mute)',
              fontSize: 10, fontWeight: 700, marginLeft: 4, marginRight: 4,
            }}>②</span>
            次目标影响建议内容
          </div>
        </div>

        {/* Goal cards */}
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {GOAL_OPTIONS.map(g => {
            const pri = goals.indexOf(g.key);
            const isPrimary   = pri === 0;
            const isSecondary = pri === 1;
            const selected    = pri >= 0;

            return (
              <button
                key={g.key}
                onClick={() => toggleGoal(g.key)}
                style={{
                  background: selected
                    ? `color-mix(in oklab, ${g.color} 6%, var(--card))`
                    : 'var(--card)',
                  border: `1.5px solid ${
                    isPrimary   ? g.color :
                    isSecondary ? `color-mix(in oklab, ${g.color} 50%, var(--line))` :
                                  'var(--line-soft)'
                  }`,
                  borderRadius: 14,
                  padding: '12px 14px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                  boxShadow: isPrimary
                    ? `0 4px 14px color-mix(in oklab, ${g.color} 16%, transparent)`
                    : 'none',
                  transition: 'border-color .2s, box-shadow .2s',
                  width: '100%',
                }}
              >
                <span style={{ fontSize: 26, opacity: selected ? 1 : 0.4 }}>{g.emoji}</span>

                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="nt-serif" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                      {g.name}
                    </span>
                    {isPrimary && (
                      <span style={{
                        padding: '1px 6px', borderRadius: 999,
                        background: g.color, color: 'white',
                        fontSize: 10, fontWeight: 700,
                      }}>① 主</span>
                    )}
                    {isSecondary && (
                      <span style={{
                        padding: '1px 6px', borderRadius: 999,
                        border: `1px solid ${g.color}`, color: g.color,
                        fontSize: 10, fontWeight: 700,
                      }}>② 次</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>{g.desc}</div>
                </div>

                {/* Priority circle indicator */}
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  background: selected ? g.color : 'transparent',
                  border: `1.5px solid ${selected ? g.color : 'var(--line)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: 12, fontWeight: 700,
                  transition: 'all .2s',
                }}>
                  {isPrimary ? '1' : isSecondary ? '2' : ''}
                </div>
              </button>
            );
          })}
        </div>

        {/* Home layout preview */}
        {primaryGoal && (
          <div style={{ margin: '0 18px 14px' }}>
            <div className="nt-card nt-card-warm" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: `color-mix(in oklab, ${GOAL_OPTIONS.find(g => g.key === primaryGoal)?.color ?? 'var(--sage)'} 14%, transparent)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>
                {GOAL_OPTIONS.find(g => g.key === primaryGoal)?.emoji}
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: 1.5, textTransform: 'uppercase' }}>首页适配预览</div>
                <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 700, marginTop: 2 }}>{layoutLabel}</div>
              </div>
            </div>
          </div>
        )}

        {/* Confirm button */}
        <div style={{ padding: '0 18px' }}>
          <button
            onClick={handleSave}
            disabled={saving || goals.length === 0}
            onMouseDown={e => e.preventDefault()}
            onTouchEnd={e => { e.preventDefault(); e.stopPropagation(); if (!saving && goals.length > 0) handleSave(); }}
            style={{
              width: '100%', padding: '14px',
              background: goals.length === 0 ? 'var(--line)' : 'var(--ink)',
              color: 'var(--paper)',
              border: 'none', borderRadius: 14,
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 4px 14px rgba(31,41,32,0.18)',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? '保存中…' : '确认目标'}
          </button>
        </div>
      </div>
    </>
  );
}
