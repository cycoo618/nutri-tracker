// ============================================
// 添加食物弹窗 — 暖纸风重设计
// 大号 hero 数字 + 步进按钮 + 4色宏量 tile
// ============================================

import { useState, useMemo } from 'react';
import type { FoodItem } from '../../types/food';
import { inferServingSizes } from '../../utils/inferServingSizes';
import { useSwipeDown } from '../../hooks/useSwipeDown';
import { autoSelect } from '../../utils/inputHelpers';
import { getAllCustomFoods } from '../../utils/customFoods';
import { useLocale } from '../../i18n/useLocale';
import { localizeServingLabel } from '../../utils/servingLabels';
import { estimateFoodNutrition, getGroqKey } from '../../services/nutrition-vision';

export interface AddFoodModalProps {
  food: FoodItem;
  quickGrams?: number;
  quickUnit?: string;
  onConfirm: (food: FoodItem, grams: number, displayUnit: string) => void;
  onBack: () => void;
  onClose: () => void;
}

type InputMode = 'serving' | 'grams';

export function AddFoodModal({ food: foodProp, quickGrams, onConfirm, onBack, onClose }: AddFoodModalProps) {
  const { locale } = useLocale();

  // Look up fresh recipe ingredients from localStorage
  const food = useMemo(() => {
    if (foodProp.source !== 'user_added' || foodProp.ingredients) return foodProp;
    const record = getAllCustomFoods().find(r => r.id === foodProp.id);
    if (!record || !record.ingredients.length) return foodProp;
    return {
      ...foodProp,
      ingredients: record.ingredients.map(i => ({ foodName: i.foodName, grams: i.grams })),
    };
  }, [foodProp]);

  // Merge serving sizes
  const mergedServings = useMemo(() => {
    const builtinServings = food.servingSizes ?? [];
    const inferred = (food.source === 'user_added' || builtinServings.length > 0)
      ? []
      : inferServingSizes(food);
    return [
      ...builtinServings,
      ...inferred.filter(s => !builtinServings.some(b => Math.abs(b.grams - s.grams) < 5)),
    ];
  }, [food]);

  // Selected serving index (for foods with multiple sizes)
  const [selectedServing, setSelectedServing] = useState(0);
  const currentServing = mergedServings[selectedServing] ?? { label: '份', grams: 100 };
  const gramsPerUnit = currentServing.grams;
  const unitLabel = localizeServingLabel(currentServing.label, locale);

  // AI 补全营养（仅当蛋白/碳水/脂肪全为 0 时启用）
  const [localPer100g, setLocalPer100g] = useState<FoodItem['per100g']>(food.per100g);
  const [enriching, setEnriching] = useState(false);

  // Mode
  const defaultMode: InputMode = quickGrams ? 'grams' : 'serving';
  const [mode, setMode] = useState<InputMode>(defaultMode);

  // Serving & grams states
  const [servings, setServings] = useState<number>(
    quickGrams ? Math.max(0.5, +(quickGrams / gramsPerUnit).toFixed(1)) : 1
  );
  const [grams, setGrams] = useState<number>(quickGrams ?? gramsPerUnit);

  // Custom input
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Computed totals
  const totalGrams = mode === 'serving'
    ? Math.max(1, Math.round(servings * gramsPerUnit))
    : Math.max(1, grams);
  const f = totalGrams / 100;

  const r1 = (n: number) => {
    const x = Math.round(n * 10) / 10;
    return x % 1 === 0 ? String(Math.round(x)) : x.toFixed(1);
  };

  const kcal   = r1((localPer100g.calories ?? 0) * f);
  const prot   = r1((localPer100g.protein  ?? 0) * f);
  const carb   = r1((localPer100g.carbs    ?? 0) * f);
  const fat    = r1((localPer100g.fat      ?? 0) * f);
  const fiber  = localPer100g.fiber  != null ? r1(localPer100g.fiber  * f) : null;
  const sugar  = localPer100g.sugar  != null ? r1(localPer100g.sugar  * f) : null;
  const sodium = localPer100g.sodium != null ? r1(localPer100g.sodium * f) : null;

  const heroValue = mode === 'serving' ? servings : grams;
  const heroUnit  = mode === 'serving' ? unitLabel : 'g';
  const heroConv  = mode === 'serving'
    ? `≈ ${totalGrams} 克`
    : `≈ ${(grams / gramsPerUnit).toFixed(1)} ${unitLabel}`;

  const displayUnit = mode === 'serving'
    ? (servings === 1 ? unitLabel : `${servings} × ${unitLabel}`)
    : `${totalGrams}g`;

  const inc = () => {
    if (mode === 'serving') setServings(s => +(Math.max(0.5, s) + 1).toFixed(1));
    else setGrams(g => g + 10);
  };
  const dec = () => {
    if (mode === 'serving') setServings(s => +Math.max(0.5, s - 0.5).toFixed(1));
    else setGrams(g => Math.max(5, g - 10));
  };

  const macrosMissing = (localPer100g.protein ?? 0) === 0
    && (localPer100g.carbs ?? 0) === 0
    && (localPer100g.fat ?? 0) === 0
    && localPer100g.calories > 0;

  const handleEnrich = async () => {
    setEnriching(true);
    try {
      const n = await estimateFoodNutrition(food.name);
      setLocalPer100g(prev => ({
        ...prev,
        protein: n.protein,
        carbs: n.carbs,
        fat: n.fat,
        fiber: n.fiber ?? prev.fiber,
        sodium: n.sodium ?? prev.sodium,
      }));
    } catch { /* silently ignore */ }
    setEnriching(false);
  };

  const { cardRef, dragHandlers, cardDragHandlers } = useSwipeDown(onClose);

  const handleConfirm = () => {
    if (totalGrams <= 0) return;
    onConfirm({ ...food, per100g: localPer100g }, totalGrams, displayUnit);
  };

  // Quick chips
  const servingChips = [0.5, 1, 1.5, 2];
  const gramsChips = [...new Set([
    Math.round(gramsPerUnit / 2),
    gramsPerUnit,
    gramsPerUnit * 2,
    250,
  ])].filter(v => v > 0);

  return (
    <div
      className="fixed inset-x-0 z-50 flex items-end sm:items-center justify-center"
      style={{ top: 'var(--vvt, 0px)', height: 'var(--vvh, 100vh)', background: 'rgba(31,41,32,0.35)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        ref={cardRef}
        className="nt-sheet-in nt-paper nt-grain w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl flex flex-col"
        style={{ maxHeight: 'var(--vvh, 92vh)' }}
        onClick={e => e.stopPropagation()}
        {...cardDragHandlers}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-3 pb-1 shrink-0 cursor-grab"
          style={{ touchAction: 'none' }}
          {...dragHandlers}
        >
          <div style={{ width: 44, height: 4, borderRadius: 999, background: 'var(--line)' }} />
        </div>

        {/* Title block — centered, close pinned absolute so name never wraps into it */}
        <div style={{ flexShrink: 0, padding: '8px 56px 6px', position: 'relative', textAlign: 'center' }}>
          <div className="nt-display" style={{ fontSize: 23, color: 'var(--ink)', lineHeight: 1.15 }}>{food.name}</div>
          <div className="nt-caveat" style={{ fontSize: 14, color: 'var(--tomato)', marginTop: 1, lineHeight: 1 }}>记多少?</div>
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 6, right: 18,
              width: 30, height: 30, borderRadius: '50%',
              background: 'var(--card)', border: '1px solid var(--line-soft)',
              color: 'var(--ink-soft)', fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >×</button>
        </div>

        {/* Scroll area */}
        <div className="nt-scroll-hide flex-1" style={{ overflowY: 'auto', padding: '10px 18px 0' }}>

          {/* Multi-serving selector (only when food has >1 serving size) */}
          {mergedServings.length > 1 && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, overflowX: 'auto', paddingBottom: 2 }}>
              {mergedServings.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setSelectedServing(i); setGrams(s.grams); setServings(1); }}
                  style={{
                    flexShrink: 0, padding: '4px 12px', borderRadius: 999,
                    background: selectedServing === i ? 'var(--ink)' : 'var(--card)',
                    color: selectedServing === i ? 'var(--paper)' : 'var(--ink-mute)',
                    border: '1px solid var(--line-soft)',
                    fontSize: 12, cursor: 'pointer', fontFamily: 'Noto Serif SC, serif',
                  }}
                >
                  {localizeServingLabel(s.label, locale)}
                </button>
              ))}
            </div>
          )}

          {/* Mode tabs */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', padding: 3,
            background: 'var(--paper-2)', border: '1px solid var(--line-soft)', borderRadius: 14,
          }}>
            {([
              { k: 'serving' as InputMode, l: '按份量', en: 'serving' },
              { k: 'grams'   as InputMode, l: '按克重', en: 'grams'   },
            ]).map(tab => (
              <button
                key={tab.k}
                onClick={() => setMode(tab.k)}
                style={{
                  padding: '8px 0',
                  background: mode === tab.k ? 'var(--card)' : 'transparent',
                  border: 'none', borderRadius: 11, cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: mode === tab.k ? '0 1px 2px rgba(76,55,30,.05), 0 4px 10px rgba(76,55,30,.05)' : 'none',
                  display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6,
                }}
              >
                <span className="nt-serif" style={{
                  fontSize: 14, fontWeight: mode === tab.k ? 700 : 400,
                  color: mode === tab.k ? 'var(--ink)' : 'var(--ink-mute)',
                }}>{tab.l}</span>
                <span className="nt-caveat" style={{
                  fontSize: 13,
                  color: mode === tab.k ? 'var(--tomato)' : 'var(--ink-faint)',
                  whiteSpace: 'nowrap',
                }}>{tab.en}</span>
              </button>
            ))}
          </div>

          {/* HERO quantity card */}
          <div style={{
            marginTop: 14,
            background: 'var(--card)', border: '1px solid var(--line-soft)', borderRadius: 18,
            boxShadow: '0 1px 2px rgba(76,55,30,.04), 0 6px 16px rgba(76,55,30,.05)',
            padding: '16px 16px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Minus */}
              <button
                onMouseDown={e => e.preventDefault()}
                onTouchEnd={e => { e.preventDefault(); dec(); }}
                onClick={dec}
                style={{
                  width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                  background: 'var(--paper-2)', border: '1px solid var(--line-soft)',
                  color: 'var(--ink)', fontSize: 24, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >−</button>

              {/* Hero value */}
              <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
                  <span className="nt-display" style={{
                    fontSize: 54, color: 'var(--ink)', lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                  }}>{heroValue}</span>
                  <span className="nt-serif" style={{ fontSize: 19, color: 'var(--ink-mute)', fontWeight: 500 }}>{heroUnit}</span>
                </div>
                <div style={{
                  marginTop: 4, fontSize: 12.5, color: 'var(--ink-mute)',
                  fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                  fontVariantNumeric: 'tabular-nums',
                }}>{heroConv}</div>
              </div>

              {/* Plus */}
              <button
                onMouseDown={e => e.preventDefault()}
                onTouchEnd={e => { e.preventDefault(); inc(); }}
                onClick={inc}
                style={{
                  width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                  background: 'var(--paper-2)', border: '1px solid var(--line-soft)',
                  color: 'var(--ink)', fontSize: 24, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >+</button>
            </div>
          </div>

          {/* Quick chips */}
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {mode === 'serving'
              ? servingChips.map(n => (
                <PortionChip
                  key={n}
                  active={servings === n}
                  label={`${n} ${unitLabel}`}
                  sub={`${Math.round(n * gramsPerUnit)} g`}
                  onClick={() => setServings(n)}
                />
              ))
              : gramsChips.map((g, i) => (
                <PortionChip
                  key={i}
                  active={grams === g}
                  label={`${g} g`}
                  sub={`≈ ${(g / gramsPerUnit).toFixed(1)} ${unitLabel}`}
                  onClick={() => setGrams(g)}
                />
              ))
            }
            <button
              onClick={() => setShowCustomInput(v => !v)}
              style={{
                flex: '0 0 auto', padding: '7px 14px 8px',
                background: 'transparent', border: '1px dashed var(--line)',
                borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 12.5, color: 'var(--ink-mute)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                whiteSpace: 'nowrap',
              }}
            >＋ 自定义</button>
          </div>

          {/* Custom input (expandable) */}
          {showCustomInput && (
            <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="number"
                placeholder={mode === 'serving' ? '份数' : '克数'}
                onFocus={autoSelect}
                onChange={e => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v) && v > 0) {
                    if (mode === 'serving') setServings(v);
                    else setGrams(Math.round(v));
                  }
                }}
                style={{
                  flex: 1, border: '1px solid var(--line-soft)', borderRadius: 10,
                  padding: '8px 12px', fontSize: 15, color: 'var(--ink)',
                  background: 'var(--card)', outline: 'none', fontFamily: 'inherit',
                }}
              />
              <span className="nt-serif" style={{ fontSize: 13, color: 'var(--ink-mute)', flexShrink: 0 }}>
                {mode === 'serving' ? unitLabel : 'g'}
              </span>
            </div>
          )}

          {/* 食材组成 (combo foods only) */}
          {food.ingredients && food.ingredients.length > 0 && (
            <div className="nt-card" style={{ marginTop: 14, padding: '14px 16px' }}>
              <SectionLabel zh="食材组成" en="ingredients" />
              <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 16, rowGap: 8 }}>
                {food.ingredients.map((ing, i) => {
                  const ratio = mode === 'serving' ? servings : grams / gramsPerUnit;
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'baseline',
                      borderBottom: '1px dashed var(--line-soft)', paddingBottom: 6,
                    }}>
                      <span style={{ flex: 1, fontSize: 12.5, color: 'var(--ink-soft)' }}>{ing.foodName}</span>
                      <span style={{
                        fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                        fontSize: 12.5, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums',
                      }}>{r1(ing.grams * ratio)}<span style={{ fontSize: 10, color: 'var(--ink-mute)', marginLeft: 2 }}>g</span></span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI 补全按钮 */}
          {macrosMissing && getGroqKey() && (
            <button
              onClick={handleEnrich}
              disabled={enriching}
              style={{
                marginTop: 14, width: '100%', padding: '9px', borderRadius: 10,
                background: 'rgba(45,110,64,0.07)', border: '1px solid rgba(45,110,64,0.22)',
                color: '#2D6E40', fontSize: 12, cursor: enriching ? 'default' : 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {enriching ? '⟳ AI 补全中…' : '🤖 AI 估算蛋白 / 碳水 / 脂肪'}
            </button>
          )}

          {/* 营养数据 */}
          <div className="nt-card" style={{ marginTop: 14, padding: '14px 16px 12px' }}>
            <SectionLabel zh="营养数据" en="nutrition" hint={`本次 ${totalGrams}g`} />
            <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              <MacroTile label="热量" value={kcal} unit="千卡" tint="var(--mustard)" />
              <MacroTile label="蛋白" value={prot} unit="克"   tint="var(--sky)"      />
              <MacroTile label="碳水" value={carb} unit="克"   tint="var(--persimmon)" />
              <MacroTile label="脂肪" value={fat}  unit="克"   tint="var(--tomato)"   />
            </div>
            {(fiber || sugar || sodium) && (
              <div style={{
                marginTop: 10, paddingTop: 10,
                borderTop: '1px dashed var(--line-soft)',
                display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                fontSize: 12, fontVariantNumeric: 'tabular-nums',
              }}>
                {fiber  && <SecNut label="膳食纤维" value={fiber}  unit="g"  />}
                {sugar  && <SecNut label="糖"       value={sugar}  unit="g"  />}
                {sodium && <SecNut label="钠"       value={sodium} unit="mg" />}
              </div>
            )}
            {(food.source === 'user_added' || food.source === 'ai_estimated') && (
              <div style={{
                marginTop: 10, paddingTop: 8, borderTop: '1px dashed var(--line-soft)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ fontSize: 13 }}>✎</span>
                <span className="nt-caveat" style={{ fontSize: 14, color: 'var(--ink-mute)' }}>
                  {food.source === 'ai_estimated' ? 'AI 估算数据' : '用户录入数据 · 来自营养价值表'}
                </span>
              </div>
            )}
          </div>

          <div style={{ height: 12 }} />
        </div>

        {/* Sticky footer */}
        <div style={{
          flexShrink: 0, padding: '12px 18px 22px',
          borderTop: '1px solid var(--line-soft)',
          background: 'var(--paper)',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <button
            onMouseDown={e => e.preventDefault()}
            onTouchEnd={e => { e.preventDefault(); e.stopPropagation(); handleConfirm(); }}
            onClick={handleConfirm}
            disabled={totalGrams <= 0}
            style={{
              width: '100%', height: 50,
              background: 'var(--ink)', color: 'var(--paper)',
              border: 'none', borderRadius: 14,
              fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 14px rgba(31,41,32,0.18)',
              opacity: totalGrams <= 0 ? 0.4 : 1,
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>＋</span>
            <span>添加 · {kcal} 千卡</span>
            <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 4 }}>{totalGrams}g</span>
          </button>
          <button
            onMouseDown={e => e.preventDefault()}
            onTouchEnd={e => { e.preventDefault(); onBack(); }}
            onClick={onBack}
            style={{
              width: '100%', height: 40,
              background: 'transparent', color: 'var(--ink-mute)',
              border: '1px dashed var(--line)',
              borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >↵ 返回</button>
        </div>
      </div>
    </div>
  );
}

// ─── Helper components ─────────────────────────────────────────

function SectionLabel({ zh, en, hint }: { zh: string; en: string; hint?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <span className="nt-serif" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{zh}</span>
      <span className="nt-caveat" style={{ fontSize: 13, color: 'var(--tomato)' }}>{en}</span>
      <span style={{ flex: 1 }} />
      {hint && <span style={{ fontSize: 10, color: 'var(--ink-mute)' }}>{hint}</span>}
    </div>
  );
}

function MacroTile({ label, value, unit, tint }: { label: string; value: string; unit: string; tint: string }) {
  return (
    <div style={{
      background: `color-mix(in oklab, ${tint} 14%, var(--card))`,
      border: `1px solid color-mix(in oklab, ${tint} 22%, var(--line-soft))`,
      borderRadius: 12, padding: '10px 4px 8px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    }}>
      <div style={{ fontSize: 10.5, color: tint, fontWeight: 600, letterSpacing: 0.5 }}>{label}</div>
      <div className="nt-display" style={{
        fontSize: 22, color: tint, lineHeight: 1.05, fontVariantNumeric: 'tabular-nums',
      }}>{value}</div>
      <div style={{ fontSize: 9.5, color: `color-mix(in oklab, ${tint} 70%, var(--ink-mute))` }}>{unit}</div>
    </div>
  );
}

function PortionChip({ label, sub, active, onClick }: { label: string; sub: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      flex: '1 1 0', minWidth: 70,
      padding: '7px 10px 8px',
      background: active ? 'color-mix(in oklab, var(--sage) 12%, var(--card))' : 'var(--card)',
      border: `1px solid ${active ? 'color-mix(in oklab, var(--sage) 40%, var(--line))' : 'var(--line-soft)'}`,
      borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
      whiteSpace: 'nowrap',
      boxShadow: active ? '0 0 0 2px color-mix(in oklab, var(--sage) 18%, transparent)' : 'none',
    }}>
      <span className="nt-serif" style={{
        fontSize: 14, fontWeight: 700,
        color: active ? 'var(--moss)' : 'var(--ink)', fontVariantNumeric: 'tabular-nums',
      }}>{label}</span>
      <span style={{
        fontSize: 10.5,
        color: active ? 'color-mix(in oklab, var(--moss) 70%, var(--ink-mute))' : 'var(--ink-mute)',
        fontVariantNumeric: 'tabular-nums',
      }}>{sub}</span>
    </button>
  );
}

function SecNut({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
      <span style={{ color: 'var(--ink-mute)' }}>{label}</span>
      <span style={{ color: 'var(--ink)', fontWeight: 600 }}>
        {value}<span style={{ color: 'var(--ink-mute)', fontWeight: 400, marginLeft: 1, fontSize: 10 }}>{unit}</span>
      </span>
    </span>
  );
}
