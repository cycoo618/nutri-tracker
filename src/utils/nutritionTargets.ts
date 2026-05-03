// ============================================
// 基于科学标准的量化营养目标追踪
// 参考：WHO、地中海饮食指南、中国居民膳食指南2022、AHA
// ============================================

import type { MealItem } from '../types/log';
import type { DailyLog } from '../types/log';
import type { MedCategory } from './goalAlerts';
import { MED_KEYWORDS_EXPORT } from './goalAlerts';

// ── 科学标准 ─────────────────────────────────────────────────────────

export interface CategoryTarget {
  category: MedCategory;
  icon: string;
  label: string;
  labelEn: string;
  /** 每日克数目标（null 表示用每周次数代替） */
  dailyGrams: number | null;
  /** 每周次数目标（null 表示用每日克数代替） */
  weeklyServings: number | null;
  /** 每次算一份的克数参考值（用于周次数计算） */
  servingGrams: number;
  /** 连续N天未吃就提醒 */
  alertAfterDays: number;
  /** 简短的每日或每周目标描述 */
  targetLabel: string;
  targetLabelEn: string;
  /** 未达标时推荐吃什么 */
  suggestion: string;
  suggestionEn: string;
}

/**
 * 科学标准说明：
 * - 蔬菜 300-500g/天（中国膳食指南2022，含深色蔬菜≥一半）
 * - 水果 200-350g/天（中国膳食指南2022，不含果汁）
 * - 全谷物/杂粮 50-150g/天干重（中国：全谷杂粮每天50-150g）
 * - 豆类/豆制品 每天相当于大豆25g（约150g豆腐 or 300ml豆浆）
 * - 坚果 25-35g/天（约1小把；地中海指南每天；AHA 4-5次/周）
 * - 鱼/海鲜 ≥2次/周每次≥150g（AHA；地中海：每周至少2次优质鱼）
 * - 乳制品 300g/天乳制品当量（中国膳食指南2022）
 */
export const CATEGORY_TARGETS: CategoryTarget[] = [
  {
    category: 'vegetable',
    icon: '🥬',
    label: '蔬菜',        labelEn: 'Vegetables',
    dailyGrams: 350,      weeklyServings: null,
    servingGrams: 100,    alertAfterDays: 1,
    targetLabel: '300-500g/天',   targetLabelEn: '300–500g/day',
    suggestion: '试试菠菜、西兰花、番茄或任何应季蔬菜',
    suggestionEn: 'Try spinach, broccoli, tomatoes or seasonal veggies',
  },
  {
    category: 'fruit',
    icon: '🍎',
    label: '水果',        labelEn: 'Fruit',
    dailyGrams: 250,      weeklyServings: null,
    servingGrams: 100,    alertAfterDays: 2,
    targetLabel: '200-350g/天',   targetLabelEn: '200–350g/day',
    suggestion: '加一个苹果或橙子，约200g',
    suggestionEn: 'Add an apple or orange, about 200g',
  },
  {
    category: 'whole_grain',
    icon: '🌾',
    label: '全谷物',      labelEn: 'Whole Grain',
    dailyGrams: 75,       weeklyServings: null,
    servingGrams: 50,     alertAfterDays: 2,
    targetLabel: '50-150g/天',    targetLabelEn: '50–150g/day (dry)',
    suggestion: '把白米换成糙米，或加一份燕麦片',
    suggestionEn: 'Swap white rice for brown rice or add oats',
  },
  {
    category: 'legume',
    icon: '🫘',
    label: '豆类',        labelEn: 'Legumes',
    dailyGrams: 150,      weeklyServings: null,
    servingGrams: 100,    alertAfterDays: 2,
    targetLabel: '≈150g豆腐/天',  targetLabelEn: '~150g tofu or 300ml soy milk/day',
    suggestion: '一块豆腐（约150g）或一杯豆浆（300ml）',
    suggestionEn: 'One block of tofu (~150g) or a glass of soy milk (300ml)',
  },
  {
    category: 'nut',
    icon: '🥜',
    label: '坚果',        labelEn: 'Nuts',
    dailyGrams: 30,       weeklyServings: null,
    servingGrams: 30,     alertAfterDays: 2,
    targetLabel: '25-35g/天',     targetLabelEn: '25–35g/day (~1 handful)',
    suggestion: '一小把核桃（3-4颗）或杏仁（约10颗）',
    suggestionEn: 'A small handful of walnuts (3-4) or almonds (~10)',
  },
  {
    category: 'seafood',
    icon: '🐟',
    label: '鱼/海鲜',     labelEn: 'Fish & Seafood',
    dailyGrams: null,     weeklyServings: 2,
    servingGrams: 150,    alertAfterDays: 4,   // 超4天没吃就提醒
    targetLabel: '≥2次/周',       targetLabelEn: '≥2 servings/week',
    suggestion: '三文鱼、鲈鱼、虾、贝类均可，每次约150g',
    suggestionEn: 'Salmon, sea bass, shrimp or shellfish, ~150g per serving',
  },
  {
    category: 'dairy',
    icon: '🥛',
    label: '乳制品',      labelEn: 'Dairy',
    dailyGrams: 300,      weeklyServings: null,
    servingGrams: 100,    alertAfterDays: 2,
    targetLabel: '300g/天',       targetLabelEn: '300g/day (milk equivalent)',
    suggestion: '一杯酸奶（150g）或一杯牛奶（250ml）',
    suggestionEn: 'A cup of yogurt (150g) or a glass of milk (250ml)',
  },
];

