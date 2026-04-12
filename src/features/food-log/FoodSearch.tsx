// ============================================
// 食物搜索组件
// 三层搜索：内置数据库 → Open Food Facts → 手动录入
// 顶部常用食物快捷按钮
// ============================================

import { useState, useEffect, useRef } from 'react';
import type { FoodItem } from '../../types/food';
import { FOOD_CATEGORY_LABELS } from '../../types/food';
import { searchBuiltinFoods, searchOpenFoodFacts } from '../../services/food-lookup';
import { GIBadge } from '../../components/ui/GIBadge';
import { ManualFoodEntry } from './ManualFoodEntry';
import type { RecentFoodEntry } from '../../utils/recentFoods';

interface FoodSearchProps {
  recentFoods?: RecentFoodEntry[];
  onSelect: (food: FoodItem) => void;
  onClose: () => void;
}

type SearchState = 'idle' | 'searching_builtin' | 'searching_online' | 'done';

export function FoodSearch({ recentFoods = [], onSelect, onClose }: FoodSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodItem[]>([]);
  const [onlineResults, setOnlineResults] = useState<FoodItem[]>([]);
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [onlineSearched, setOnlineSearched] = useState(false);
  const [onlineError, setOnlineError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 本地搜索（含 debounce）
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOnlineResults([]);
      setSearchState('idle');
      setOnlineSearched(false);
      return;
    }

    setOnlineSearched(false);
    setOnlineResults([]);
    setOnlineError(null);
    setSearchState('searching_builtin');

    const timer = setTimeout(async () => {
      const builtinResults = searchBuiltinFoods(query);

      if (builtinResults.length > 0) {
        setResults(builtinResults);
        setSearchState('done');
      } else {
        // 无本地结果：自动联网搜索
        setResults([]);
        setSearchState('searching_online');
        try {
          const online = await searchOpenFoodFacts(query);
          setResults(online);
          setOnlineResults(online);
          if (online.length === 0) {
            setOnlineError('联网搜索无结果');
          }
        } catch (err) {
          console.warn('Online search failed:', err);
          setOnlineError('联网搜索失败，请检查网络或稍后再试');
        }
        setOnlineSearched(true);
        setSearchState('done');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  /** 用户主动点击"联网搜索更多" */
  const handleOnlineSearch = async () => {
    if (onlineSearched) return;
    setSearchState('searching_online');
    try {
      const online = await searchOpenFoodFacts(query);
      setOnlineResults(online);
      // 合并：本地结果 + 联网结果（去重）
      const existingIds = new Set(results.map(r => r.id));
      const merged = [...results, ...online.filter(r => !existingIds.has(r.id))];
      setResults(merged);
    } catch {}
    setOnlineSearched(true);
    setSearchState('done');
  };

  if (showManual) {
    return (
      <ManualFoodEntry
        initialName={query}
        onConfirm={(food) => onSelect(food)}
        onBack={() => setShowManual(false)}
        onClose={onClose}
      />
    );
  }

  const isSearching = searchState === 'searching_builtin' || searchState === 'searching_online';
  const noResults = searchState === 'done' && results.length === 0;
  const hasLocalResults = results.length > 0 && !onlineSearched;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col">

        {/* 搜索框 */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="搜索食物，如「三文鱼」「Tim Hortons」..."
              className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            />
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm font-medium shrink-0">
              取消
            </button>
          </div>

          {/* 搜索状态 */}
          {searchState === 'searching_online' && (
            <div className="mt-2 text-xs text-blue-500 flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              {results.length > 0 ? '正在联网搜索更多...' : '本地未找到，正在联网搜索...'}
            </div>
          )}
          {onlineSearched && onlineResults.length > 0 && (
            <div className="mt-2 text-xs text-gray-400">
              已包含 Open Food Facts 联网结果
            </div>
          )}
        </div>

        {/* 结果列表 */}
        <div className="flex-1 overflow-y-auto">

          {/* 搜索中 */}
          {searchState === 'searching_builtin' && (
            <div className="text-center py-10 text-gray-400 text-sm">搜索中...</div>
          )}

          {/* 无结果 */}
          {noResults && (
            <div className="p-6 text-center">
              <div className="text-3xl mb-3">🔍</div>
              <div className="text-gray-600 font-medium">没有找到「{query}」</div>
              {onlineError ? (
                <div className="text-amber-500 text-sm mt-1 mb-2">{onlineError}</div>
              ) : (
                <div className="text-gray-400 text-sm mt-1 mb-2">本地和联网搜索都未找到</div>
              )}
              {/* 重试按钮（联网失败时） */}
              {onlineError && onlineError.includes('失败') && (
                <button
                  onClick={() => {
                    setOnlineSearched(false);
                    setOnlineError(null);
                    setSearchState('searching_online');
                    searchOpenFoodFacts(query).then(online => {
                      setResults(online);
                      setOnlineResults(online);
                      setOnlineSearched(true);
                      setSearchState('done');
                      if (online.length === 0) setOnlineError('联网搜索无结果');
                    }).catch(() => {
                      setOnlineError('联网搜索失败，请检查网络或稍后再试');
                      setSearchState('done');
                    });
                  }}
                  className="w-full py-2.5 mb-3 text-sm text-blue-500 border border-blue-200 rounded-xl hover:border-blue-400 transition-colors"
                >
                  重试联网搜索
                </button>
              )}
              <button
                onClick={() => setShowManual(true)}
                className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
              >
                手动录入营养数据
              </button>
            </div>
          )}

          {/* 搜索结果 */}
          {results.length > 0 && (
            <div className="p-2">
              {results.map((food, i) => (
                <button
                  key={food.id || i}
                  onClick={() => onSelect(food)}
                  className="w-full text-left p-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 truncate">{food.name}</span>
                      {food.brand && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                          {food.brand}
                        </span>
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
              ))}
            </div>
          )}

          {/* 联网搜索更多（有本地结果但还没联网搜过） */}
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

          {/* 手动录入入口 */}
          {results.length > 0 && (
            <div className="px-4 pb-4 pt-1 border-t border-gray-50">
              <button
                onClick={() => setShowManual(true)}
                className="w-full py-2.5 text-sm text-gray-400 hover:text-green-600 transition-colors"
              >
                找不到想要的？→ 手动录入
              </button>
            </div>
          )}

          {/* 空状态 — 显示常用食物 */}
          {!query && (
            <div className="p-4">
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
                  <button
                    onClick={() => setShowManual(true)}
                    className="mt-4 text-sm text-green-600 hover:underline"
                  >
                    或直接手动录入
                  </button>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="text-4xl mb-3">🥗</div>
                  <div className="text-gray-400 text-sm">输入食物名称开始搜索</div>
                  <button
                    onClick={() => setShowManual(true)}
                    className="mt-4 text-sm text-green-600 hover:underline"
                  >
                    或直接手动录入
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
