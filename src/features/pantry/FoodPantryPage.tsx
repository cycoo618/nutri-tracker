// ============================================
// 我的食材库 — 管理自定义食物（含 Firestore 同步）
// 支持：扫码录入包装袋、组合食材、删除、添加到今日记录
// ============================================

import { useState, useCallback, useEffect } from 'react';
import { useSwipeDown } from '../../hooks/useSwipeDown';
import { BottomReturnButton } from '../../components/ui/BottomReturnButton';
import { useLocale } from '../../i18n/useLocale';
import { localizeServingLabel } from '../../utils/servingLabels';
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
  const { t } = useLocale();
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
      className="fixed inset-x-0 bg-black/40 z-50 flex items-end"
      style={{ top: 'var(--vvt, 0px)', height: 'var(--vvh, 100vh)' }}
      onClick={onClose}
    >
      <div
        ref={cardRef}
        className="bg-white w-full max-w-lg mx-auto rounded-t-2xl modal-enter flex flex-col overflow-y-auto max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        <div
          className="flex justify-center pt-3 pb-1 shrink-0 cursor-grab"
          style={{ touchAction: 'none' }}
          {...dragHandlers}
        >
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
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
        <div className="flex items-baseline justify-center gap-1 py-5">
          <span className="text-4xl font-bold text-green-600">{n.calories}</span>
          <span className="text-sm text-gray-400">kcal / 100g</span>
        </div>
        <div className="px-5 grid grid-cols-2 gap-2 pb-2">
          {rows.map(r => (
            <div key={r.label} className="bg-gray-50 rounded-xl px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-gray-500">{r.label}</span>
              <span className="text-sm font-semibold text-gray-800">{formatNumber(r.value)}{r.unit}</span>
            </div>
          ))}
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

  const refresh = useCallback(() => {
    setRecords(getAllCustomFoods());
  }, []);

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
        setFamilyRecords(rawFoods as CustomFoodRecord[]);
      })
      .catch(() => {
        setFamilyRecords([]);
      });
  }, [familyId, userId]);

  // ── 推送单条到 Firestore ──────────────────────────────────────────
  const pushOne = useCallback(async (record: CustomFoodRecord) => {
    if (!userId) return;
    setCloudStatus('syncing');
    try {
      await saveUserFood(userId, record as unknown as DocumentData);
      setCloudStatus('synced');
    } catch {
      setCloudStatus('error');
    }
  }, [userId]);

  // ── 回调：保存后刷新 + 推 Firestore ──────────────────────────────
  const handleSaved = useCallback((food: FoodItem) => {
    refresh();
    setSubView('list');
    setAddedId(food.id);
    setTimeout(() => setAddedId(null), 2000);

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
      await Promise.all(all.map(r => saveUserFood(userId, r as unknown as DocumentData)));
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
      />
    );
  }

  if (subView === 'recipe') {
    return (
      <RecipeBuilder
        onClose={() => { setSubView('list'); setEditingRecipe(null); }}
        onSaved={record => { setEditingRecipe(null); handleSaved(record); }}
        existingRecord={editingRecipe ?? undefined}
      />
    );
  }

  // ── 主列表 ──────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-x-0 bg-gray-50 z-40 flex flex-col" style={{ top: 'var(--vvt, 0px)', height: 'var(--vvh, 100vh)' }}>

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 shrink-0">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-14 shrink-0" />
          <h1 className="flex-1 text-center font-semibold text-gray-900">{t('pantryTitle')}</h1>
          {/* 云同步状态 */}
          <button
            onClick={handleForceSync}
            disabled={cloudStatus === 'syncing' || !userId}
            className="shrink-0 flex items-center gap-1 text-xs transition-colors disabled:cursor-default"
          >
            {cloudStatus === 'syncing' && (
              <span className="text-gray-400 flex items-center gap-1">
                <span className="w-3 h-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin inline-block" />
                {t('syncing')}
              </span>
            )}
            {cloudStatus === 'synced' && (
              <span className="text-green-500" style={{ fontSize: '0.8rem' }}>{t('synced')}</span>
            )}
            {cloudStatus === 'error' && (
              <span className="text-red-400">{t('retry')}</span>
            )}
            {cloudStatus === 'idle' && (
              <span className="text-gray-400">{records.length} {t('itemUnit')}</span>
            )}
          </button>
        </div>
      </header>

      {/* 操作按钮 */}
      <div className="max-w-lg mx-auto w-full px-4 pt-4 pb-2 shrink-0">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSubView('scanner')}
            className="py-3.5 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-semibold transition-colors shadow-sm"
          >
            {t('scanPackage')}
          </button>
          <button
            onClick={() => setSubView('recipe')}
            className="py-3.5 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-2xl text-sm font-semibold transition-colors shadow-sm"
          >
            {t('buildRecipe')}
          </button>
        </div>
      </div>

      {/* 食物列表 */}
      <div className="flex-1 overflow-y-auto max-w-lg mx-auto w-full px-4 pb-4">

        {/* ── 你的食材库 ───────────────────────────────────────────── */}
        <div className="pt-2">
          <div className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
            <span>🗄️</span>
            {t('myPantry')}
            {records.length === 0 && (
              <span className="text-xs text-gray-300 font-normal">{t('emptyLabel')}</span>
            )}
          </div>

          {records.length === 0 && familyRecords.length === 0 && (
            <div className="text-center py-10">
              <div className="text-5xl mb-4">📦</div>
              <div className="text-gray-600 font-medium mb-1">{t('pantryEmpty')}</div>
              <div className="text-gray-400 text-sm">{t('pantryEmptyHint')}</div>
            </div>
          )}

          {records.length > 0 && (
          <div className="space-y-3">
            {records.map(record => {
              const isNew = addedId === record.id;
              return (
                <div
                  key={record.id}
                  onClick={() => setSelectedRecord(record)}
                  className={`bg-white rounded-2xl border transition-all cursor-pointer active:scale-[0.99] ${
                    isNew
                      ? 'border-green-300 shadow-md shadow-green-50'
                      : 'border-gray-100 shadow-sm'
                  }`}
                >
                  <div className="p-4">
                    {/* 名称 + 新增标签 */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        {renamingId === record.id ? (
                          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            <input
                              autoFocus
                              value={renameValue}
                              onChange={e => setRenameValue(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleRename(record.id, renameValue);
                                if (e.key === 'Escape') setRenamingId(null);
                              }}
                              className="flex-1 text-sm font-semibold border-b border-green-400 focus:outline-none bg-transparent py-0.5"
                            />
                            <button onClick={() => handleRename(record.id, renameValue)} className="text-xs text-green-600 font-medium shrink-0">{t('save')}</button>
                            <button onClick={() => setRenamingId(null)} className="text-xs text-gray-400 shrink-0">{t('cancel')}</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900">{record.name}</span>
                            {isNew && (
                              <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full shrink-0">{t('savedBadge')}</span>
                            )}
                            {record.pantrySource === 'scanned' && (
                              <span className="text-xs bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded-full shrink-0">{t('tagScan')}</span>
                            )}
                            {record.pantrySource === 'recipe' && (
                              <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full shrink-0">{t('tagRecipe')}</span>
                            )}
                          </div>
                        )}
                        {record.servingSizes.length > 0 && renamingId !== record.id && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            {localizeServingLabel(record.servingSizes[0].label, locale)}
                          </div>
                        )}
                      </div>
                      {/* 编辑 + 删除 */}
                      {deleteConfirm === record.id ? (
                        <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                          <button onClick={() => setDeleteConfirm(null)} className="text-xs text-gray-400 hover:text-gray-600">{t('cancel')}</button>
                          <button onClick={() => handleDelete(record.id)} className="text-xs text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-lg transition-colors">{t('confirmDelete')}</button>
                        </div>
                      ) : renamingId !== record.id ? (
                        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                          {record.pantrySource === 'recipe' && (
                            <button
                              onClick={() => { setEditingRecipe(record); setSubView('recipe'); }}
                              className="text-gray-300 hover:text-blue-400 text-sm leading-none transition-colors"
                              title="编辑配料"
                            >✏️</button>
                          )}
                          <button
                            onClick={() => { setRenamingId(record.id); setRenameValue(record.name); }}
                            className="text-gray-300 hover:text-purple-400 text-xs leading-none transition-colors px-1"
                            title="改名"
                          >Aa</button>
                          <button onClick={() => setDeleteConfirm(record.id)} className="text-gray-300 hover:text-red-400 text-lg leading-none transition-colors">×</button>
                        </div>
                      ) : null}
                    </div>

                    {/* 营养数据 */}
                    <div className="grid grid-cols-4 gap-2 text-center mb-3">
                      <NutriBadge label={t('calories')} value={`${record.per100g.calories}`} unit="kcal" color="amber" />
                      <NutriBadge label={t('proteinShort')} value={formatNumber(record.per100g.protein)} unit="g" color="blue" />
                      <NutriBadge label={t('carbs')} value={formatNumber(record.per100g.carbs)} unit="g" color="orange" />
                      <NutriBadge label={t('fat')} value={formatNumber(record.per100g.fat)} unit="g" color="red" />
                    </div>
                    <div className="text-xs text-gray-400 mb-3 text-center">{t('perHundredG')}</div>

                    {/* 食材明细 */}
                    {record.ingredients.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-2.5 mb-3">
                        <div className="text-xs text-gray-400 mb-1.5">{t('ingredientsList')}</div>
                        <div className="flex flex-wrap gap-1.5">
                          {record.ingredients.map(ing => (
                            <span
                              key={ing.foodId}
                              className="text-xs bg-white border border-gray-100 rounded-lg px-2 py-0.5 text-gray-600"
                            >
                              {ing.foodName} {ing.grams}g
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 添加到今日 */}
                    {onAddToLog && (
                      <button
                        onClick={e => { e.stopPropagation(); handleAddToLog(record); }}
                        className="w-full py-2 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium rounded-xl transition-colors"
                      >
                        {t('addToLog')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>

        {/* ── 家庭食材库 ───────────────────────────────────────────── */}
        {familyRecords.length > 0 && (
          <div className="pt-4">
            <div className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
              <span>👨‍👩‍👧</span> {t('familyPantry')}
              <span className="text-xs text-gray-400 font-normal">{t('familyReadOnly')}</span>
            </div>
            <div className="space-y-3">
              {familyRecords.map((record, idx) => (
                <div
                  key={record.id || idx}
                  onClick={() => setSelectedRecord(record)}
                  className="bg-white rounded-2xl border border-green-100 shadow-sm cursor-pointer active:scale-[0.99] transition-transform"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900">{record.name}</span>
                          <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full shrink-0">
                            👨‍👩‍👧 {t('tagFamily')}
                          </span>
                        </div>
                        {record.servingSizes?.length > 0 && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            {localizeServingLabel(record.servingSizes[0].label, locale)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center mb-3">
                      <NutriBadge label={t('calories')} value={`${record.per100g.calories}`} unit="kcal" color="amber" />
                      <NutriBadge label={t('proteinShort')} value={formatNumber(record.per100g.protein)} unit="g" color="blue" />
                      <NutriBadge label={t('carbs')} value={formatNumber(record.per100g.carbs)} unit="g" color="orange" />
                      <NutriBadge label={t('fat')} value={formatNumber(record.per100g.fat)} unit="g" color="red" />
                    </div>
                    <div className="text-xs text-gray-400 mb-3 text-center">{t('perHundredG')}</div>
                    {onAddToLog && (
                      <button
                        onClick={e => { e.stopPropagation(); onAddToLog(recordToFoodItem(record)); }}
                        className="w-full py-2 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium rounded-xl transition-colors"
                      >
                        {t('addToLog')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 底部返回按钮 */}
      <div className="shrink-0 px-4 py-3 border-t border-gray-100 max-w-lg mx-auto w-full">
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 border border-gray-300 text-gray-600 font-medium transition-colors"
        >
          {t('back')}
        </button>
      </div>

      {selectedRecord && (
        <PantryNutritionSheet record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      )}
    </div>
  );
}

function NutriBadge({
  label, value, unit, color
}: {
  label: string; value: string; unit: string;
  color: 'amber' | 'blue' | 'orange' | 'red';
}) {
  const bg = {
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
    orange: 'bg-orange-50 text-orange-700',
    red: 'bg-red-50 text-red-700',
  }[color];

  return (
    <div className={`${bg} rounded-xl py-2 px-1`}>
      <div className="text-xs font-medium opacity-70">{label}</div>
      <div className="text-sm font-bold">{value}</div>
      <div className="text-xs opacity-60">{unit}</div>
    </div>
  );
}
