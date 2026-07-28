// ============================================
// 饮食分析页面
// 拉取最近 30 天记录 → 统计 → AI 深度分析
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { getDailyLogs } from '../../services/firestore';
import { getGroqKey, GROQ_TEXT_MODEL, extractJson } from '../../services/nutrition-vision';
import type { DailyLog, MealItem } from '../../types/log';
import type { UserProfile } from '../../types/user';
import { getActiveGoals } from '../../types/user';
import { useLocale } from '../../i18n/useLocale';
import { localizeUnit } from '../../utils/servingLabels';
import { formatNumber } from '../../utils/calculator';

interface InsightsPageProps {
  profile: UserProfile;
  onClose: () => void;
}

// ── 每日推荐摄入量（通用参考值） ──────────────────────────────────
const RDA = {
  calories: 2000,
  protein:  60,    // g
  carbs:    250,   // g
  fat:      65,    // g
  fiber:    25,    // g
  sodium:   2300,  // mg
};

// ── 分析结果类型 ────────────────────────────────────────────────
interface Stats {
  daysLogged: number;
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  avgFiber: number;
  avgSodium: number;
  topFoods: { name: string; count: number; avgCalories: number }[];
  mealDistribution: { breakfast: number; lunch: number; dinner: number; snack: number };
  calorieByDay: { date: string; calories: number }[];
}

interface AiInsight {
  strengths: string[];
  weaknesses: string[];
  recommendations: { food: string; reason: string }[];
  summary: string;
}

// ── 统计计算 ────────────────────────────────────────────────────
function calcStats(logs: DailyLog[]): Stats {
  if (!logs.length) return {
    daysLogged: 0, avgCalories: 0, avgProtein: 0, avgCarbs: 0,
    avgFat: 0, avgFiber: 0, avgSodium: 0,
    topFoods: [], mealDistribution: { breakfast: 0, lunch: 0, dinner: 0, snack: 0 },
    calorieByDay: [],
  };

  const activeLogs = logs.filter(l => l.totalCalories > 0);
  const n = activeLogs.length || 1;

  const sum = (key: keyof typeof RDA) =>
    activeLogs.reduce((acc, l) => acc + (l.totalNutrition[key as keyof typeof l.totalNutrition] ?? 0), 0);

  // 食物频次统计
  const foodMap = new Map<string, { count: number; totalCal: number }>();
  const mealDist = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };

  for (const log of activeLogs) {
    for (const meal of log.meals) {
      for (const item of meal.items) {
        const prev = foodMap.get(item.foodName) ?? { count: 0, totalCal: 0 };
        foodMap.set(item.foodName, { count: prev.count + 1, totalCal: prev.totalCal + item.calories });
      }
      if (meal.items.length > 0) mealDist[meal.type]++;
    }
  }

  const topFoods = [...foodMap.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([name, v]) => ({ name, count: v.count, avgCalories: Math.round(v.totalCal / v.count) }));

  const calorieByDay = [...logs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(l => ({ date: l.date.slice(5), calories: l.totalCalories }));

  return {
    daysLogged: activeLogs.length,
    avgCalories: Math.round(sum('calories') / n),
    avgProtein:  Math.round(sum('protein')  / n * 10) / 10,
    avgCarbs:    Math.round(sum('carbs')    / n * 10) / 10,
    avgFat:      Math.round(sum('fat')      / n * 10) / 10,
    avgFiber:    Math.round(sum('fiber')    / n * 10) / 10,
    avgSodium:   Math.round(sum('sodium')   / n),
    topFoods,
    mealDistribution: mealDist,
    calorieByDay,
  };
}

