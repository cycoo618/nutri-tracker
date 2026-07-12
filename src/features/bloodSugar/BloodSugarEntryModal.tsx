// ============================================
// 血糖录入弹窗（redesign bottom-sheet 风格）
// 新增 / 编辑一条血糖读数
// ============================================

import { useState } from 'react';
import { useSwipeDown } from '../../hooks/useSwipeDown';
import type { BloodSugarReading, GlucoseUnit, MeasureContext } from '../../types/bloodSugar';
import {
  CONTEXT_META, CONTEXT_ORDER, getGlucoseStatus,
  STATUS_COLOR, STATUS_LABEL, targetHint,
} from '../../types/bloodSugar';
import type { NewReadingInput } from '../../hooks/useBloodSugar';

interface Props {
  editing?: BloodSugarReading | null;
  onSave: (input: NewReadingInput) => Promise<void>;
  onClose: () => void;
}

/** Date → "YYYY-MM-DDTHH:mm"（本地时区，供 datetime-local） */
function toLocalInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** 按当前时间智能预选场景 */
function defaultContext(): MeasureContext {
  const h = new Date().getHours();
  return h >= 5 && h < 9 ? 'fasting' : 'random';
}

export function BloodSugarEntryModal({ editing, onSave, onClose }: Props) {
  const { cardRef, dragHandlers, cardDragHandlers } = useSwipeDown(onClose);

  const [value, setValue] = useState(editing ? String(editing.value) : '');
  const [unit, setUnit] = useState<GlucoseUnit>(editing?.unit ?? 'mmol/L');
  const [context, setContext] = useState<MeasureContext>(editing?.context ?? defaultContext());
  const [measuredLocal, setMeasuredLocal] = useState(
    toLocalInput(editing ? new Date(editing.measuredAt) : new Date()),
  );
  const [tookMedication, setTookMedication] = useState(editing?.tookMedication ?? false);
  const [medicationNote, setMedicationNote] = useState(editing?.medicationNote ?? '');
  const [note, setNote] = useState(editing?.note ?? '');
  const [saving, setSaving] = useState(false);

  const numeric = parseFloat(value);
  const valid = Number.isFinite(numeric) && numeric > 0;
  const status = valid ? getGlucoseStatus(numeric, context, unit) : null;

  const handleSave = async () => {
    if (!valid || saving) return;
    setSaving(true);
    const input: NewReadingInput = {
      value: numeric,
      unit,
      context,
      measuredAt: new Date(measuredLocal).toISOString(),
      tookMedication,
      medicationNote: tookMedication && medicationNote.trim() ? medicationNote.trim() : undefined,
      note: note.trim() || undefined,
    };
    try {
      await onSave(input);
      onClose();
    } catch (err) {
      console.warn('Save blood sugar failed:', err);
      setSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(31,41,32,0.35)', backdropFilter: 'blur(2px)', zIndex: 110 }}
      />
      {/* Sheet */}
      <div
        ref={cardRef}
        className="nt-sheet-in"
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          maxHeight: '88%',
          background: 'var(--paper)',
          borderRadius: '22px 22px 0 0',
          border: '1px solid var(--line-soft)',
          boxShadow: '0 -8px 40px rgba(31,41,32,0.12)',
          zIndex: 111,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
        {...cardDragHandlers}
      >
        {/* Drag handle */}
        <div
          style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4, flexShrink: 0, cursor: 'grab', touchAction: 'none' }}
          {...dragHandlers}
        >
          <div style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--ink-faint)' }} />
        </div>

        {/* Header */}
        <div style={{ padding: '4px 16px 10px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="nt-display" style={{ fontSize: 20, color: 'var(--ink)', flex: 1 }}>
            🩸 {editing ? '编辑血糖' : '记录血糖'}
          </span>
          <button
            onClick={onClose}
            style={{
              width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
              background: 'var(--paper-2)', border: '1px solid var(--line-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, color: 'var(--ink-soft)', cursor: 'pointer',
            }}
          >✕</button>
        </div>
        <div style={{ borderBottom: '1px solid var(--line-soft)' }} />

        {/* Body (scrollable) */}
        <div className="nt-scroll-hide" style={{ overflowY: 'auto', padding: '14px 16px 8px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* 数值 + 单位 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={value}
                onChange={e => setValue(e.target.value)}
                onFocus={e => { const t = e.target; setTimeout(() => t.select(), 50); }}
                placeholder="0.0"
                autoFocus={!editing}
                className="nt-display"
                style={{
                  flex: 1, minWidth: 0,
                  fontSize: 48, lineHeight: 1,
                  color: status ? STATUS_COLOR[status] : 'var(--ink)',
                  background: 'transparent', border: 'none', outline: 'none',
                  borderBottom: '2px solid var(--line)', padding: '4px 0',
                }}
              />
              {/* 单位切换 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                {(['mmol/L', 'mg/dL'] as GlucoseUnit[]).map(u => {
                  const active = unit === u;
                  return (
                    <button
                      key={u}
                      onClick={() => setUnit(u)}
                      className="nt-serif"
                      style={{
                        padding: '4px 10px', borderRadius: 999,
                        background: active ? 'var(--ink)' : 'transparent',
                        color: active ? '#F6F9F2' : 'var(--ink-mute)',
                        border: active ? 'none' : '1px solid var(--line-soft)',
                        fontSize: 11, fontWeight: active ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap',
                      }}
                    >{u}</button>
                  );
                })}
              </div>
            </div>
            {/* 达标反馈 */}
            {status && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <span style={{
                  padding: '2px 10px', borderRadius: 999,
                  background: STATUS_COLOR[status] + '22', fontSize: 11, color: STATUS_COLOR[status], fontWeight: 600,
                }}>{STATUS_LABEL[status]}</span>
                <span className="nt-serif" style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{targetHint(context)}</span>
              </div>
            )}
          </div>

          {/* 场景 */}
          <div>
            <div className="nt-serif" style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 6 }}>测量场景</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {CONTEXT_ORDER.map(c => {
                const active = context === c;
                return (
                  <button
                    key={c}
                    onClick={() => setContext(c)}
                    className="nt-serif"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '6px 12px', borderRadius: 999,
                      background: active ? 'rgba(212,93,127,0.14)' : 'transparent',
                      color: active ? 'var(--plum)' : 'var(--ink-mute)',
                      border: `1px solid ${active ? 'rgba(212,93,127,0.4)' : 'var(--line-soft)'}`,
                      fontSize: 12, fontWeight: active ? 700 : 400, cursor: 'pointer',
                    }}
                  >{CONTEXT_META[c].emoji} {CONTEXT_META[c].label}</button>
                );
              })}
            </div>
          </div>

          {/* 时间 */}
          <div>
            <div className="nt-serif" style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 6 }}>测量时间</div>
            <input
              type="datetime-local"
              value={measuredLocal}
              onChange={e => setMeasuredLocal(e.target.value)}
              className="nt-serif"
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 10,
                background: 'var(--paper-2)', border: '1px solid var(--line-soft)',
                fontSize: 13, color: 'var(--ink)', outline: 'none',
              }}
            />
          </div>

          {/* 餐前服药 */}
          <div>
            <div
              onClick={() => setTookMedication(v => !v)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            >
              <span className="nt-serif" style={{ fontSize: 13, color: 'var(--ink)' }}>💊 餐前服用降糖药</span>
              {/* toggle */}
              <div style={{
                width: 42, height: 24, borderRadius: 999, flexShrink: 0,
                background: tookMedication ? 'var(--plum)' : 'var(--line)',
                position: 'relative', transition: 'background .15s',
              }}>
                <div style={{
                  position: 'absolute', top: 2, left: tookMedication ? 20 : 2,
                  width: 20, height: 20, borderRadius: '50%', background: '#fff',
                  transition: 'left .15s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
            </div>
            {tookMedication && (
              <input
                type="text"
                value={medicationNote}
                onChange={e => setMedicationNote(e.target.value)}
                placeholder="药名 / 剂量（可选，如 二甲双胍 0.5g）"
                className="nt-serif"
                style={{
                  width: '100%', marginTop: 8, padding: '9px 12px', borderRadius: 10,
                  background: 'var(--paper-2)', border: '1px solid var(--line-soft)',
                  fontSize: 13, color: 'var(--ink)', outline: 'none',
                }}
              />
            )}
          </div>

          {/* 备注 */}
          <div>
            <div className="nt-serif" style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 6 }}>备注（可选）</div>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="如 运动后 / 感冒中 …"
              className="nt-serif"
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 10,
                background: 'var(--paper-2)', border: '1px solid var(--line-soft)',
                fontSize: 13, color: 'var(--ink)', outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Footer: 保存 */}
        <div style={{ flexShrink: 0, padding: '10px 16px calc(env(safe-area-inset-bottom, 0px) + 12px)', borderTop: '1px solid var(--line-soft)' }}>
          <button
            disabled={!valid || saving}
            onMouseDown={e => e.preventDefault()}
            onTouchEnd={e => { e.preventDefault(); e.stopPropagation(); handleSave(); }}
            onClick={handleSave}
            className="nt-serif"
            style={{
              width: '100%', padding: '13px', borderRadius: 12,
              background: valid ? 'var(--plum)' : 'var(--line)',
              color: valid ? '#fff' : 'var(--ink-faint)',
              border: 'none', fontSize: 15, fontWeight: 700,
              cursor: valid && !saving ? 'pointer' : 'default',
            }}
          >{saving ? '保存中…' : editing ? '保存修改' : '记录'}</button>
        </div>
      </div>
    </>
  );
}
