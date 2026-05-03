// ============================================
// 目标警示 & 地中海饮食打卡工具
// ============================================

import type { GoalType } from '../types/user';
import type { MealItem } from '../types/log';

// ── 食物警示 ─────────────────────────────────────────────────────────

export interface FoodWarning {
  level: 'warn' | 'caution';   // warn=红色警示, caution=黄色注意
  emoji: string;
  reason: string;               // 中文
  reasonEn: string;             // 英文
}

/** 关键词匹配（食物名称小写后判断） */
function matchAny(name: string, keywords: string[]): boolean {
  const lower = name.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

// ── 抗炎目标警示词库 ────────────────────────────────────────────────

/** 红色警示：明确不建议 */
const ANTI_INFLAM_WARN = [
  '炸鸡', '炸薯', '炸鱼', '炸里', '炸猪', '炸牛', '炸虾', '油炸', '炸串', '炸糕', '炸酱',
  '香肠', '腊肠', '热狗', '午餐肉', '腊肉', '火腿肠', '培根', '烤肠',
  '可乐', '雪碧', '芬达', '汽水', '碳酸', '奶茶', '珍珠奶茶', '果汁饮料', '糖果',
  '蛋糕', '甜甜圈', '饼干', '薯片', '膨化', '方便面', '泡面',
  '啤酒', '白酒', '红酒', '葡萄酒', '洋酒', '威士忌', '烈酒',
];

/** 黄色注意：适量即可，超量提示 */
const ANTI_INFLAM_CAUTION = [
  '猪肉', '牛肉', '羊肉', '猪排', '牛排', '羊排', '红烧肉', '扣肉', '回锅肉',
  '白米饭', '白面包', '馒头', '白面条', '面包', '吐司',
  '泡菜', '咸菜', '腌菜', '酱菜',
  '黄油', '奶油', '动物油', '猪油', '牛油',
];

// ── 减脂目标警示词库 ─────────────────────────────────────────────────

const FAT_LOSS_WARN = [
  '可乐', '雪碧', '奶茶', '珍珠奶茶', '果汁饮料', '碳酸',
  '薯片', '膨化', '炸鸡', '炸薯', '油炸',
  '蛋糕', '甜甜圈', '冰淇淋', '糖',
  '啤酒', '白酒',
];

const FAT_LOSS_CAUTION = [
  '炸', '油炸', '油条', '油饼', '红烧肉', '扣肉', '回锅肉',
  '黄油', '奶油', '猪油',
];

// ── 控血糖目标警示词库 ───────────────────────────────────────────────

const BLOOD_SUGAR_WARN = [
  '糖果', '蛋糕', '甜甜圈', '饼干', '冰淇淋', '雪糕',
  '白米饭', '白面条', '白面包', '馒头', '油条',
  '可乐', '雪碧', '奶茶', '果汁饮料', '含糖饮料',
  '糯米', '汤圆', '粽子', '年糕',
];

const BLOOD_SUGAR_CAUTION = [
  '白粥', '米粥', '稀饭', '面包', '吐司',
  '薯片', '膨化', '炸薯',
  '西瓜', '荔枝', '榴莲', '葡萄干',
];

/**
 * 获取某个食物条目相对于用户目标的警示
 * 返回 null 表示无问题
 */
export function getFoodWarning(foodName: string, goals: GoalType[]): FoodWarning | null {
  const warnings: FoodWarning[] = [];

  if (goals.includes('anti_inflammatory')) {
    if (matchAny(foodName, ANTI_INFLAM_WARN)) {
      warnings.push({
        level: 'warn',
        emoji: '🚫',
        reason: '含炸/加工食品/酒精/高糖，不利于抗炎',
        reasonEn: 'Fried/processed/alcohol/high-sugar — not anti-inflammatory',
      });
    } else if (matchAny(foodName, ANTI_INFLAM_CAUTION)) {
      warnings.push({
        level: 'caution',
        emoji: '⚠️',
        reason: '红肉/精制主食/高钠，抗炎目标下建议适量',
        reasonEn: 'Red meat/refined grains/high sodium — limit for anti-inflammatory goals',
      });
    }
  }

  if (goals.includes('fat_loss')) {
    if (matchAny(foodName, FAT_LOSS_WARN)) {
      warnings.push({
        level: 'warn',
        emoji: '🚫',
        reason: '空热量/高糖/高脂，减脂期应避免',
        reasonEn: 'Empty calories/high sugar/high fat — avoid when cutting',
      });
    } else if (matchAny(foodName, FAT_LOSS_CAUTION)) {
      warnings.push({
        level: 'caution',
        emoji: '⚠️',
        reason: '高油脂食物，减脂期建议控量',
        reasonEn: 'High-fat food — control portions when cutting',
      });
    }
  }

  if (goals.includes('blood_sugar')) {
    if (matchAny(foodName, BLOOD_SUGAR_WARN)) {
      warnings.push({
        level: 'warn',
        emoji: '🚫',
        reason: '高GI/高糖食物，会导致血糖快速升高',
        reasonEn: 'High-GI/high-sugar food — causes rapid blood sugar spikes',
      });
    } else if (matchAny(foodName, BLOOD_SUGAR_CAUTION)) {
      warnings.push({
        level: 'caution',
        emoji: '⚠️',
        reason: '中高GI食物，控血糖时建议配合蛋白质/纤维一起吃',
        reasonEn: 'Medium-high GI — pair with protein or fiber to manage blood sugar',
      });
    }
  }

  if (warnings.length === 0) return null;
  // 返回最严重的一条（warn > caution）
  return warnings.find(w => w.level === 'warn') ?? warnings[0];
}

// ── 地中海饮食打卡 ──────────────────────────────────────────────────

export type MedCategory =
  | 'vegetable'
  | 'fruit'
  | 'whole_grain'
  | 'legume'
  | 'nut'
  | 'seafood'
  | 'dairy';

export interface MedCheckItem {
  category: MedCategory;
  icon: string;
  label: string;
  labelEn: string;
  done: boolean;
  suggestion: string;     // 今天还没吃，推荐吃什么
  suggestionEn: string;
}

/** 各类别的关键词 */
const MED_KEYWORDS: Record<MedCategory, string[]> = {
  vegetable: [
    '菜', '菠菜', '西兰花', '花椰菜', '番茄', '西红柿', '胡萝卜', '黄瓜',
    '茄子', '青椒', '洋葱', '生菜', '芹菜', '韭菜', '白菜', '南瓜', '藕',
    '豆角', '芦笋', '蘑菇', '菌', '秋葵', '苦瓜', '冬瓜', '丝瓜', '木耳',
    '海带', '紫菜', '香菇', '平菇', '金针菇', 'lettuce', 'spinach', 'broccoli',
    'tomato', 'carrot', 'cucumber', 'mushroom', 'vegetable', 'salad',
  ],
  fruit: [
    '苹果', '香蕉', '橙', '柑', '橘', '草莓', '蓝莓', '葡萄', '桃', '梨',
    '西瓜', '芒果', '猕猴桃', '柠檬', '樱桃', '哈密瓜', '火龙果', '石榴',
    '柚', '无花果', '覆盆子', '黑莓', '杨梅', '李子', '杏', '枇杷',
    'apple', 'banana', 'orange', 'berry', 'mango', 'grape', 'fruit',
  ],
  whole_grain: [
    '燕麦', '糙米', '全麦', '藜麦', '大麦', '荞麦', '小米', '玉米', '紫米',
    '黑米', '全谷', '杂粮', '杂豆', '麦片', '燕麦片',
    'oat', 'quinoa', 'brown rice', 'whole grain', 'whole wheat', 'barley',
  ],
  legume: [
    '豆腐', '豆浆', '黑豆', '红豆', '绿豆', '鹰嘴豆', '扁豆', '芸豆', '花豆',
    '毛豆', '大豆', '黄豆', '豆皮', '豆干', '内酯', '嫩豆腐', '老豆腐',
    '豆渣', '天贝', 'tempeh',
    'tofu', 'soy', 'bean', 'lentil', 'chickpea', 'edamame',
  ],
  nut: [
    '坚果', '核桃', '杏仁', '腰果', '花生', '松子', '榛子', '开心果',
    '夏威夷果', '葵花籽', '南瓜籽', '亚麻籽', '芝麻', '芝麻酱', '花生酱',
    'nut', 'almond', 'walnut', 'cashew', 'peanut', 'pistachio', 'sesame',
  ],
  seafood: [
    '鱼', '虾', '蟹', '海鲜', '三文鱼', '金枪鱼', '鲈鱼', '带鱼', '鲫鱼',
    '草鱼', '鲤鱼', '鳕鱼', '鲑鱼', '秋刀鱼', '沙丁鱼', '贝', '牡蛎',
    '扇贝', '花蛤', '蛤蜊', '墨鱼', '鱿鱼', '章鱼', '海参', '鲍鱼',
    'fish', 'salmon', 'tuna', 'shrimp', 'prawn', 'seafood', 'oyster',
  ],
  dairy: [
    '酸奶', '奶酪', '牛奶', '芝士', '希腊酸奶', '低脂奶', '脱脂奶', '乳酸菌',
    'yogurt', 'cheese', 'milk', 'dairy',
  ],
};

/** 各类别未打卡时的建议 */
const MED_SUGGESTIONS: Record<MedCategory, { zh: string; en: string }> = {
  vegetable: {
    zh: '试试加一份西兰花、菠菜沙拉或炒时蔬',
    en: 'Try adding broccoli, spinach salad or stir-fried veggies',
  },
  fruit:     {
    zh: '可以加一个苹果、橙子或一把蓝莓',
    en: 'Add an apple, orange or a handful of blueberries',
  },
  whole_grain: {
    zh: '把白米饭换成糙米、小米或燕麦试试',
    en: 'Swap white rice for brown rice, millet or oats',
  },
  legume:    {
    zh: '加一份豆腐、毛豆或豆浆',
    en: 'Add tofu, edamame or soy milk',
  },
  nut:       {
    zh: '随手来一小把核桃、杏仁或腰果（约30g）',
    en: 'Grab a small handful of walnuts, almonds or cashews (~30g)',
  },
  seafood:   {
    zh: '今天可以加一块三文鱼、虾仁或贝类',
    en: 'Add salmon, shrimp or shellfish today',
  },
  dairy:     {
    zh: '来一杯希腊酸奶或一小块奶酪',
    en: 'Have some Greek yogurt or a small piece of cheese',
  },
};

const MED_META: Record<MedCategory, { icon: string; label: string; labelEn: string }> = {
  vegetable:   { icon: '🥬', label: '蔬菜',    labelEn: 'Veggies'    },
  fruit:       { icon: '🍎', label: '水果',    labelEn: 'Fruit'      },
  whole_grain: { icon: '🌾', label: '全谷物',  labelEn: 'Whole Grain' },
  legume:      { icon: '🫘', label: '豆类',    labelEn: 'Legumes'    },
  nut:         { icon: '🥜', label: '坚果',    labelEn: 'Nuts'       },
  seafood:     { icon: '🐟', label: '鱼/海鲜', labelEn: 'Seafood'    },
  dairy:       { icon: '🥛', label: '乳制品',  labelEn: 'Dairy'      },
};

const MED_ORDER: MedCategory[] = [
  'vegetable', 'fruit', 'whole_grain', 'legume', 'nut', 'seafood', 'dairy',
];

/**
 * 根据今日食物名称列表，计算地中海饮食打卡结果
 */
export function getMediterraneanChecklist(items: MealItem[]): MedCheckItem[] {
  const eaten = new Set<MedCategory>();

  for (const item of items) {
    const name = item.foodName;
    for (const [cat, keywords] of Object.entries(MED_KEYWORDS) as [MedCategory, string[]][]) {
      if (!eaten.has(cat) && matchAny(name, keywords)) {
        eaten.add(cat);
      }
    }
  }

  return MED_ORDER.map(cat => {
    const meta = MED_META[cat];
    const sug = MED_SUGGESTIONS[cat];
    return {
      category: cat,
      icon: meta.icon,
      label: meta.label,
      labelEn: meta.labelEn,
      done: eaten.has(cat),
      suggestion: sug.zh,
      suggestionEn: sug.en,
    };
  });
}

/**
 * 获取未打卡类别的建议列表（最多3条）
 */
export function getMissingMedSuggestions(checklist: MedCheckItem[]): MedCheckItem[] {
  return checklist.filter(c => !c.done).slice(0, 3);
}