// ── Groq AI 分析 ─────────────────────────────────────────────────
async function fetchAiInsight(stats: Stats, profile: UserProfile): Promise<AiInsight> {
  const key = getGroqKey();
  if (!key) throw new Error('no_groq_key');

  const topFoodsList = stats.topFoods.map(f => `${f.name}（${f.count}次，均${f.avgCalories}kcal）`).join('、');
  const activeGoals = getActiveGoals(profile);
  const target = profile.targetCalories;

  // ── 目标特定的分析框架 ───────────────────────────────────────────
  const goalFrameworks: Record<string, string> = {
    anti_inflammatory: `
【分析框架：地中海饮食标准】
请严格按地中海饮食金字塔评估用户的饮食结构：
✅ 基础（每餐应有）：蔬菜、水果、全谷物、橄榄油、豆类、坚果、香草香料
✅ 每周应有：鱼类/海鲜（≥2次）、低脂乳制品（酸奶/奶酪）、鸡蛋（2-4次）
⚠️ 应适量：禽肉（每周）、红肉（每月不超过1-2次）
❌ 应避免：加工食品、精制糖、反式脂肪、含糖饮料
关键营养素重点：膳食纤维（≥25g）、Omega-3脂肪酸、抗氧化物、健康脂肪占比
请从地中海饮食合规度角度评估食物清单，指出哪些符合/不符合地中海饮食原则。`,

    fat_loss: `
【分析框架：科学减脂标准】
热量缺口是否合理（建议缺口 300-500 kcal/天，避免过度节食）
蛋白质是否充足（建议 1.6-2.2g/kg 体重，防止肌肉流失）
碳水质量（优先低GI全谷物，避免精制糖）
饱腹感食物摄入（高纤维、高蛋白食物频率）
避免：空热量食物、高糖饮料、超加工食品`,

    muscle_gain: `
【分析框架：增肌营养标准】
蛋白质摄入是否达标（目标 1.8-2.5g/kg 体重/天，且分散在各餐）
热量盈余是否合理（建议盈余 200-400 kcal，避免过多脂肪增加）
碳水是否充足（训练能量来源，占总热量 45-55%）
氨基酸完整性（优质蛋白食物种类）
餐后蛋白质时机（训练后是否有优质蛋白摄入）`,

    blood_sugar: `
【分析框架：控血糖饮食标准】
低GI食物比例（优先推荐GI<55的食物）
碳水分配是否均匀（避免单餐大量碳水）
膳食纤维是否充足（可减缓血糖上升，目标≥30g）
精制糖和精制碳水摄入（面包、白米饭、含糖饮料频率）
蛋白质和健康脂肪的搭配（降低餐后血糖峰值）`,
  };

  const goalLabels: Record<string, string> = {
    anti_inflammatory: '抗炎（地中海饮食标准）',
    fat_loss: '减脂',
    muscle_gain: '增肌',
    blood_sugar: '控血糖',
  };

  // 合并所有激活目标的框架
  const combinedFramework = activeGoals
    .map(g => goalFrameworks[g])
    .filter(Boolean)
    .join('\n\n');
  const combinedGoalLabel = activeGoals.map(g => goalLabels[g] ?? g).join(' + ');

  const prompt = `你是专业营养师，请分析以下近30天饮食数据，给出深度、具体、有针对性的洞察。
${combinedFramework}

【用户目标】${combinedGoalLabel}，每日热量目标 ${target} kcal
【有记录天数】${stats.daysLogged} 天（共30天）
【日均摄入】热量 ${stats.avgCalories} kcal，蛋白质 ${stats.avgProtein}g，碳水 ${stats.avgCarbs}g，脂肪 ${stats.avgFat}g，膳食纤维 ${stats.avgFiber}g，钠 ${stats.avgSodium}mg
【最常吃的食物Top10】${topFoodsList || '暂无数据'}
【参考RDA】热量2000kcal，蛋白质60g，碳水250g，脂肪65g，膳食纤维25g，钠<2300mg

要求：分析要结合用户实际吃的食物，评价要具体（不要泛泛而谈），推荐食物要符合用户目标的饮食框架。

请返回 JSON（不要任何解释）：
{
  "summary": "2-3句总体评价，结合目标框架给出针对性判断",
  "strengths": ["具体优点1，提及实际食物", "具体优点2", "具体优点3"],
  "weaknesses": ["具体不足1，结合目标框架", "具体不足2", "具体不足3"],
  "recommendations": [
    {"food": "推荐食物名", "reason": "结合用户目标和缺乏营养素的具体推荐理由"},
    {"food": "推荐食物名", "reason": "推荐理由"},
    {"food": "推荐食物名", "reason": "推荐理由"},
    {"food": "推荐食物名", "reason": "推荐理由"},
    {"food": "推荐食物名", "reason": "推荐理由"}
  ]
}`;

  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: GROQ_TEXT_MODEL,
      max_tokens: 800,
      reasoning_effort: 'none',
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(20000),
  });

  if (!resp.ok) throw new Error(`groq_error_${resp.status}`);
  const data = await resp.json();
  const text: string = data.choices?.[0]?.message?.content ?? '';
  const jsonMatch = extractJson(text);
  if (!jsonMatch) throw new Error('parse_error');
  return JSON.parse(jsonMatch) as AiInsight;
}

