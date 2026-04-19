// ============================================
// 食物搜索组件
// 三层搜索：自定义食物 → 内置数据库 → USDA 联网
// 顶部：常用食物快捷按钮 + 自定义食物按钮
// ============================================

import { useState, useEffect, useRef } from 'react';
import type { FoodItem } from '../../types/food';
import { FOOD_CATEGORY_LABELS } from '../../types/food';
import { searchBuiltinFoods, searchOpenFoodFacts } from '../../services/food-lookup';
import { searchCustomFoods, recordToFoodItem } from '../../utils/customFoods';
import type { CustomFoodRecord } from '../../utils/customFoods';
import { getFamily, getFamilyMemberFoods } from '../../services/firestore';
import { GIBadge } from '../../components/ui/GIBadge';
import { ManualFoodEntry } from './ManualFoodEntry';
import { RecipeBuilder } from './RecipeBuilder';
import { NutritionLabelScanner } from './NutritionLabelScanner';
import type { RecentFoodEntry } from '../../utils/recentFoods';

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
  const [view, setView] = useState<View>('search');
  const [query, setQuery] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [results, setResults] = useState<FoodItem[]>([]);
  const [familyResults, setFamilyResults] = useState<FoodItem[]>([]);
  const [onlineResults, setOnlineResults] = useState<FoodItem[]>([]);
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [onlineSearched, setOnlineSearched] = useState(false);
  const [onlineError, setOnlineError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isComposing = useRef(false);

  // 只在首次打开时聚焦，不在子视图切回来时重新 focus（否则会触发 iOS 滚动）
  const didFocus = useRef(false);
  useEffect(() => {
    if (view === 'search' && !didFocus.current) {
      didFocus.current = true;
      // 稍微延迟，等模态框完全渲染后再聚焦，避免触发 iOS 页面滚动
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [view]);

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

    if (localResults.length > 0) {
      // 有本地结果 → 直接展示，不联网，重置联网状态
      setResults(localResults);
      setOnlineResults([]);
      setOnlineError(null);
      setOnlineSearched(false);
      setSearchState('done');

      // 同时加载家庭成员食物（异步，不阻塞本地结果展示）
      if (familyId && userId) {
        const q = query.trim().toLowerCase();
        getFamily(familyId)
          .then(family => {
            if (!family) return [];
            const memberUids = family.members.map(m => m.uid);
            return getFamilyMemberFoods(memberUids, userId);
          })
          .then(rawFoods => {
            const q2 = q;
            const filtered = rawFoods.filter(f =>
              typeof f['name'] === 'string' && (f['name'] as string).toLowerCase().includes(q2)
            );
            const foodItems: FoodItem[] = filtered.map(f => {
              const item = recordToFoodItem(f as CustomFoodRecord);
              return {
                ...item,
                tags: [...(item.tags ?? []), '家庭'],
              };
            });
            // 去重（排除本地已有的）
            const localIds = new Set(localResults.map(r => r.id));
            setFamilyResults(foodItems.filter(fi => !localIds.has(fi.id)));
          })
          .catch(() => {
            setFamilyResults([]);
          });
      } else {
        setFamilyResults([]);
      }
      return;
    }

    setFamilyResults([]);

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
        if (online.length === 0) setOnlineError('联网搜索无结果');
      } catch (err) {
        console.warn('Online search failed:', err);
        setOnlineError('联网搜索失败，请稍后再试');
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
    } catch {}
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
        className="modal-enter bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl flex flex-col sm:max-h-[85vh]"
        style={{ height: 'var(--vvh, 85vh)' }}
        onClick={e => e.stopPropagation()}
      >

        {/* 搜索框 */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onCompositionStart={() => { isComposing.current = true; }}
              onCompositionEnd={e => {
                isComposing.current = false;
                setQuery((e.target as HTMLInputElement).value);
                // 强制 useEffect 重跑，即使 query 值未变（IME 中间态已设置过相同值）
                setSearchTrigger(t => t + 1);
              }}
              placeholder="搜索食物，如「黑豆浆」「espresso」…"
              className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            />
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm font-medium shrink-0">
              取消
            </button>
          </div>

          {searchState === 'searching_online' && (
            <div className="mt-2 text-xs text-blue-500 flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              {results.length > 0 ? '正在联网搜索更多…' : '本地未找到，正在联网搜索…'}
            </div>
          )}
        </div>

        {/* 结果列表 */}
        <div className="flex-1 overflow-y-auto">


          {/* 无结果 */}
          {noResults && (
            <div className="p-5 space-y-3">
              <div className="text-center py-3">
                <div className="text-3xl mb-2">🔍</div>
                <div className="text-gray-600 font-medium">没有找到「{query}」</div>
                <div className="text-gray-400 text-xs mt-1">
                  {onlineError?.includes('失败') ? '联网搜索失败' : '本地和联网都未找到'}
                </div>
              </div>

              {/* 主推：拍照识别 */}
              <button
                onClick={() => setView('scanner')}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <span>📷</span> 拍照识别包装营养标签
              </button>

              {/* 重试联网 */}
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
                      if (!online.length) setOnlineError('联网搜索无结果');
                    })
                    .catch(() => { setOnlineError('联网搜索失败，请稍后再试'); setSearchState('done'); });
                }}
                className="w-full py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <span>🌐</span> 重新联网搜索
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setView('recipe')}
                  className="flex-1 py-2.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl text-sm font-medium transition-colors"
                >
                  🧪 组合食材
                </button>
                <button
                  onClick={() => setView('manual')}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  手动录入
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
                  <div className="px-2 pt-3 pb-1 text-xs font-medium text-gray-400">家庭食物</div>
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
                <span>🌐</span> 联网搜索更多结果
              </button>
            </div>
          )}

          {/* 底部操作入口（有结果时） */}
          {results.length > 0 && (
            <div className="px-4 pb-4 pt-1 border-t border-gray-50 flex gap-3">
              <button
                onClick={() => setView('scanner')}
                className="flex-1 py-2 text-sm text-gray-400 hover:text-blue-600 transition-colors text-center"
              >
                📷 拍照识别
              </button>
              <button
                onClick={() => setView('recipe')}
                className="flex-1 py-2 text-sm text-gray-500 hover:text-green-600 transition-colors text-center"
              >
                🧪 自定义食物
              </button>
              <button
                onClick={() => setView('manual')}
                className="flex-1 py-2 text-sm text-gray-400 hover:text-green-600 transition-colors text-center"
              >
                手动录入
              </button>
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
                  <span>📷</span> 拍照识别
                </button>
                <button
                  onClick={() => setView('recipe')}
                  className="py-3 flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl text-sm text-green-700 font-medium transition-colors"
                >
                  <span>🧪</span> 自定义食物
                </button>
              </div>

              {recentFoods.length > 0 ? (
                <>
                  <div className="text-xs font-medium text-gray-400 mb-3">常用食物</div>
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
                  <div className="text-gray-400 text-sm">输入食物名称开始搜索</div>
                </div>
              )}
            </div>
          )}
        </div>
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
              👨‍👩‍👧 家庭
            </span>
          )}
          {!isFamily && food.source === 'user_added' && (
            <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded shrink-0">
              {food.tags?.includes('扫码') ? '📷 扫码' : food.tags?.includes('手动') ? '手动' : '自制'}
            </span>
          )}
          {food.brand && (
            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">{food.brand}</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
          <span>{FOOD_CATEGORY_LABELS[food.category]}</span>
          <span>{food.per100g.calories} kcal/100g</span>
          <span>蛋白 {food.per100g.protein}g</span>
        </div>
      </div>
      <GIBadge gi={food.gi} />
    </button>
  );
}
