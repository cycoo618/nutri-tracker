// ============================================
// 食物搜索组件
// 三层搜索：自定义食物 → 内置数据库 → USDA 联网
// 顶部：常用食物快捷按钮 + 自定义食物按钮
// ============================================

import { useState, useEffect, useRef } from 'react';
import { useSwipeDown } from '../../hooks/useSwipeDown';
import type { FoodItem } from '../../types/food';
import { FOOD_CATEGORY_LABELS } from '../../types/food';
import { searchBuiltinFoods, searchOpenFoodFacts } from '../../services/food-lookup';
import { searchCustomFoods, recordToFoodItem } from '../../utils/customFoods';
import type { CustomFoodRecord } from '../../utils/customFoods';
import { getFamily, getFamilyMemberFoods, getUserFoods } from '../../services/firestore';
import { mergeCustomFoods } from '../../utils/customFoods';
import { GIBadge } from '../../components/ui/GIBadge';
import { ManualFoodEntry } from './ManualFoodEntry';
import { RecipeBuilder } from './RecipeBuilder';
import { NutritionLabelScanner } from './NutritionLabelScanner';
import type { RecentFoodEntry } from '../../utils/recentFoods';
import { estimateFoodNutrition, getGroqKey } from '../../services/nutrition-vision';
import { useLocale } from '../../i18n/useLocale';

interface FoodSearchProps {
  recentFoods?: RecentFoodEntry[];
  userId?: string;
  familyId?: string;
  onSelect: (food: FoodItem) => void;
  onClose: () => void;
}

type SearchState = 'idle' | 'searching_online' | 'done';
type View = 'search' | 'manual' | 'recipe' | 'scanner';