// ── 今日克数分析 ─────────────────────────────────────────────────────

/**
 * 统计今日某食物类别的摄入克数
 * 把所有匹配关键词的 MealItem.amount 相加
 */
export function getCategoryGrams(items: MealItem[], category: MedCategory): number {
  const keywords = MED_KEYWORDS_EXPORT[category] ?? [];
  let total = 0;
  for (const item of items) {
    const name = item.foodName.toLowerCase();
    if (keywords.some(k => name.includes(k.toLowerCase()))) {
      total += item.amount;
    }
  }
  return Math.round(total);
}

// ── 滚动窗口分析 ─────────────────────────────────────────────────────

export interface RollingStats {
  /** 最近一次吃某类别是几天前（0=今天吃了，1=昨天，以此类推；null=7天内未吃） */
  daysSinceLastEaten: Record<MedCategory, number | null>;
  /** 最近7天内吃了几次（用于鱼/海鲜等周次数目标） */
  weeklyCount: Record<MedCategory, number>;
  /** 本周总摄入克数 */
  weeklyGrams: Record<MedCategory, number>;
}

function matchesCategory(foodName: string, category: MedCategory): boolean {
  const keywords = MED_KEYWORDS_EXPORT[category] ?? [];
  const lower = foodName.toLowerCase();
  return keywords.some(k => lower.includes(k.toLowerCase()));
}

/**
 * 分析最近N天的饮食记录，计算每类食物的滚动统计
 * @param logs 按日期排序的记录（最新在最后）
 * @param todayStr 今天的日期字符串 YYYY-MM-DD，用于计算天数差
 */
export function analyzeRollingWindow(logs: DailyLog[], todayStr: string): RollingStats {
  const today = new Date(todayStr + 'T00:00:00');
  const categories: MedCategory[] = ['vegetable', 'fruit', 'whole_grain', 'legume', 'nut', 'seafood', 'dairy'];

  const daysSince: Record<string, number | null> = {};
  const weeklyCount: Record<string, number> = {};
  const weeklyGrams: Record<string, number> = {};

  for (const cat of categories) {
    daysSince[cat] = null;
    weeklyCount[cat] = 0;
    weeklyGrams[cat] = 0;
  }

  for (const log of logs) {
    const logDate = new Date(log.date + 'T00:00:00');
    const diffMs = today.getTime() - logDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    const allItems = log.meals.flatMap(m => m.items);

    for (const cat of categories) {
      let catGrams = 0;
      for (const item of allItems) {
        if (matchesCategory(item.foodName, cat)) {
          catGrams += item.amount;
        }
      }
      if (catGrams > 0) {
        weeklyCount[cat]++;
        weeklyGrams[cat] += catGrams;
        // 记录最近一次吃的天数（取最小值，即最近的那天）
        if (daysSince[cat] === null || diffDays < daysSince[cat]!) {
          daysSince[cat] = diffDays;
        }
      }
    }
  }

  return {
    daysSinceLastEaten: daysSince as Record<MedCategory, number | null>,
    weeklyCount: weeklyCount as Record<MedCategory, number>,
    weeklyGrams: weeklyGrams as Record<MedCategory, number>,
  };
}

// ── 提醒逻辑 ─────────────────────────────────────────────────────────

