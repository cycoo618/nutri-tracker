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
    servingGrams: 100,    alertAfterDays: 3,
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
    category: 'fermented',
    icon: '🫙',
    label: '发酵食品',    labelEn: 'Fermented',
    dailyGrams: 150,      weeklyServings: null,
    servingGrams: 100,    alertAfterDays: 3,
    targetLabel: '每天一份',       targetLabelEn: '1 serving/day',
    suggestion: '希腊酸奶、泡菜、味噌汤、纳豆均可',
    suggestionEn: 'Greek yogurt, kimchi, miso soup or natto',
  },
];

// ── 分类科普知识 ─────────────────────────────────────────────────────

export interface CategoryInfo {
  category: MedCategory;
  /** 核心作用（2-3条） */
  benefits: { zh: string; en: string }[];
  /** 推荐食物列表 */
  foods: { zh: string; en: string }[];
  /** 科学小贴士 */
  tip: { zh: string; en: string };
}

export const CATEGORY_INFO: Record<MedCategory, CategoryInfo> = {
  vegetable: {
    category: 'vegetable',
    benefits: [
      { zh: '富含多酚、类黄酮，直接抑制炎症因子（NF-κB 通路）', en: 'Rich in polyphenols & flavonoids that suppress inflammatory pathways (NF-κB)' },
      { zh: '膳食纤维喂养肠道益生菌，产生短链脂肪酸降低系统性炎症', en: 'Fiber feeds gut bacteria, producing short-chain fatty acids that reduce systemic inflammation' },
      { zh: '维生素 C、K、叶酸及多种矿物质，支持免疫与细胞修复', en: 'Vitamins C, K, folate and minerals support immunity and cell repair' },
    ],
    foods: [
      { zh: '深色叶菜：菠菜、羽衣甘蓝、油菜', en: 'Dark leafy greens: spinach, kale, bok choy' },
      { zh: '十字花科：西兰花、花椰菜、卷心菜', en: 'Cruciferous: broccoli, cauliflower, cabbage' },
      { zh: '茄果类：番茄（含番茄红素）、彩椒', en: 'Nightshades: tomatoes (lycopene), bell peppers' },
      { zh: '菌菇类：香菇、金针菇（β-葡聚糖）', en: 'Mushrooms: shiitake, enoki (β-glucans)' },
    ],
    tip: { zh: '深色蔬菜（绿、红、紫）多酚含量远高于浅色蔬菜，每天至少一半选深色', en: 'Dark-colored vegetables have far more polyphenols — aim for at least half your veg intake in deep colors' },
  },
  fruit: {
    category: 'fruit',
    benefits: [
      { zh: '花青素（蓝莓、樱桃）、槲皮素（苹果）等植化素与蔬菜不重叠，互补抗氧化', en: 'Anthocyanins (berries), quercetin (apple) and other phytonutrients complement vegetables for broader antioxidant coverage' },
      { zh: '天然果糖配合纤维，GI 值低于果汁，不会引起血糖快速波动', en: 'Natural fructose paired with fiber keeps GI low — unlike juice, it won\'t spike blood sugar' },
      { zh: '维生素 C 促进胶原蛋白合成，支持皮肤、血管、关节健康', en: 'Vitamin C boosts collagen synthesis, supporting skin, vessels, and joints' },
    ],
    foods: [
      { zh: '浆果类：蓝莓、草莓、覆盆子（花青素最高）', en: 'Berries: blueberries, strawberries, raspberries (highest anthocyanins)' },
      { zh: '苹果、梨（含果胶，益肠道菌群）', en: 'Apples, pears (pectin — feeds beneficial gut bacteria)' },
      { zh: '柑橘类：橙子、柚子（维生素 C + 类黄酮）', en: 'Citrus: oranges, grapefruit (vitamin C + flavonoids)' },
      { zh: '石榴、樱桃（抗炎效果尤其突出）', en: 'Pomegranate, tart cherries (exceptional anti-inflammatory effect)' },
    ],
    tip: { zh: '蔬菜和水果的植化素种类不同，不能互相替代。每天保证两者都吃到才能覆盖更广的抗氧化谱', en: 'Fruit and vegetables have different phytonutrients and can\'t replace each other — eat both daily for full antioxidant coverage' },
  },
  whole_grain: {
    category: 'whole_grain',
    benefits: [
      { zh: '保留了麸皮和胚芽，B 族维生素、镁、锌含量是精制谷物的 3-5 倍', en: 'Retains bran and germ — B vitamins, magnesium, zinc are 3–5× higher than refined grains' },
      { zh: '较低 GI 减少胰岛素波动，长期降低 2 型糖尿病和心血管疾病风险', en: 'Lower GI reduces insulin spikes, lowering long-term risk of type 2 diabetes and cardiovascular disease' },
      { zh: '可溶性纤维（β-葡聚糖）降低 LDL 胆固醇，每天 3g 即有效', en: 'Soluble fiber (β-glucan) reduces LDL cholesterol — just 3g/day is effective' },
    ],
    foods: [
      { zh: '燕麦（β-葡聚糖最丰富，推荐首选）', en: 'Oats (richest β-glucan — top choice)' },
      { zh: '藜麦（完整氨基酸，无麸质）', en: 'Quinoa (complete amino acids, gluten-free)' },
      { zh: '糙米、黑米、紫米（替代白米的最简单方式）', en: 'Brown rice, black rice (easiest swap for white rice)' },
      { zh: '大麦、荞麦、小米（杂粮饭）', en: 'Barley, buckwheat, millet (multi-grain rice)' },
    ],
    tip: { zh: '把白米饭换成糙米是最简单的升级方式。混合 1/3 糙米 + 2/3 白米，口感差别不大但营养大幅提升', en: 'Swapping white rice for brown is the simplest upgrade. Try a 1/3 brown + 2/3 white blend — minimal taste difference, big nutritional gain' },
  },
  legume: {
    category: 'legume',
    benefits: [
      { zh: '植物蛋白 + 可溶性纤维协同降低 LDL 胆固醇，减少心血管疾病风险', en: 'Plant protein + soluble fiber synergistically lower LDL cholesterol and reduce cardiovascular risk' },
      { zh: '大豆异黄酮有抗炎和调节激素的作用，对女性尤其有益', en: 'Soy isoflavones have anti-inflammatory and hormone-modulating effects, especially beneficial for women' },
      { zh: '低 GI，餐后血糖上升缓慢，是控糖饮食的优质主食替代品', en: 'Low GI — blood sugar rises slowly after eating, making legumes an excellent carb substitute for blood sugar control' },
    ],
    foods: [
      { zh: '豆腐（北豆腐蛋白更高）、豆浆（300ml ≈ 一份）', en: 'Tofu (firm has more protein), soy milk (300ml = 1 serving)' },
      { zh: '毛豆（新鲜大豆，富含 GABA）', en: 'Edamame (fresh soybeans, rich in GABA)' },
      { zh: '红豆、绿豆、黑豆（煮粥或杂粮饭）', en: 'Red beans, mung beans, black beans (porridge or mixed rice)' },
      { zh: '鹰嘴豆（口感好，做沙拉或鹰嘴豆泥）', en: 'Chickpeas (great texture — add to salads or make hummus)' },
    ],
    tip: { zh: '豆腐和豆浆都是大豆制品。150g 豆腐或 300ml 豆浆即为一天的参考目标，简单又实用', en: '150g tofu or 300ml soy milk meets the daily target — simple and practical' },
  },
  nut: {
    category: 'nut',
    benefits: [
      { zh: '单不饱和脂肪酸和多不饱和脂肪酸（核桃含 ALA omega-3）降低心血管风险', en: 'Mono- and polyunsaturated fats (walnuts contain ALA omega-3) reduce cardiovascular risk' },
      { zh: '维生素 E 是脂溶性抗氧化剂，直接减少细胞氧化损伤', en: 'Vitamin E is a fat-soluble antioxidant that directly reduces cellular oxidative damage' },
      { zh: '镁帮助调节皮质醇，有助于减少压力诱发的炎症', en: 'Magnesium helps regulate cortisol, reducing stress-induced inflammation' },
    ],
    foods: [
      { zh: '核桃（omega-3 最高，每天 3-4 颗）', en: 'Walnuts (highest omega-3 — 3–4 per day)' },
      { zh: '杏仁（维生素 E 最高，约 10 颗/天）', en: 'Almonds (highest vitamin E — ~10 per day)' },
      { zh: '腰果、开心果（镁和锌含量丰富）', en: 'Cashews, pistachios (rich in magnesium and zinc)' },
      { zh: '亚麻籽、奇亚籽（omega-3，可加入酸奶或燕麦）', en: 'Flaxseed, chia seeds (omega-3 — add to yogurt or oats)' },
    ],
    tip: { zh: '每天一小把（约 30g）坚果最理想。超过 50g 热量较高，不建议当零食无限吃', en: 'One small handful (~30g) daily is ideal. Over 50g adds significant calories — don\'t snack on them freely' },
  },
  seafood: {
    category: 'seafood',
    benefits: [
      { zh: 'EPA 和 DHA（长链 omega-3）是目前证据最强的天然抗炎营养素', en: 'EPA and DHA (long-chain omega-3s) are the best-evidenced natural anti-inflammatory nutrients' },
      { zh: '每周 2 次高脂鱼可将心脏病发作风险降低约 36%（AHA 数据）', en: 'Two servings of fatty fish per week reduce heart attack risk by ~36% (AHA data)' },
      { zh: '高质量蛋白质 + 维生素 D，支持肌肉合成和免疫功能', en: 'High-quality protein + vitamin D support muscle synthesis and immune function' },
    ],
    foods: [
      { zh: '三文鱼（omega-3 最高，每 100g 含 2.5g EPA+DHA）', en: 'Salmon (highest omega-3 — 2.5g EPA+DHA per 100g)' },
      { zh: '沙丁鱼、秋刀鱼、鲭鱼（廉价高营养）', en: 'Sardines, mackerel (affordable and highly nutritious)' },
      { zh: '金枪鱼（方便罐头也可以）', en: 'Tuna (canned is convenient and fine)' },
      { zh: '虾、扇贝、蛤蜊（低脂高蛋白，锌含量高）', en: 'Shrimp, scallops, clams (low fat, high protein, high zinc)' },
    ],
    tip: { zh: '深海冷水鱼（三文鱼、沙丁鱼、鲭鱼）omega-3 含量远高于淡水鱼，尽量优选。每次约 150g，每周 2 次即可达标', en: 'Cold-water fatty fish (salmon, sardines, mackerel) have far more omega-3 than freshwater fish. ~150g twice a week meets the target' },
  },
  fermented: {
    category: 'fermented',
    benefits: [
      { zh: '活性益生菌（乳酸菌等）调节肠道菌群，增强肠道屏障，减少内毒素入血引起的炎症', en: 'Live probiotics (lactobacillus etc.) balance gut microbiome, strengthen gut barrier, and reduce inflammation from endotoxin leakage' },
      { zh: '发酵过程产生短链脂肪酸（丁酸），直接向免疫系统发出抗炎信号', en: 'Fermentation produces short-chain fatty acids (butyrate) that directly signal the immune system to reduce inflammation' },
      { zh: '韩国泡菜、味噌等含有几十种有益菌株，多样性高于大多数益生菌补剂', en: 'Kimchi, miso, etc. contain dozens of beneficial strains — more diversity than most probiotic supplements' },
    ],
    foods: [
      { zh: '希腊酸奶（蛋白质高，选无糖）', en: 'Greek yogurt (high protein — choose unsweetened)' },
      { zh: '韩式泡菜（最简单的随餐发酵菜）', en: 'Kimchi (easiest fermented side dish)' },
      { zh: '味噌汤（味噌不要煮沸，保留活菌）', en: 'Miso soup (don\'t boil — add miso at end to preserve live cultures)' },
      { zh: '纳豆（维 K2 最高，益心血管，日本长寿饮食核心）', en: 'Natto (highest vitamin K2, great for cardiovascular health — a longevity staple in Japan)' },
      { zh: '开菲尔、酸菜、康普茶（多样发酵来源）', en: 'Kefir, sauerkraut, kombucha (diverse fermented options)' },
    ],
    tip: { zh: '加热会杀死活菌，泡菜最好直接冷食，味噌在汤出锅后再加入。每天一份即能维持肠道菌群多样性', en: 'Heat kills live cultures — eat kimchi cold and add miso after cooking. One serving daily maintains gut microbiome diversity' },
  },
};

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
  const categories: MedCategory[] = ['vegetable', 'fruit', 'whole_grain', 'legume', 'nut', 'seafood', 'fermented'];

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
      message = `过去7天吃了 ${weekCount} 次，目标 ${target.weeklyServings} 次`;
      messageEn = `${weekCount}/${target.weeklyServings} servings in the past 7 days`;
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