// ── 进度条组件 ───────────────────────────────────────────────────
function MacroBar({ label, value, target, unit, color }: {
  label: string; value: number; target: number; unit: string; color: string;
}) {
  const pct = Math.min(100, Math.round(value / target * 100));
  const status = pct < 60 ? 'low' : pct > 120 ? 'high' : 'ok';
  const barColor = status === 'low' ? 'bg-amber-400' : status === 'high' ? 'bg-red-400' : color;
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs font-medium text-gray-700">{formatNumber(value)}<span className="text-gray-400">/{target}{unit}</span></span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-right mt-0.5">
        <span className={`text-xs font-medium ${status === 'low' ? 'text-amber-500' : status === 'high' ? 'text-red-500' : 'text-green-600'}`}>
          {pct}%
        </span>
      </div>
    </div>
  );
}

// ── 主页面 ───────────────────────────────────────────────────────
export function InsightsPage({ profile, onClose }: InsightsPageProps) {
  const { t, locale } = useLocale();
  const [loading, setLoading]   = useState(true);
  const [stats, setStats]       = useState<Stats | null>(null);
  const [insight, setInsight]   = useState<AiInsight | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError]   = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);

  // 获取最近 30 天数据
  useEffect(() => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 29);
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

    getDailyLogs(profile.uid, fmt(start), fmt(end))
      .then(logs => {
        setStats(calcStats(logs));
        setLoading(false);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : '加载失败');
        setLoading(false);
      });
  }, [profile.uid]);

  // 触发 AI 分析
  const runAiAnalysis = useCallback(async () => {
    if (!stats) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await fetchAiInsight(stats, profile);
      setInsight(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg === 'no_groq_key') {
        setAiError('请先在「扫描营养标签」中配置 Groq API Key');
      } else {
        setAiError('AI 分析失败，请稍后重试');
      }
    } finally {
      setAiLoading(false);
    }
  }, [stats, profile]);

  // 数据加载完后自动触发 AI
  useEffect(() => {
    if (stats && stats.daysLogged > 0 && !insight) runAiAnalysis();
  }, [stats]);  // eslint-disable-line react-hooks/exhaustive-deps

  const targetCal = profile.targetCalories || RDA.calories;

  return (
    <div
      className="fixed inset-x-0 bg-gray-50 z-40 flex flex-col"
      style={{ top: 'var(--vvt, 0px)', height: 'var(--vvh, 100vh)' }}
    >
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 shrink-0">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            ✕
          </button>
          <h1 className="flex-1 text-center font-semibold text-gray-900">
            {locale === 'zh' ? '📊 饮食分析' : '📊 Nutrition Insights'}
          </h1>
          <div className="w-8" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto max-w-lg mx-auto w-full px-4 py-5 space-y-4">

        {/* 加载中 */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">{locale === 'zh' ? '加载最近 30 天记录…' : 'Loading 30-day history…'}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {!loading && stats && (
          <>
            {/* 概览卡片 */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="text-sm font-semibold text-gray-700 mb-3">
                {locale === 'zh' ? '近30天概览' : '30-Day Overview'}
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center bg-green-50 rounded-xl p-3">
                  <div className="text-2xl font-bold text-green-700">{stats.daysLogged}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{locale === 'zh' ? '已记录天数' : 'Days Logged'}</div>
                </div>
                <div className="text-center bg-blue-50 rounded-xl p-3">
                  <div className="text-2xl font-bold text-blue-700">{stats.avgCalories}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{locale === 'zh' ? '日均热量' : 'Avg Calories'}</div>
                </div>
                <div className="text-center bg-purple-50 rounded-xl p-3">
                  <div className="text-2xl font-bold text-purple-700">{Math.round(stats.avgCalories / targetCal * 100)}%</div>
                  <div className="text-xs text-gray-400 mt-0.5">{locale === 'zh' ? '目标达成' : 'vs Target'}</div>
                </div>
              </div>

              {stats.daysLogged === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  {locale === 'zh' ? '近30天暂无记录，快去添加今天的饮食吧 🥗' : 'No logs in the last 30 days. Start logging your meals! 🥗'}
                </p>
              )}
            </div>

            {stats.daysLogged > 0 && (
              <>
                {/* 营养素达成率 */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="text-sm font-semibold text-gray-700 mb-4">
                    {locale === 'zh' ? '日均营养素（对比推荐量）' : 'Daily Avg Nutrients vs RDA'}
                  </div>
                  <div className="space-y-3.5">
                    <MacroBar label={locale === 'zh' ? '热量' : 'Calories'} value={stats.avgCalories} target={targetCal}    unit={localizeUnit('kcal', locale)} color="bg-green-500" />
                    <MacroBar label={locale === 'zh' ? '蛋白质' : 'Protein'}  value={stats.avgProtein}  target={RDA.protein}  unit={localizeUnit('g', locale)}    color="bg-blue-500"  />
                    <MacroBar label={locale === 'zh' ? '碳水'   : 'Carbs'}    value={stats.avgCarbs}    target={RDA.carbs}    unit={localizeUnit('g', locale)}    color="bg-amber-500" />
                    <MacroBar label={locale === 'zh' ? '脂肪'   : 'Fat'}      value={stats.avgFat}      target={RDA.fat}      unit={localizeUnit('g', locale)}    color="bg-orange-500" />
                    <MacroBar label={locale === 'zh' ? '膳食纤维': 'Fiber'}   value={stats.avgFiber}    target={RDA.fiber}    unit={localizeUnit('g', locale)}    color="bg-emerald-500"/>
                  </div>
                  <p className="text-xs text-gray-300 mt-3">{locale === 'zh' ? '参考值：成人每日推荐摄入量（RDA），仅供参考' : 'Reference: Adult RDA values, for reference only'}</p>
                </div>

                {/* 热量趋势迷你图 */}
                {stats.calorieByDay.length > 1 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="text-sm font-semibold text-gray-700 mb-3">
                      {locale === 'zh' ? '热量趋势' : 'Calorie Trend'}
                    </div>
                    <div className="flex items-end gap-0.5 h-16">
                      {stats.calorieByDay.slice(-14).map((d, i) => {
                        const maxCal = Math.max(...stats.calorieByDay.map(x => x.calories), targetCal);
                        const h = d.calories > 0 ? Math.max(4, Math.round(d.calories / maxCal * 64)) : 2;
                        const isOver = d.calories > targetCal * 1.1;
                        const isEmpty = d.calories === 0;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                            <div
                              className={`w-full rounded-t-sm ${isEmpty ? 'bg-gray-100' : isOver ? 'bg-red-300' : 'bg-green-400'}`}
                              style={{ height: `${h}px` }}
                              title={`${d.date}: ${d.calories} kcal`}
                            />
                            {i % 3 === 0 && <span className="text-gray-300" style={{ fontSize: '8px' }}>{d.date.slice(3)}</span>}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-sm inline-block" />{locale === 'zh' ? '正常' : 'Normal'}</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-300 rounded-sm inline-block" />{locale === 'zh' ? '超标' : 'Over'}</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 bg-gray-100 rounded-sm inline-block" />{locale === 'zh' ? '未记录' : 'No log'}</span>
                    </div>
                  </div>
                )}

                {/* Top 食物 */}
                {stats.topFoods.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="text-sm font-semibold text-gray-700 mb-3">
                      {locale === 'zh' ? '最常吃的食物 Top 10' : 'Top 10 Most Eaten Foods'}
                    </div>
                    <div className="space-y-2">
                      {stats.topFoods.map((f, i) => (
                        <div key={f.name} className="flex items-center gap-3">
                          <span className="text-xs text-gray-300 w-4 text-right shrink-0">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-700 truncate">{f.name}</div>
                            <div className="text-xs text-gray-400">
                              {locale === 'zh' ? `记录 ${f.count} 次 · 均 ${f.avgCalories} kcal` : `${f.count}×  · avg ${f.avgCalories} kcal`}
                            </div>
                          </div>
                          <div className="w-16 bg-gray-100 rounded-full h-1.5 shrink-0">
                            <div
                              className="h-full bg-green-400 rounded-full"
                              style={{ width: `${Math.round(f.count / stats.topFoods[0].count * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI 分析 */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                      <span>🤖</span>
                      <span>{locale === 'zh' ? 'AI 营养分析' : 'AI Nutrition Analysis'}</span>
                    </div>
                    {!aiLoading && (
                      <button
                        onClick={runAiAnalysis}
                        className="text-xs text-green-600 hover:text-green-700 font-medium"
                      >
                        {locale === 'zh' ? '重新分析' : 'Refresh'}
                      </button>
                    )}
                  </div>
                  {/* 当前分析框架标签 */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {getActiveGoals(profile).map(g => {
                      const badges: Record<string, { color: string; text: string; textEn: string }> = {
                        anti_inflammatory: { color: 'text-blue-500 bg-blue-50',   text: '🫒 基于地中海饮食标准', textEn: '🫒 Mediterranean Standard' },
                        fat_loss:          { color: 'text-orange-500 bg-orange-50', text: '🔥 基于科学减脂标准',   textEn: '🔥 Fat Loss Standard' },
                        muscle_gain:       { color: 'text-purple-500 bg-purple-50', text: '💪 基于增肌营养标准',   textEn: '💪 Muscle Gain Standard' },
                        blood_sugar:       { color: 'text-teal-500 bg-teal-50',   text: '🩸 基于控血糖标准',     textEn: '🩸 Blood Sugar Standard' },
                      };
                      const b = badges[g];
                      if (!b) return null;
                      return (
                        <div key={g} className={`text-xs rounded-lg px-2.5 py-1 inline-block ${b.color}`}>
                          {locale === 'zh' ? b.text : b.textEn}
                        </div>
                      );
                    })}
                  </div>

                  {aiLoading && (
                    <div className="flex flex-col items-center gap-2 py-6">
                      <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs text-gray-400">{locale === 'zh' ? 'AI 正在分析你的饮食习惯…' : 'AI is analyzing your eating patterns…'}</p>
                    </div>
                  )}

                  {aiError && !aiLoading && (
                    <div className="text-sm text-amber-600 bg-amber-50 rounded-xl px-3 py-2">
                      {aiError}
                    </div>
                  )}

                  {insight && !aiLoading && (
                    <div className="space-y-4">
                      {/* 总结 */}
                      <p className="text-sm text-gray-700 leading-relaxed bg-white/60 rounded-xl p-3">
                        {insight.summary}
                      </p>

                      {/* 优点 */}
                      <div>
                        <div className="text-xs font-medium text-green-700 mb-2 flex items-center gap-1">
                          <span>✅</span> {locale === 'zh' ? '做得好的地方' : 'Strengths'}
                        </div>
                        <ul className="space-y-1.5">
                          {insight.strengths.map((s, i) => (
                            <li key={i} className="text-sm text-gray-700 flex gap-2">
                              <span className="text-green-400 shrink-0">•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 不足 */}
                      <div>
                        <div className="text-xs font-medium text-amber-600 mb-2 flex items-center gap-1">
                          <span>⚠️</span> {locale === 'zh' ? '需要改进的地方' : 'Areas to Improve'}
                        </div>
                        <ul className="space-y-1.5">
                          {insight.weaknesses.map((w, i) => (
                            <li key={i} className="text-sm text-gray-700 flex gap-2">
                              <span className="text-amber-400 shrink-0">•</span>
                              <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 推荐食物 */}
                      <div>
                        <div className="text-xs font-medium text-blue-600 mb-2 flex items-center gap-1">
                          <span>🥗</span> {locale === 'zh' ? '建议多吃' : 'Recommended Foods'}
                        </div>
                        <div className="space-y-2">
                          {insight.recommendations.map((r, i) => (
                            <div key={i} className="bg-white/70 rounded-xl px-3 py-2.5 flex gap-3">
                              <span className="text-blue-500 font-bold text-sm shrink-0 w-5">{i + 1}</span>
                              <div>
                                <div className="text-sm font-medium text-gray-800">{r.food}</div>
                                <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{r.reason}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* 底部留白 */}
        <div className="h-6" />
      </div>
    </div>
  );
}