export interface CategoryAlert {
  category: MedCategory;
  icon: string;
  label: string;
  labelEn: string;
  message: string;
  messageEn: string;
  severity: 'gentle' | 'moderate';  // gentle=1-2天, moderate=3天+
  suggestion: string;
  suggestionEn: string;
}

/**
 * 根据滚动统计，生成需要提醒的类别列表
 */
export function getCategoryAlerts(
  rolling: RollingStats,
  todayItems: MealItem[],
): CategoryAlert[] {
  const alerts: CategoryAlert[] = [];

  for (const target of CATEGORY_TARGETS) {
    const cat = target.category;
    const daysSince = rolling.daysSinceLastEaten[cat];

    // 今天已经吃了就不提醒
    const todayGrams = getCategoryGrams(todayItems, cat);
    if (todayGrams > 0) continue;

    // 对于鱼/海鲜，用周次数逻辑
    if (target.weeklyServings !== null) {
      const weekCount = rolling.weeklyCount[cat];
      // 已经达到本周目标，不提醒
      if (weekCount >= target.weeklyServings) continue;
      // 今天是周几：如果本周已吃过1次且今天是周三以前，暂不提醒
      // 简化逻辑：超过4天没吃就提醒
    }

    // 判断是否超过警戒天数
    const daysGap = daysSince === null ? 7 : daysSince;
    if (daysGap < target.alertAfterDays) continue;

    const severity: 'gentle' | 'moderate' = daysGap >= 4 ? 'moderate' : 'gentle';

    let message = '';
    let messageEn = '';

    if (target.weeklyServings !== null) {
      const weekCount = rolling.weeklyCount[cat];
      const remaining = target.weeklyServings - weekCount;
      message = `本周还差 ${remaining} 次，上次吃是 ${daysGap} 天前`;
      messageEn = `${remaining} more serving${remaining > 1 ? 's' : ''} needed this week · last eaten ${daysGap}d ago`;
    } else if (daysSince === null) {
      message = `近7天内未吃过`;
      messageEn = 'Not eaten in the past 7 days';
    } else {
      message = `已 ${daysGap} 天未吃`;
      messageEn = `Not eaten for ${daysGap} day${daysGap > 1 ? 's' : ''}`;
    }

    alerts.push({
      category: cat,
      icon: target.icon,
      label: target.label,
      labelEn: target.labelEn,
      message,
      messageEn,
      severity,
      suggestion: target.suggestion,
      suggestionEn: target.suggestionEn,
    });
  }

  // 按严重程度排序（moderate 优先）
  return alerts.sort((a, b) => {
    if (a.severity === b.severity) return 0;
    return a.severity === 'moderate' ? -1 : 1;
  });
}

// ── 今日进度摘要 ─────────────────────────────────────────────────────

export interface DailyProgress {
  category: MedCategory;
  icon: string;
  label: string;
  labelEn: string;
  targetLabel: string;
  targetLabelEn: string;
  /** 今日已吃克数（仅 dailyGrams 目标有效） */
  todayGrams: number;
  /** 目标克数（null 表示周次数类型） */
  targetGrams: number | null;
  /** 本周已吃次数（仅 weeklyServings 目标有效） */
  weeklyCount: number;
  /** 周目标次数 */
  weeklyTarget: number | null;
  /** 进度百分比 0-100 */
  percent: number;
  /** 是否达标 */
  met: boolean;
}

export function getDailyProgress(
  todayItems: MealItem[],
  rolling: RollingStats,
): DailyProgress[] {
  return CATEGORY_TARGETS.map(target => {
    const cat = target.category;
    const todayGrams = getCategoryGrams(todayItems, cat);
    const weeklyCount = rolling.weeklyCount[cat];

    let percent = 0;
    let met = false;

    if (target.dailyGrams !== null) {
      percent = Math.min(100, Math.round((todayGrams / target.dailyGrams) * 100));
      met = todayGrams >= target.dailyGrams;
    } else if (target.weeklyServings !== null) {
      // 周次数：用本周已吃次数 vs 目标
      percent = Math.min(100, Math.round((weeklyCount / target.weeklyServings) * 100));
      met = weeklyCount >= target.weeklyServings;
    }

    return {
      category: cat,
      icon: target.icon,
      label: target.label,
      labelEn: target.labelEn,
      targetLabel: target.targetLabel,
      targetLabelEn: target.targetLabelEn,
      todayGrams,
      targetGrams: target.dailyGrams,
      weeklyCount,
      weeklyTarget: target.weeklyServings,
      percent,
      met,
    };
  });
}
