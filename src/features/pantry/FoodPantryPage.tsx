// ============================================
// 我的食材库 — 管理自定义食物（含 Firestore 同步）
// 支持：扫码录入包装袋、组合食材、删除、添加到今日记录
// ============================================

import { useState, useCallback, useEffect } from 'react';
import { useSwipeDown } from '../../hooks/useSwipeDown';
import { BottomReturnButton } from '../../components/ui/BottomReturnButton';
import { useLocale } from '../../i18n/useLocale';
import { localizeServingLabel, localizeUnit } from '../../utils/servingLabels';
import type { FoodItem } from '../../types/food';
import {
  getAllCustomFoods, deleteCustomFood, recordToFoodItem, mergeCustomFoods, updateCustomFood,
} from '../../utils/customFoods';
import type { CustomFoodRecord } from '../../utils/customFoods';
import { getUserFoods, saveUserFood, deleteUserFood, getFamily, getFamilyMemberFoods } from '../../services/firestore';
import type { DocumentData } from 'firebase/firestore';
import { formatNumber } from '../../utils/calculator';
import { NutritionLabelScanner } from '../food-log/NutritionLabelScanner';
import { RecipeBuilder } from '../food-log/RecipeBuilder';

function PantryNutritionSheet({ record, onClose }: { record: CustomFoodRecord; onClose: () => void }) {
  const { t, locale } = useLocale();
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  const n = record.per100g;
  const rows = [
    { label: t('protein'),      value: n.protein,      unit: 'g'  },
    { label: t('carbs'),        value: n.carbs,        unit: 'g'  },
    { label: t('fat'),          value: n.fat,          unit: 'g'  },
    { label: t('fiber'),        value: n.fiber,        unit: 'g'  },
    ...(n.sugar        != null ? [{ label: t('sugar'),       value: n.sugar,       unit: 'g'  }] : []),
    ...(n.saturatedFat != null ? [{ label: t('saturatedFat'), value: n.saturatedFat, unit: 'g' }] : []),
    ...(n.sodium       != null ? [{ label: t('sodium'),      value: n.sodium,      unit: 'mg' }] : []),
    ...(n.omega3       != null ? [{ label: t('omega3'),      value: n.omega3,      unit: 'mg' }] : []),
    ...(n.vitaminC     != null ? [{ label: t('vitaminC'),    value: n.vitaminC,    unit: 'mg' }] : []),
    ...(n.calcium      != null ? [{ label: t('calcium'),     value: n.calcium,     unit: 'mg' }] : []),
    ...(n.iron         != null ? [{ label: t('iron'),        value: n.iron,        unit: 'mg' }] : []),
    ...(n.potassium    != null ? [{ label: t('potassium'),   value: n.potassium,   unit: 'mg' }] : []),
  ];

  const { cardRef, dragHandlers } = useSwipeDown(onClose);

  return (
    <div
      style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}
      onClick={onClose}
    >
      <div
        ref={cardRef}
        className="bg-white w-full max-w-lg mx-auto rounded-t-2xl modal-enter flex flex-col"
        style={{ maxHeight: 'calc(var(--vvh, 100vh) - 60px)' }}
        onClick={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
        onTouchMove={e => e.stopPropagation()}
        onTouchEnd={e => e.stopPropagation()}
      >
        {/* 拖动条 */}
        <div
          className="flex justify-center pt-3 pb-1 shrink-0 cursor-grab"
          style={{ touchAction: 'none' }}
          {...dragHandlers}
        >
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        {/* 标题 */}
        <div className="px-5 pt-2 pb-4 border-b border-gray-100 flex items-start gap-3 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 text-base">{record.name}</div>
            <div className="text-sm text-gray-400 mt-0.5">{t('perHundredG')}</div>
          </div>
          {record.imageDataUrl && (
            <img
              src={record.imageDataUrl}
              alt="营养标签"
              onClick={() => setZoomImg(record.imageDataUrl!)}
              className="w-16 h-16 object-cover rounded-xl border border-gray-100 shrink-0 cursor-zoom-in active:scale-95 transition-transform"
            />
          )}
        </div>
        {/* 滚动内容 */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="flex items-baseline justify-center gap-1 py-5">
            <span className="text-4xl font-bold text-green-600">{n.calories}</span>
            <span className="text-sm text-gray-400">{localizeUnit('kcal', locale)} / 100{localizeUnit('g', locale)}</span>
          </div>
          <div className="px-5 grid grid-cols-2 gap-2 pb-2">
            {rows.map(r => (
              <div key={r.label} className="bg-gray-50 rounded-xl px-4 py-3 flex justify-between items-center">
                <span className="text-sm text-gray-500">{r.label}</span>
                <span className="text-sm font-semibold text-gray-800">{formatNumber(r.value)}{localizeUnit(r.unit, locale)}</span>
              </div>
            ))}
          </div>
          {/* 组合食材的食材配比 */}
          {record.ingredients && record.ingredients.length > 0 && (
            <div className="px-5 pb-4 mt-2">
              <div className="text-sm font-semibold text-gray-700 mb-2">食材配比</div>
              <div className="grid grid-cols-2 gap-2">
                {record.ingredients.map((ing, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl px-4 py-2.5 flex justify-between items-center">
                    <span className="text-sm text-gray-500 flex-1 min-w-0 truncate mr-2">{ing.foodName}</span>
                    <span className="text-sm font-semibold text-gray-800 shrink-0">{ing.grams}g</span>
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-400 mt-2 text-center">共 {record.ingredients.reduce((s, i) => s + i.grams, 0)}g</div>
            </div>
          )}
          <div style={{ height: 8 }} />
        </div>
        <BottomReturnButton onClick={onClose} />
      </div>

      {/* 图片放大 lightbox */}
      {zoomImg && (
        <div
          className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center"
          onClick={() => setZoomImg(null)}
        >
          <img src={zoomImg} alt="营养标签大图" className="max-w-full max-h-full object-contain rounded-xl" />
        </div>
      )}
    </div>
  );
}

// ── Helper sub-components ─────────────────────────────────────────────────

function MiniKindDot({ source }: { source?: string }) {
  const isScan = source === 'scanned';
  const color = isScan ? 'var(--sky)' : 'var(--moss)';
  const glyph = isScan ? '📷' : '🍽️';
  return (
    <span style={{
      flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 16, height: 16, borderRadius: 5, fontSize: 9,
      background: `color-mix(in oklab, ${color} 14%, var(--card))`,
      color, border: `1px solid color-mix(in oklab, ${color} 25%, var(--line-soft))`,
    }}>{glyph}</span>
  );
}

function MiniMacroTile({ label, value, unit, tint }: { label: string; value: number; unit: string; tint: string }) {
  return (
    <div style={{
      padding: '6px 4px 5px', borderRadius: 8,
      background: `color-mix(in oklab, ${tint} 12%, var(--card))`,
      border: `1px solid color-mix(in oklab, ${tint} 20%, var(--line-soft))`,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div className="nt-serif" style={{ fontSize: 9, color: tint, fontWeight: 600, letterSpacing: 0.4 }}>{label}</div>
      <div className="nt-display" style={{ fontSize: 15, color: tint, lineHeight: 1.1 }}>
        {formatNumber(value)}<span style={{ fontSize: 8, marginLeft: 1, opacity: 0.7 }}>{unit}</span>
      </div>
    </div>
  );
}

// ── Types ────────────────────────────────────────────────────────────────

interface FoodPantryPageProps {
  onClose: () => void;
  userId?: string;
  familyId?: string;
  /** 可选：添加到今日饮食日志 */
  onAddToLog?: (food: FoodItem) => void;
}

type SubView = 'list' | 'scanner' | 'recipe';
type CloudStatus = 'idle' | 'syncing' | 'synced' | 'error';

export function FoodPantryPage({ onClose, userId, familyId, onAddToLog }: FoodPantryPageProps) {
  const { t, locale } = useLocale();
  const [subView, setSubView] = useState<SubView>('list');
  const [editingRecipe, setEditingRecipe] = useState<CustomFoodRecord | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<CustomFoodRecord | null>(null);
  const [records, setRecords] = useState<CustomFoodRecord[]>(() => getAllCustomFoods());
  const [familyRecords, setFamilyRecords] = useState<CustomFoodRecord[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [addedId, setAddedId] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>('idle');

  // ── New UI state ──────────────────────────────────────────────────────
  const [density, setDensity] = useState<'list' | 'card' | 'grid'>('card');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'scanned' | 'combined'>('all');

  const refresh = useCallback(() => {
    const foods = getAllCustomFoods();
    console.log('[FoodPantry] refresh → records count:', foods.length, foods.map(r => r.name));
    setRecords(foods);
  }, []);

  // Refresh whenever scanner/recipe sub-view closes back to list
  useEffect(() => {
    if (subView === 'list') refresh();
  }, [subView, refresh]);

  // ── 打开时从 Firestore 拉取并合并 ─────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    setCloudStatus('syncing');
    getUserFoods(userId)
      .then(data => {
        if (data.length > 0) {
          mergeCustomFoods(data as CustomFoodRecord[]);
          setRecords(getAllCustomFoods());
        }
        setCloudStatus('synced');
      })
      .catch(() => {
        // 拉取失败不影响本地数据
        setCloudStatus('error');
      });
  }, [userId]);

  // ── 加载家庭成员食物 ────────────────────────────────────────────
  useEffect(() => {
    if (!familyId || !userId) {
      setFamilyRecords([]);
      return;
    }
    getFamily(familyId)
      .then(family => {
        if (!family) return [];
        const memberUids = family.members.map(m => m.uid);
        return getFamilyMemberFoods(memberUids, userId);
      })
      .then(rawFoods => {
        const sorted = (rawFoods as CustomFoodRecord[]).sort(
          (a, b) => b.createdAt.localeCompare(a.createdAt)
        );
        setFamilyRecords(sorted);
      })
      .catch((err) => {
        console.error('[FoodPantry] 加载家庭成员食物失败:', err);
        setFamilyRecords([]);
      });
  }, [familyId, userId]);

  // ── 推送单条到 Firestore ──────────────────────────────────────────
  const pushOne = useCallback(async (record: CustomFoodRecord) => {
    if (!userId) return;
    setCloudStatus('syncing');
    try {
      const { imageDataUrl: _img, ...recordForCloud } = record;
      await saveUserFood(userId, recordForCloud as unknown as DocumentData, familyId);
      setCloudStatus('synced');
    } catch {
      setCloudStatus('error');
    }
  }, [userId]);

  // ── 回调：保存后刷新 + 推 Firestore ──────────────────────────────
  const handleSaved = useCallback((food: FoodItem) => {
    console.log('[FoodPantry] handleSaved called, food.id:', food.id, 'name:', food.name);
    refresh();
    setSubView('list');
    setAddedId(food.id);
    setTimeout(() => setAddedId(null), 3000);

    // 找到刚保存的 record 推到云端
    const allRecords = getAllCustomFoods();
    const saved = allRecords.find(r => r.id === food.id);
    if (saved) pushOne(saved);
  }, [refresh, pushOne]);

  // ── 删除 ─────────────────────────────────────────────────────────
  const handleDelete = useCallback((id: string) => {
    deleteCustomFood(id);
    refresh();
    setDeleteConfirm(null);
    if (userId) {
      deleteUserFood(userId, id).catch(console.warn);
    }
  }, [userId, refresh]);

  const handleRename = useCallback(async (id: string, newName: string) => {
    if (!newName.trim()) return;
    updateCustomFood(id, { name: newName.trim() });
    refresh();
    setRenamingId(null);
    if (userId) {
      const all = getAllCustomFoods();
      const updated = all.find(r => r.id === id);
      if (updated) pushOne(updated);
    }
  }, [userId, refresh, pushOne]);

  // ── 手动重新同步 ──────────────────────────────────────────────────
  const handleForceSync = useCallback(async () => {
    if (!userId) return;
    setCloudStatus('syncing');
    try {
      // 1. 把本地所有 push 上去
      const all = getAllCustomFoods();
      await Promise.all(all.map(r => {
        const { imageDataUrl: _img, ...rForCloud } = r;
        return saveUserFood(userId, rForCloud as unknown as DocumentData, familyId);
      }));
      // 2. 再 pull 合并
      const data = await getUserFoods(userId);
      if (data.length > 0) mergeCustomFoods(data as CustomFoodRecord[]);
      setRecords(getAllCustomFoods());
      setCloudStatus('synced');
    } catch {
      setCloudStatus('error');
    }
  }, [userId]);

  const handleAddToLog = (record: CustomFoodRecord) => {
    if (!onAddToLog) return;
    onAddToLog(recordToFoodItem(record));
  };

  // ── 子视图 ─────────────────────────────────────────────────────────
  if (subView === 'scanner') {
    return (
      <NutritionLabelScanner
        onClose={() => setSubView('list')}
        onSaved={handleSaved}
        userId={userId}
      />
    );
  }

  if (subView === 'recipe') {
    return (
      <RecipeBuilder
        onClose={() => { setSubView('list'); setEditingRecipe(null); }}
        onSaved={record => { setEditingRecipe(null); handleSaved(record); }}
        existingRecord={editingRecipe ?? undefined}
        userId={userId}
        familyId={familyId}
      />
    );
  }

  // ── Computed values ───────────────────────────────────────────────
  const byTab = records.filter(r =>
    tab === 'all' ? true :
    tab === 'scanned' ? r.pantrySource === 'scanned' :
    r.pantrySource === 'recipe' || r.pantrySource === 'manual'
  );
  const filtered = search.trim()
    ? byTab.filter(r => r.name.toLowerCase().includes(search.trim().toLowerCase()))
    : byTab;

  const counts = {
    all: records.length,
    scan: records.filter(r => r.pantrySource === 'scanned').length,
    combo: records.filter(r => r.pantrySource !== 'scanned').length,
  };

  // ── 主列表 ──────────────────────────────────────────────────────────
  return (
    <div
      className="nt-paper nt-grain"
      style={{
        position: 'fixed', inset: 0, top: 'var(--vvt, 0px)', height: 'var(--vvh, 100vh)',
        zIndex: 40, display: 'flex', flexDirection: 'column', overflowY: 'auto',
      }}
      onTouchStart={e => { (e.currentTarget as HTMLDivElement).dataset.sx = String(e.touches[0].clientX); (e.currentTarget as HTMLDivElement).dataset.sy = String(e.touches[0].clientY); }}
      onTouchEnd={e => {
        const sx = parseFloat((e.currentTarget as HTMLDivElement).dataset.sx ?? '999');
        const sy = parseFloat((e.currentTarget as HTMLDivElement).dataset.sy ?? '0');
        const dx = e.changedTouches[0].clientX - sx;
        const dy = e.changedTouches[0].clientY - sy;
        if (sx < 60 && dx > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) onClose();
      }}
    >

      {/* Header: back + title/subtitle(with sync dot) + scan + combine */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 10px) 16px 0', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: 'transparent', border: '1px solid var(--line)', color: 'var(--ink-soft)', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>‹</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="nt-display" style={{ fontSize: 20, color: 'var(--ink)', lineHeight: 1.1 }}>食材库</div>
          <button
            onClick={handleForceSync}
            disabled={cloudStatus === 'syncing' || !userId}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}
          >
            <span style={{ fontSize: 10, color: cloudStatus === 'error' ? 'var(--tomato)' : cloudStatus === 'synced' ? 'var(--sage)' : 'var(--ink-mute)' }}>
              {cloudStatus === 'syncing' ? '⟳' : cloudStatus === 'error' ? '⚠' : '☁'}
            </span>
            <span className="nt-serif" style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
              {records.length} 件 · {cloudStatus === 'syncing' ? '同步中' : cloudStatus === 'synced' ? '已同步' : cloudStatus === 'error' ? '点击重试' : '未同步'}
            </span>
          </button>
        </div>
        {/* Scan button */}
      </div>

      {/* Search + density toggle */}
      <div style={{ padding: '10px 16px 0', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        {/* Search input */}
        <div className="nt-card" style={{ flex: 1, height: 36, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 12, minWidth: 0 }}>
          <span style={{ fontSize: 13, color: 'var(--ink-mute)', flexShrink: 0 }}>⌕</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜索食材"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: 'var(--ink)', fontFamily: 'inherit', minWidth: 0 }}
          />
        </div>
        {/* Density toggle */}
        <div style={{ display: 'flex', height: 36, padding: 3, background: 'var(--card)', border: '1px solid var(--line-soft)', borderRadius: 12, flexShrink: 0 }}>
          {([['list', '☰'], ['card', '▤'], ['grid', '⊞']] as [typeof density, string][]).map(([k, g]) => (
            <button key={k} onClick={() => setDensity(k)} style={{
              width: 28, borderRadius: 9, border: 'none', cursor: 'pointer',
              background: density === k ? 'var(--paper-2)' : 'transparent',
              color: density === k ? 'var(--ink)' : 'var(--ink-mute)',
              fontSize: 13,
            }}>{g}</button>
          ))}
        </div>
      </div>

      {/* Section label + tabs */}
      <div style={{ padding: '16px 22px 6px', display: 'flex', alignItems: 'baseline', gap: 10, flexShrink: 0 }}>
        <span className="nt-serif" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>你的食材库</span>
        <span className="nt-caveat" style={{ fontSize: 14, color: 'var(--tomato)' }}>your pantry</span>
      </div>
      <div style={{ padding: '0 22px 8px', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        {[
          { k: 'all' as const, l: '全部', n: counts.all },
          { k: 'scanned' as const, l: '扫码', n: counts.scan },
          { k: 'combined' as const, l: '组合', n: counts.combo },
        ].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} style={{
            background: 'transparent', border: 'none', padding: '4px 0', cursor: 'pointer', fontFamily: 'inherit',
            color: tab === t.k ? 'var(--ink)' : 'var(--ink-mute)',
            fontWeight: tab === t.k ? 700 : 400, fontSize: 13,
            borderBottom: '1.5px solid ' + (tab === t.k ? 'var(--ink)' : 'transparent'),
          }}>
            {t.l} <span style={{ fontSize: 10, color: 'var(--ink-mute)', fontWeight: 400 }}>{t.n}</span>
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📦</div>
          <div className="nt-serif" style={{ fontSize: 14, color: 'var(--ink-mute)' }}>
            {records.length === 0 ? '食材库还是空的' : '没有匹配的食材'}
          </div>
          <div className="nt-serif" style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 4 }}>
            {records.length === 0 ? '点击 📷 扫包装袋，或 🍽️ 自定义食物' : '换个关键词试试'}
          </div>
        </div>
      )}

      {/* addedId banner */}
      {addedId && (
        <div style={{ margin: '4px 18px', padding: '8px 14px', background: 'color-mix(in oklab, var(--sage) 12%, var(--card))', borderRadius: 10, border: '1px solid color-mix(in oklab, var(--sage) 30%, var(--line-soft))', fontSize: 12, color: 'var(--moss)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>✓</span>
          <span>已保存（食材总数: {records.length}）</span>
        </div>
      )}

      {/* List density */}
      {density === 'list' && filtered.length > 0 && (
        <div className="nt-card" style={{ margin: '0 18px 4px', padding: '4px 10px' }}>
          {filtered.map((rec, i, arr) => (
            <div key={rec.id}>
              {deleteConfirm === rec.id ? (
                <div onClick={e => e.stopPropagation()} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px',
                  borderBottom: i < arr.length - 1 ? '1px dashed var(--line-soft)' : 'none',
                }}>
                  <div className="nt-serif" style={{ flex: 1, fontSize: 13, color: 'var(--ink-mute)' }}>删除「{rec.name}」？</div>
                  <button onClick={() => setDeleteConfirm(null)} style={{ fontSize: 12, color: 'var(--ink-mute)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>取消</button>
                  <button onClick={() => handleDelete(rec.id)} style={{ fontSize: 12, color: 'var(--paper)', background: 'var(--tomato)', border: 'none', cursor: 'pointer', padding: '4px 10px', borderRadius: 8 }}>删除</button>
                </div>
              ) : renamingId === rec.id ? (
                <div onClick={e => e.stopPropagation()} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 8px',
                  borderBottom: i < arr.length - 1 ? '1px dashed var(--line-soft)' : 'none',
                }}>
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRename(rec.id, renameValue);
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                    style={{ flex: 1, fontSize: 13, border: 'none', borderBottom: '1px solid var(--sage)', outline: 'none', background: 'transparent', color: 'var(--ink)', fontFamily: 'inherit', padding: '2px 0' }}
                  />
                  <button onClick={() => handleRename(rec.id, renameValue)} style={{ fontSize: 11, color: 'var(--moss)', background: 'transparent', border: 'none', cursor: 'pointer' }}>保存</button>
                  <button onClick={() => setRenamingId(null)} style={{ fontSize: 11, color: 'var(--ink-mute)', background: 'transparent', border: 'none', cursor: 'pointer' }}>取消</button>
                </div>
              ) : (
                <div onClick={() => setSelectedRecord(rec)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px',
                  borderBottom: i < arr.length - 1 ? '1px dashed var(--line-soft)' : 'none',
                  cursor: 'pointer',
                }}>
                  {/* kind icon */}
                  <div style={{
                    flexShrink: 0, width: 36, height: 36, borderRadius: 10, fontSize: 14,
                    background: rec.pantrySource === 'scanned'
                      ? 'color-mix(in oklab, var(--sky) 12%, var(--card))'
                      : 'color-mix(in oklab, var(--moss) 10%, var(--card))',
                    color: rec.pantrySource === 'scanned' ? 'var(--sky)' : 'var(--moss)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid ' + (rec.pantrySource === 'scanned'
                      ? 'color-mix(in oklab, var(--sky) 18%, var(--line-soft))'
                      : 'color-mix(in oklab, var(--moss) 18%, var(--line-soft))'),
                  }}>{rec.pantrySource === 'scanned' ? '📷' : '🍽️'}</div>
                  {/* name */}
                  <div className="nt-serif" style={{ flex: 1, fontSize: 14, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.name}</div>
                  {/* kcal */}
                  <div style={{ flexShrink: 0, textAlign: 'right', minWidth: 60 }}>
                    <div className="nt-display" style={{ fontSize: 18, color: 'var(--mustard)', lineHeight: 1 }}>{rec.per100g.calories}</div>
                    <div className="nt-serif" style={{ fontSize: 9, color: 'var(--ink-mute)', marginTop: 2 }}>千卡/100g</div>
                  </div>
                  {/* edit/delete actions */}
                  <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    {rec.pantrySource === 'recipe' && (
                      <button onClick={() => { setEditingRecipe(rec); setSubView('recipe'); }} style={{ fontSize: 12, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-mute)', padding: '2px 4px' }} title="编辑配料">✏️</button>
                    )}
                    <button onClick={() => { setRenamingId(rec.id); setRenameValue(rec.name); }} style={{ fontSize: 11, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-mute)', padding: '2px 4px' }} title="改名">Aa</button>
                    <button onClick={() => setDeleteConfirm(rec.id)} style={{ fontSize: 16, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-mute)', padding: '2px 4px', lineHeight: 1 }}>×</button>
                  </div>
                  {/* quick add */}
                  {onAddToLog && (
                    <button onClick={e => { e.stopPropagation(); handleAddToLog(rec); }} style={{
                      flexShrink: 0, width: 28, height: 28, borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      background: 'color-mix(in oklab, var(--sage) 14%, var(--card))',
                      border: '1px solid color-mix(in oklab, var(--sage) 35%, var(--line-soft))',
                      color: 'var(--moss)',
                    }}>＋</button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Card density */}
      {density === 'card' && filtered.length > 0 && (
        <div style={{ padding: '0 18px 4px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(rec => (
            <div key={rec.id} className="nt-card" onClick={() => setSelectedRecord(rec)} style={{ padding: '12px 14px', cursor: 'pointer' }}>
              {/* header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {renamingId === rec.id ? (
                      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleRename(rec.id, renameValue);
                            if (e.key === 'Escape') setRenamingId(null);
                          }}
                          style={{ flex: 1, fontSize: 14, border: 'none', borderBottom: '1px solid var(--sage)', outline: 'none', background: 'transparent', color: 'var(--ink)', fontFamily: 'inherit', padding: '2px 0' }}
                        />
                        <button onClick={() => handleRename(rec.id, renameValue)} style={{ fontSize: 11, color: 'var(--moss)', background: 'transparent', border: 'none', cursor: 'pointer' }}>保存</button>
                        <button onClick={() => setRenamingId(null)} style={{ fontSize: 11, color: 'var(--ink-mute)', background: 'transparent', border: 'none', cursor: 'pointer' }}>取消</button>
                      </div>
                    ) : deleteConfirm === rec.id ? (
                      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                        <span className="nt-serif" style={{ flex: 1, fontSize: 12, color: 'var(--ink-mute)' }}>删除「{rec.name}」？</span>
                        <button onClick={() => setDeleteConfirm(null)} style={{ fontSize: 11, color: 'var(--ink-mute)', background: 'transparent', border: 'none', cursor: 'pointer' }}>取消</button>
                        <button onClick={() => handleDelete(rec.id)} style={{ fontSize: 11, color: 'var(--paper)', background: 'var(--tomato)', border: 'none', cursor: 'pointer', padding: '2px 8px', borderRadius: 6 }}>删除</button>
                      </div>
                    ) : (
                      <>
                        <span className="nt-serif" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.name}</span>
                        <MiniKindDot source={rec.pantrySource} />
                        {/* edit/delete */}
                        <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 'auto' }}>
                          {rec.pantrySource === 'recipe' && (
                            <button onClick={() => { setEditingRecipe(rec); setSubView('recipe'); }} style={{ fontSize: 11, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-mute)', padding: '2px 3px' }} title="编辑配料">✏️</button>
                          )}
                          <button onClick={() => { setRenamingId(rec.id); setRenameValue(rec.name); }} style={{ fontSize: 10, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-mute)', padding: '2px 3px' }} title="改名">Aa</button>
                          <button onClick={() => setDeleteConfirm(rec.id)} style={{ fontSize: 14, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-mute)', padding: '2px 3px', lineHeight: 1 }}>×</button>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="nt-serif" style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span>记录于 {new Date(rec.createdAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}</span>
                  </div>
                </div>
                {onAddToLog && renamingId !== rec.id && deleteConfirm !== rec.id && (
                  <button onClick={e => { e.stopPropagation(); handleAddToLog(rec); }} style={{
                    flexShrink: 0, width: 28, height: 28, borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    background: 'color-mix(in oklab, var(--sage) 14%, var(--card))',
                    border: '1px solid color-mix(in oklab, var(--sage) 35%, var(--line-soft))',
                    color: 'var(--moss)',
                  }}>＋</button>
                )}
              </div>
              {/* mini macro grid */}
              <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                <MiniMacroTile label="热量" value={rec.per100g.calories} unit="kcal" tint="var(--mustard)" />
                <MiniMacroTile label="蛋白" value={rec.per100g.protein} unit="g" tint="var(--sky)" />
                <MiniMacroTile label="碳水" value={rec.per100g.carbs} unit="g" tint="var(--persimmon)" />
                <MiniMacroTile label="脂肪" value={rec.per100g.fat} unit="g" tint="var(--tomato)" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grid density */}
      {density === 'grid' && filtered.length > 0 && (
        <div style={{ padding: '0 18px 4px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {filtered.map(rec => (
            <div key={rec.id} className="nt-card" onClick={() => setSelectedRecord(rec)} style={{ padding: '12px 11px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                {deleteConfirm === rec.id ? (
                  <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                    <span className="nt-serif" style={{ fontSize: 11, color: 'var(--ink-mute)' }}>删除「{rec.name}」？</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => setDeleteConfirm(null)} style={{ fontSize: 10, color: 'var(--ink-mute)', background: 'transparent', border: 'none', cursor: 'pointer' }}>取消</button>
                      <button onClick={() => handleDelete(rec.id)} style={{ fontSize: 10, color: 'var(--paper)', background: 'var(--tomato)', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 6 }}>删除</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="nt-serif" style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{rec.name}</div>
                    <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                      <MiniKindDot source={rec.pantrySource} />
                      <button onClick={() => setDeleteConfirm(rec.id)} style={{ fontSize: 12, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-mute)', lineHeight: 1, padding: 0 }}>×</button>
                    </div>
                  </>
                )}
              </div>
              <div style={{ padding: '4px 0', borderTop: '1px dashed var(--line-soft)', borderBottom: '1px dashed var(--line-soft)', textAlign: 'center' }}>
                <div className="nt-display" style={{ fontSize: 24, color: 'var(--mustard)', lineHeight: 1 }}>{rec.per100g.calories}</div>
                <div className="nt-serif" style={{ fontSize: 9, color: 'var(--ink-mute)', marginTop: 2 }}>千卡 / 100g</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5 }}>
                <span style={{ color: 'var(--sky)' }}>蛋<strong style={{ marginLeft: 2 }}>{rec.per100g.protein}</strong></span>
                <span style={{ color: 'var(--persimmon)' }}>碳<strong style={{ marginLeft: 2 }}>{rec.per100g.carbs}</strong></span>
                <span style={{ color: 'var(--tomato)' }}>脂<strong style={{ marginLeft: 2 }}>{rec.per100g.fat}</strong></span>
              </div>
              {onAddToLog && deleteConfirm !== rec.id && (
                <button onClick={e => { e.stopPropagation(); handleAddToLog(rec); }} style={{
                  padding: '7px 0', borderRadius: 9, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  background: 'color-mix(in oklab, var(--sage) 12%, var(--card))',
                  border: '1px dashed color-mix(in oklab, var(--sage) 45%, var(--line))',
                  color: 'var(--moss)',
                }}>＋ 加到今日</button>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ height: 40 }} />

      {selectedRecord && (
        <PantryNutritionSheet record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      )}
    </div>
  );
}