export function FoodSearch({ recentFoods = [], userId, familyId, onSelect, onClose }: FoodSearchProps) {
  const { t } = useLocale();
  const [view, setView] = useState<View>('search');
  const [query, setQuery] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [results, setResults] = useState<FoodItem[]>([]);
  const [familyResults, setFamilyResults] = useState<FoodItem[]>([]);
  const [onlineResults, setOnlineResults] = useState<FoodItem[]>([]);
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [onlineSearched, setOnlineSearched] = useState(false);
  const [onlineError, setOnlineError] = useState<string | null>(null);
  const [aiState, setAiState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [aiError, setAiError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isComposing = useRef(false);
  const { cardRef, dragHandlers, cardDragHandlers } = useSwipeDown(onClose);

  const handleAiEstimate = async () => {
    if (!query.trim()) return;
    setAiState('loading');
    setAiError(null);
    try {
      const nutrition = await estimateFoodNutrition(query.trim());
      const food: FoodItem = {
        id: `ai_${Date.now()}`,
        name: nutrition.name,
        category: 'other',
        source: 'ai_estimated',
        per100g: {
          calories: nutrition.calories,
          protein: nutrition.protein,
          carbs: nutrition.carbs,
          fat: nutrition.fat,
          fiber: nutrition.fiber,
          sodium: nutrition.sodium,
        },
        // 如果 AI 返回了份量信息，加进来 → AddFoodModal 默认显示"1份"，不要求填克数
        ...(nutrition.servingGrams && nutrition.servingGrams > 0
          ? { servingSizes: [{ label: nutrition.servingLabel ?? `1份 (${Math.round(nutrition.servingGrams)}g)`, grams: nutrition.servingGrams }] }
          : {}),
        tags: ['AI估算'],
      };
      setAiState('idle');
      onSelect(food);
    } catch (e) {
      setAiState('error');
      setAiError(e instanceof Error ? e.message : t('aiEstimateFailed'));
    }
  };

  // 只在首次打开时聚焦，不在子视图切回来时重新 focus
  const didFocus = useRef(false);
  useEffect(() => {
    if (view === 'search' && !didFocus.current) {
      didFocus.current = true;
      inputRef.current?.focus();
    }
  }, [view]);

  // 打开时从 Firestore 同步一次自定义食物（解决跨设备搜索不到的问题）
  useEffect(() => {
    if (!userId) return;
    getUserFoods(userId)
      .then(data => {
        if (data.length > 0) mergeCustomFoods(data as CustomFoodRecord[]);
      })
      .catch(e => console.warn('[FoodSearch] Firestore sync failed:', e));
  }, [userId]);

  // 搜索：本地结果立即显示；只有本地无结果时才 debounce 联网
  useEffect(() => {
    if (view !== 'search') return;
    if (isComposing.current) return;
    if (!query.trim()) {
      setResults([]);
      setFamilyResults([]);
      setOnlineResults([]);
      setSearchState('idle');
      setOnlineSearched(false);
      return;
    }

    // ── 本地搜索：立即同步执行，零延迟 ────────────────────────────
    const custom = searchCustomFoods(query);
    const builtin = searchBuiltinFoods(query);
    const localResults = [
      ...custom,
      ...builtin.filter(b => !custom.some(c => c.id === b.id)),
    ];

    // ── 家庭成员食物：始终异步加载，不依赖本地结果是否存在 ────────
    if (familyId && userId) {
      const q = query.trim().toLowerCase();
      getFamily(familyId)
        .then(family => {
          if (!family) return [];
          const memberUids = family.members.map(m => m.uid);
          return getFamilyMemberFoods(memberUids, userId);
        })
        .then(rawFoods => {
          const filtered = rawFoods.filter(f =>
            typeof f['name'] === 'string' && (f['name'] as string).toLowerCase().includes(q)
          );
          const foodItems: FoodItem[] = filtered.map(f => {
            const item = recordToFoodItem(f as CustomFoodRecord);
            return { ...item, tags: [...(item.tags ?? []), '家庭'] };
          });
          const localIds = new Set(localResults.map(r => r.id));
          setFamilyResults(foodItems.filter(fi => !localIds.has(fi.id)));
        })
        .catch(() => setFamilyResults([]));
    } else {
      setFamilyResults([]);
    }

    if (localResults.length > 0) {
      // 有本地结果 → 直接展示，不联网
      setResults(localResults);
      setOnlineResults([]);
      setOnlineError(null);
      setOnlineSearched(false);
      setSearchState('done');
      return;
    }

    // ── 本地无结果 → debounce 后联网 ──────────────────────────────
    setResults([]);
    setOnlineResults([]);
    setOnlineError(null);
    setOnlineSearched(false);
    setSearchState('searching_online');

    const timer = setTimeout(async () => {
      try {
        const online = await searchOpenFoodFacts(query);
        setResults(online);
        setOnlineResults(online);
        if (online.length === 0) setOnlineError(t('onlineNoResults'));
      } catch (err) {
        console.warn('Online search failed:', err);
        setOnlineError(t('onlineSearchError'));
      }
      setOnlineSearched(true);
      setSearchState('done');
    }, 400);

    return () => clearTimeout(timer);
  }, [query, view, searchTrigger]);

  const handleOnlineSearch = async () => {
    if (onlineSearched) return;
    setSearchState('searching_online');
    try {
      const online = await searchOpenFoodFacts(query);
      setOnlineResults(online);
      const existingIds = new Set(results.map(r => r.id));
      setResults([...results, ...online.filter(r => !existingIds.has(r.id))]);
    } catch (e) { console.warn('[FoodSearch] online search failed:', e); }
    setOnlineSearched(true);
    setSearchState('done');
  };

  if (view === 'manual') {
    return (
      <ManualFoodEntry
        initialName={query}
        onConfirm={food => onSelect(food)}
        onBack={() => setView('search')}
        onClose={onClose}
      />
    );
  }

  if (view === 'recipe') {
    return (
      <RecipeBuilder
        onClose={onClose}
        onSaved={food => onSelect(food)}
      />
    );
  }

  if (view === 'scanner') {
    return (
      <NutritionLabelScanner
        onClose={onClose}
        onSaved={food => onSelect(food)}
      />
    );
  }

  const noResults = searchState === 'done' && results.length === 0;
  const hasLocalResults = results.length > 0 && !onlineSearched;

  return (
    <div
      className="fixed inset-x-0 bg-black/40 z-50 flex items-end sm:items-center justify-center"
      style={{ top: 'var(--vvt, 0px)', height: 'var(--vvh, 100vh)' }}
      onClick={onClose}
    >
      <div
        ref={cardRef}
        className="modal-enter bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl flex flex-col"
        style={{ maxHeight: 'calc(var(--vvh, 90vh) - 60px)' }}
        onClick={e => e.stopPropagation()}
        {...cardDragHandlers}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-3 shrink-0 cursor-grab"
          style={{ touchAction: 'none' }}
          {...dragHandlers}
        >
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* 搜索框 */}
        <div className="px-4 pt-3 pb-3 border-b border-gray-100">
          <div className="flex items-stretch gap-2">
            {/* 搜索输入框 — 65% */}
            <div
              style={{ flex: '65 1 0' }}
              className="flex items-center gap-2 bg-gray-100 rounded-2xl px-4 focus-within:ring-2 focus-within:ring-green-500 focus-within:bg-white transition-all min-w-0"
            >
              <span className="text-gray-400 text-lg shrink-0">🔍</span>
              <input
                ref={inputRef}
                autoFocus
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onCompositionStart={() => { isComposing.current = true; }}
                onCompositionEnd={e => {
                  isComposing.current = false;
                  setQuery((e.target as HTMLInputElement).value);
                  setSearchTrigger(t => t + 1);
                }}
                placeholder={t('searchPlaceholder')}
                className="flex-1 min-w-0 bg-transparent py-4 focus:outline-none text-base placeholder-gray-400"
              />
              {query ? (
                <button onClick={() => setQuery('')} className="text-gray-300 hover:text-gray-500 text-xl shrink-0">×</button>
              ) : null}
            </div>

            {/* AI 估算按钮 — 35%，有 key 时常驻显示 */}
            {getGroqKey() && (
              <button
                style={{ flex: '35 0 0' }}
                onClick={handleAiEstimate}
                disabled={aiState === 'loading' || !query.trim()}
                title="AI 估算营养"
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-purple-100 hover:bg-purple-200 disabled:opacity-40 disabled:cursor-not-allowed text-purple-700 font-semibold text-sm transition-colors"
              >
                {aiState === 'loading'
                  ? <span className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  : <><span className="text-base leading-none">🤖</span><span>{t('aiEstimateShort')}</span></>}
              </button>
            )}
          </div>

          {searchState === 'searching_online' && (
            <div className="mt-2 text-xs text-blue-500 flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              {results.length > 0 ? t('searchingMore') : t('searchingOnline')}
            </div>
          )}
        </div>

        {/* 结果列表 */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(var(--vvh, 90vh) - 160px)' }}>


          {/* 无结果 */}
          {noResults && (
            <div className="px-4 pt-3 pb-2 space-y-2.5">
              <div className="text-sm text-gray-400 text-center">
                {t('noResults')}「{query}」{onlineError?.includes('失败') || onlineError?.includes('failed') ? t('onlineSearchFailed') : ''}
              </div>

              {aiState === 'error' && aiError && (
                <div className="text-xs text-red-500 text-center">{aiError}</div>
              )}

              {/* 拍照识别 — 蓝色，排第一 */}
              <button
                onClick={() => setView('scanner')}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <span>📷</span> {t('scanPackageLabel')}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setOnlineSearched(false);
                    setOnlineError(null);
                    setSearchState('searching_online');
                    searchOpenFoodFacts(query)
                      .then(online => {
                        setResults(online);
                        setOnlineResults(online);
                        setOnlineSearched(true);
                        setSearchState('done');
                        if (!online.length) setOnlineError(t('onlineNoResults'));
                      })
                      .catch(() => { setOnlineError(t('onlineSearchError')); setSearchState('done'); });
                  }}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>🌐</span> {t('retryOnline')}
                </button>
                <button
                  onClick={() => setView('recipe')}
                  className="flex-1 py-2.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl text-sm font-medium transition-colors"
                >
                  {t('buildRecipe')}
                </button>
                <button
                  onClick={() => setView('manual')}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  {t('manualEntry')}
                </button>
              </div>
            </div>
          )}

          {/* 搜索结果 */}
          {results.length > 0 && (
            <div className="p-2">
              {results.map((food, i) => (
                <FoodResultItem key={food.id || i} food={food} onSelect={onSelect} />
              ))}

              {/* 家庭成员食物 */}
              {familyResults.length > 0 && (
                <>
                  <div className="px-2 pt-3 pb-1 text-xs font-medium text-gray-400">{t('familyFoods')}</div>
                  {familyResults.map((food, i) => (
                    <FoodResultItem key={`family_${food.id || i}`} food={food} onSelect={onSelect} isFamily />
                  ))}
                </>
              )}
            </div>
          )}

          {/* 联网搜索更多 */}
          {hasLocalResults && searchState === 'done' && (
            <div className="px-4 pb-2 pt-1">
              <button
                onClick={handleOnlineSearch}
                className="w-full py-2.5 text-sm text-blue-500 hover:text-blue-700 border border-blue-100 hover:border-blue-300 rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <span>🌐</span> {t('onlineSearch')}
              </button>
            </div>
          )}

          {/* 底部操作入口（有结果时） */}
          {results.length > 0 && (
            <div className="px-4 pb-4 pt-1 border-t border-gray-50 space-y-2">
              <div className="flex gap-3">
                <button
                  onClick={() => setView('scanner')}
                  className="flex-1 py-2 text-sm text-gray-400 hover:text-blue-600 transition-colors text-center"
                >
                  {t('scanLabel')}
                </button>
                <button
                  onClick={() => setView('recipe')}
                  className="flex-1 py-2 text-sm text-gray-500 hover:text-green-600 transition-colors text-center"
                >
                  {t('customFood')}
                </button>
                <button
                  onClick={() => setView('manual')}
                  className="flex-1 py-2 text-sm text-gray-400 hover:text-green-600 transition-colors text-center"
                >
                  {t('manualEntry')}
                </button>
              </div>
            </div>
          )}

          {/* 空状态 — 常用食物 + 自定义食物入口 */}
          {!query && (
            <div className="p-4">
              {/* 快捷操作按钮组 */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => setView('scanner')}
                  className="py-3 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-sm text-blue-700 font-medium transition-colors"
                >
                  <span>📷</span> {t('scanLabel')}
                </button>
                <button
                  onClick={() => setView('recipe')}
                  className="py-3 flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl text-sm text-green-700 font-medium transition-colors"
                >
                  <span>🧪</span> {t('customFood')}
                </button>
              </div>

              {recentFoods.length > 0 ? (
                <>
                  <div className="text-xs font-medium text-gray-400 mb-3">{t('recentFoods')}</div>
                  <div className="flex flex-wrap gap-2">
                    {recentFoods.map(entry => (
                      <button
                        key={entry.food.id}
                        onClick={() => onSelect(entry.food)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-green-50 hover:border-green-300 border border-gray-200 rounded-xl text-sm transition-colors"
                      >
                        <span className="text-gray-800">{entry.food.name}</span>
                        <span className="text-xs text-gray-400">{entry.lastUnit}</span>
                        {entry.useCount > 2 && (
                          <span className="text-xs text-green-500 font-medium">×{entry.useCount}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="text-4xl mb-3">🥗</div>
                  <div className="text-gray-400 text-sm">{t('searchHint')}</div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* 返回按钮 — 固定在物理屏幕最底部，键盘弹出时被遮住，收起时可见 */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 py-3 bg-white border-t border-gray-100 z-[51]"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="w-full max-w-lg mx-auto block py-3.5 rounded-2xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 border border-gray-300 text-gray-600 font-medium transition-colors"
        >
          {t('back')}
        </button>
      </div>
    </div>
  );
}

function FoodResultItem({
  food,
  onSelect,
  isFamily = false,
}: {
  food: FoodItem;
  onSelect: (food: FoodItem) => void;
  isFamily?: boolean;
}) {
  const { t } = useLocale();
  return (
    <button
      onClick={() => onSelect(food)}
      className="w-full text-left p-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-3"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900 truncate">{food.name}</span>
          {isFamily && (
            <span className="text-xs text-green-700 bg-green-50 px-1.5 py-0.5 rounded shrink-0">
              👨‍👩‍👧 {t('tagFamily')}
            </span>
          )}
          {!isFamily && food.source === 'user_added' && (
            <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded shrink-0">
              {food.tags?.includes('扫码') ? t('tagScan') : food.tags?.includes('手动') ? t('tagManual') : t('tagCustom')}
            </span>
          )}
          {food.brand && (
            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">{food.brand}</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
          <span>{FOOD_CATEGORY_LABELS[food.category]}</span>
          <span>{food.per100g.calories} kcal/100g</span>
          <span>{t('proteinShort')} {food.per100g.protein}g</span>
        </div>
      </div>
      <GIBadge gi={food.gi} />
    </button>
  );
}
