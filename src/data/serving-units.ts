// ============================================
// 份量换算数据库
// 两层结构：关键词精确匹配 → 食物分类默认值
// ============================================

import type { ServingSize } from '../types/food';
import type { FoodCategory } from '../types/food';

// ── 关键词 → 份量选项 ──────────────────────────────────────────────
// 匹配 food.name + nameEn + aliases（不区分大小写），第一个匹配为准
// 关键词数组内任意一个命中即触发

export interface KeywordServingEntry {
  keywords: string[];
  servings: ServingSize[];
}

export const KEYWORD_SERVINGS: KeywordServingEntry[] = [
  // ── 咖啡系列 ──
  {
    keywords: ['espresso', 'ristretto', '浓缩咖啡', '意式浓缩', 'espreso'],
    servings: [
      { label: '1 shot (30ml)', grams: 30 },
      { label: 'Double shot (60ml)', grams: 60 },
      { label: 'Triple shot (90ml)', grams: 90 },
    ],
  },
  {
    keywords: ['latte', 'cappuccino', 'flat white', '拿铁', '卡布奇诺', '馥芮白', 'macchiato', '玛奇朵'],
    servings: [
      { label: 'Tall (355ml)', grams: 355 },
      { label: 'Grande (473ml)', grams: 473 },
      { label: 'Venti (591ml)', grams: 591 },
    ],
  },
  {
    keywords: ['americano', '美式', 'drip coffee', 'black coffee', '黑咖啡', '手冲咖啡', 'pour over', 'brewed coffee'],
    servings: [
      { label: '小杯 (240ml)', grams: 240 },
      { label: '中杯 (355ml)', grams: 355 },
      { label: '大杯 (480ml)', grams: 480 },
    ],
  },
  {
    keywords: ['cold brew', '冷萃'],
    servings: [
      { label: '小瓶 (250ml)', grams: 250 },
      { label: '中杯 (355ml)', grams: 355 },
    ],
  },
  // ── 茶 ──
  {
    keywords: ['tea', '茶', 'matcha', '抹茶'],
    servings: [
      { label: '1杯 (240ml)', grams: 240 },
      { label: '大杯 (350ml)', grams: 350 },
    ],
  },
  {
    keywords: ['bubble tea', 'boba', '奶茶', '珍珠奶茶'],
    servings: [
      { label: '中杯 (500ml)', grams: 500 },
      { label: '大杯 (700ml)', grams: 700 },
    ],
  },
  // ── 其他饮品 ──
  {
    keywords: ['milk', '牛奶', '全脂奶', '脱脂奶', '低脂奶', 'oat milk', '燕麦奶', 'almond milk', '杏仁奶', 'soy milk', '豆浆'],
    servings: [
      { label: '1杯 (240ml)', grams: 240 },
      { label: '大杯 (350ml)', grams: 350 },
      { label: '1瓶 (500ml)', grams: 500 },
    ],
  },
  {
    keywords: ['juice', '果汁', 'orange juice', '橙汁', 'apple juice', '苹果汁'],
    servings: [
      { label: '1杯 (240ml)', grams: 240 },
      { label: '小瓶 (350ml)', grams: 350 },
      { label: '大瓶 (500ml)', grams: 500 },
    ],
  },
  {
    keywords: ['smoothie', 'shake', '奶昔', '冰沙'],
    servings: [
      { label: '中杯 (350ml)', grams: 350 },
      { label: '大杯 (500ml)', grams: 500 },
    ],
  },
  {
    keywords: ['soda', 'cola', '可乐', 'sprite', '雪碧', 'fanta', '芬达', 'carbonated'],
    servings: [
      { label: '1罐 (355ml)', grams: 355 },
      { label: '1瓶 (500ml)', grams: 500 },
      { label: '大瓶 (600ml)', grams: 600 },
    ],
  },
  {
    keywords: ['beer', '啤酒'],
    servings: [
      { label: '1罐 (355ml)', grams: 355 },
      { label: '1瓶 (500ml)', grams: 500 },
    ],
  },
  {
    keywords: ['wine', '红酒', '白酒', '葡萄酒'],
    servings: [
      { label: '1杯 (150ml)', grams: 150 },
      { label: '半瓶 (375ml)', grams: 375 },
    ],
  },
  {
    keywords: ['water', '水', 'coconut water', '椰子水'],
    servings: [
      { label: '1杯 (240ml)', grams: 240 },
      { label: '1瓶 (500ml)', grams: 500 },
    ],
  },
  {
    keywords: ['protein shake', 'protein drink', '蛋白饮料'],
    servings: [
      { label: '1瓶 (355ml)', grams: 355 },
    ],
  },
  // ── 主食 / 谷物 ──
  {
    keywords: ['rice', '米饭', '白米饭', '糙米饭', '炒饭', 'fried rice'],
    servings: [
      { label: '1小碗 (100g)', grams: 100 },
      { label: '1碗 (150g)', grams: 150 },
      { label: '1大碗 (200g)', grams: 200 },
    ],
  },
  {
    keywords: ['congee', 'porridge', '粥', '稀饭'],
    servings: [
      { label: '1碗 (300g)', grams: 300 },
      { label: '大碗 (400g)', grams: 400 },
    ],
  },
  {
    keywords: ['oatmeal', 'oat', '燕麦', '麦片'],
    servings: [
      { label: '半份干 (40g)', grams: 40 },
      { label: '1份干 (80g)', grams: 80 },
      { label: '1碗熟 (240g)', grams: 240 },
    ],
  },
  {
    keywords: ['pasta', 'spaghetti', 'penne', 'fettuccine', '意面', '意大利面'],
    servings: [
      { label: '1份干 (80g)', grams: 80 },
      { label: '大份干 (120g)', grams: 120 },
      { label: '1碗熟 (200g)', grams: 200 },
    ],
  },
  {
    keywords: ['noodle', 'ramen', '面条', '拉面', '乌冬', 'udon', '河粉', '米粉'],
    servings: [
      { label: '1份 (150g)', grams: 150 },
      { label: '大份 (200g)', grams: 200 },
    ],
  },
  {
    keywords: ['bread', 'toast', '吐司', '全麦面包', '白面包'],
    servings: [
      { label: '1片 (30g)', grams: 30 },
      { label: '2片 (60g)', grams: 60 },
    ],
  },
  {
    keywords: ['bagel', '百吉饼'],
    servings: [
      { label: '半个 (52g)', grams: 52 },
      { label: '1个 (105g)', grams: 105 },
    ],
  },
  {
    keywords: ['bun', 'mantou', '馒头', '包子'],
    servings: [
      { label: '1个小 (50g)', grams: 50 },
      { label: '1个 (100g)', grams: 100 },
    ],
  },
  {
    keywords: ['tortilla', 'wrap', '墨西哥饼'],
    servings: [
      { label: '1张小 (45g)', grams: 45 },
      { label: '1张大 (70g)', grams: 70 },
    ],
  },
  {
    keywords: ['cracker', '饼干', '苏打饼'],
    servings: [
      { label: '1份 (28g)', grams: 28 },
      { label: '半包 (56g)', grams: 56 },
    ],
  },
  // ── 蛋类 ──
  {
    keywords: ['egg', '鸡蛋', '蛋', 'boiled egg', 'scrambled egg', '煮蛋', '炒蛋'],
    servings: [
      { label: '1个 (50g)', grams: 50 },
      { label: '2个 (100g)', grams: 100 },
      { label: '3个 (150g)', grams: 150 },
    ],
  },
  // ── 肉类 ──
  {
    keywords: ['chicken breast', '鸡胸肉', '鸡胸'],
    servings: [
      { label: '半块 (60g)', grams: 60 },
      { label: '1块 (120g)', grams: 120 },
      { label: '1块大 (170g)', grams: 170 },
    ],
  },
  {
    keywords: ['chicken thigh', 'chicken leg', '鸡腿', '鸡大腿'],
    servings: [
      { label: '1个 (120g)', grams: 120 },
      { label: '2个 (240g)', grams: 240 },
    ],
  },
  {
    keywords: ['chicken wing', '鸡翅'],
    servings: [
      { label: '1个 (40g)', grams: 40 },
      { label: '4个 (160g)', grams: 160 },
      { label: '6个 (240g)', grams: 240 },
    ],
  },
  {
    keywords: ['steak', '牛排'],
    servings: [
      { label: '半份 (100g)', grams: 100 },
      { label: '1份 (180g)', grams: 180 },
      { label: '大份 (250g)', grams: 250 },
    ],
  },
  {
    keywords: ['beef', '牛肉', 'ground beef', '肉末', '碎牛肉'],
    servings: [
      { label: '半份 (75g)', grams: 75 },
      { label: '1份 (150g)', grams: 150 },
    ],
  },
  {
    keywords: ['pork', '猪肉', '猪排', 'bacon', '培根'],
    servings: [
      { label: '1片 (28g)', grams: 28 },
      { label: '1份 (100g)', grams: 100 },
    ],
  },
  {
    keywords: ['turkey', '火鸡', '火鸡肉'],
    servings: [
      { label: '1片 (28g)', grams: 28 },
      { label: '1份 (85g)', grams: 85 },
    ],
  },
  // ── 海鲜 ──
  {
    keywords: ['salmon', '三文鱼', '鲑鱼'],
    servings: [
      { label: '半份 (50g)', grams: 50 },
      { label: '1份 (100g)', grams: 100 },
      { label: '1块 (140g)', grams: 140 },
    ],
  },
  {
    keywords: ['tuna', '金枪鱼', '吞拿鱼'],
    servings: [
      { label: '半份 (50g)', grams: 50 },
      { label: '1份 (100g)', grams: 100 },
      { label: '1罐 (140g)', grams: 140 },
    ],
  },
  {
    keywords: ['shrimp', 'prawn', '虾', '对虾'],
    servings: [
      { label: '6只约 (60g)', grams: 60 },
      { label: '1份 (100g)', grams: 100 },
    ],
  },
  {
    keywords: ['fish', '鱼', 'cod', 'tilapia', 'halibut', 'sea bass', '鳕鱼', '罗非鱼', '鲈鱼'],
    servings: [
      { label: '半份 (80g)', grams: 80 },
      { label: '1份 (150g)', grams: 150 },
    ],
  },
  // ── 水果 ──
  {
    keywords: ['apple', '苹果'],
    servings: [
      { label: '1个中 (182g)', grams: 182 },
      { label: '1个大 (223g)', grams: 223 },
    ],
  },
  {
    keywords: ['banana', '香蕉'],
    servings: [
      { label: '1根中 (118g)', grams: 118 },
      { label: '1根大 (136g)', grams: 136 },
    ],
  },
  {
    keywords: ['orange', '橙子', '柑橘'],
    servings: [
      { label: '1个中 (131g)', grams: 131 },
      { label: '1个大 (184g)', grams: 184 },
    ],
  },
  {
    keywords: ['strawberry', 'blueberry', 'raspberry', 'berries', '草莓', '蓝莓', '覆盆子', '浆果'],
    servings: [
      { label: '1小把 (30g)', grams: 30 },
      { label: '半杯 (75g)', grams: 75 },
      { label: '1杯 (150g)', grams: 150 },
    ],
  },
  {
    keywords: ['grape', '葡萄'],
    servings: [
      { label: '1小串 (80g)', grams: 80 },
      { label: '1杯 (92g)', grams: 92 },
    ],
  },
  {
    keywords: ['avocado', '牛油果', '鳄梨'],
    servings: [
      { label: '半个 (75g)', grams: 75 },
      { label: '1个 (150g)', grams: 150 },
    ],
  },
  {
    keywords: ['mango', '芒果'],
    servings: [
      { label: '半个 (100g)', grams: 100 },
      { label: '1个 (200g)', grams: 200 },
    ],
  },
  {
    keywords: ['watermelon', '西瓜'],
    servings: [
      { label: '1片 (280g)', grams: 280 },
      { label: '2片 (560g)', grams: 560 },
    ],
  },
  // ── 蔬菜 ──
  {
    keywords: ['salad', '沙拉', 'green salad', 'caesar'],
    servings: [
      { label: '1份 (150g)', grams: 150 },
      { label: '大份 (250g)', grams: 250 },
    ],
  },
  {
    keywords: ['broccoli', 'spinach', 'kale', '西兰花', '菠菜', '羽衣甘蓝'],
    servings: [
      { label: '1份 (85g)', grams: 85 },
      { label: '大份 (170g)', grams: 170 },
    ],
  },
  // ── 奶制品 ──
  {
    keywords: ['cheese', '奶酪', '芝士', 'cheddar', 'mozzarella', '切达', '马苏里拉'],
    servings: [
      { label: '1片 (28g)', grams: 28 },
      { label: '2片 (56g)', grams: 56 },
    ],
  },
  {
    keywords: ['cream cheese', '奶油芝士', '奶油奶酪'],
    servings: [
      { label: '1汤匙 (15g)', grams: 15 },
      { label: '2汤匙 (30g)', grams: 30 },
    ],
  },
  {
    keywords: ['yogurt', 'greek yogurt', '酸奶', '希腊酸奶'],
    servings: [
      { label: '1小杯 (170g)', grams: 170 },
      { label: '1大杯 (227g)', grams: 227 },
    ],
  },
  {
    keywords: ['butter', '黄油', '奶油'],
    servings: [
      { label: '1茶匙 (5g)', grams: 5 },
      { label: '1汤匙 (14g)', grams: 14 },
    ],
  },
  // ── 坚果 / 种子 ──
  {
    keywords: ['peanut butter', '花生酱'],
    servings: [
      { label: '1汤匙 (16g)', grams: 16 },
      { label: '2汤匙 (32g)', grams: 32 },
    ],
  },
  {
    keywords: ['almond', 'walnut', 'cashew', 'pecan', '杏仁', '核桃', '腰果', '榛子', 'nuts', '坚果', 'mixed nuts'],
    servings: [
      { label: '1小把 (28g)', grams: 28 },
      { label: '1/4杯 (35g)', grams: 35 },
    ],
  },
  // ── 油脂 / 调料 ──
  {
    keywords: ['oil', 'olive oil', '橄榄油', '植物油', '食用油', '椰子油', '亚麻籽油'],
    servings: [
      { label: '1茶匙 (5g)', grams: 5 },
      { label: '1汤匙 (14g)', grams: 14 },
    ],
  },
  {
    keywords: ['sugar', '白糖', '砂糖', '红糖', '糖'],
    servings: [
      { label: '1茶匙 (4g)', grams: 4 },
      { label: '1汤匙 (12g)', grams: 12 },
    ],
  },
  {
    keywords: ['maple syrup', '枫糖浆', 'honey', '蜂蜜'],
    servings: [
      { label: '1茶匙 (7g)', grams: 7 },
      { label: '1汤匙 (21g)', grams: 21 },
    ],
  },
  {
    keywords: ['soy sauce', '酱油', '生抽', '老抽'],
    servings: [
      { label: '1茶匙 (5g)', grams: 5 },
      { label: '1汤匙 (15g)', grams: 15 },
    ],
  },
  {
    keywords: ['ketchup', 'tomato sauce', '番茄酱', '番茄沙司'],
    servings: [
      { label: '1汤匙 (15g)', grams: 15 },
      { label: '2汤匙 (30g)', grams: 30 },
    ],
  },
  {
    keywords: ['mayonnaise', '蛋黄酱', '沙拉酱'],
    servings: [
      { label: '1汤匙 (14g)', grams: 14 },
      { label: '2汤匙 (28g)', grams: 28 },
    ],
  },
  {
    keywords: ['salt', '盐', '食盐'],
    servings: [
      { label: '1茶匙 (5g)', grams: 5 },
    ],
  },
  // ── 零食 ──
  {
    keywords: ['chocolate', '巧克力', 'dark chocolate', '黑巧克力'],
    servings: [
      { label: '1格 (15g)', grams: 15 },
      { label: '1块 (30g)', grams: 30 },
    ],
  },
  {
    keywords: ['chips', 'crisps', '薯片', '薯条'],
    servings: [
      { label: '1份 (28g)', grams: 28 },
      { label: '半包 (56g)', grams: 56 },
    ],
  },
  {
    keywords: ['protein bar', 'clif bar', 'energy bar', 'granola bar', '能量棒', '蛋白棒', '谷物棒'],
    servings: [
      { label: '1条 (45g)', grams: 45 },
      { label: '1条大 (68g)', grams: 68 },
    ],
  },
  {
    keywords: ['protein powder', 'whey', 'casein', '蛋白粉', '乳清蛋白'],
    servings: [
      { label: '1勺 (30g)', grams: 30 },
      { label: '2勺 (60g)', grams: 60 },
    ],
  },
  {
    keywords: ['cookie', 'biscuit', '曲奇', '饼干'],
    servings: [
      { label: '1块 (14g)', grams: 14 },
      { label: '2块 (28g)', grams: 28 },
    ],
  },
  {
    keywords: ['muffin', '马芬', '松饼'],
    servings: [
      { label: '1个小 (57g)', grams: 57 },
      { label: '1个大 (113g)', grams: 113 },
    ],
  },
  // ── 快餐 / 正餐 ──
  {
    keywords: ['sushi', '寿司', '握寿司', '手卷'],
    servings: [
      { label: '1个 (25g)', grams: 25 },
      { label: '1份6个 (150g)', grams: 150 },
      { label: '1份10个 (250g)', grams: 250 },
    ],
  },
  {
    keywords: ['dumpling', 'gyoza', '饺子', '锅贴', '煎饺'],
    servings: [
      { label: '1个 (20g)', grams: 20 },
      { label: '1份6个 (120g)', grams: 120 },
      { label: '1份10个 (200g)', grams: 200 },
    ],
  },
  {
    keywords: ['baozi', 'bao', '包子', '叉烧包', '奶黄包'],
    servings: [
      { label: '1个小 (40g)', grams: 40 },
      { label: '1个 (75g)', grams: 75 },
    ],
  },
  {
    keywords: ['pizza'],
    servings: [
      { label: '1片 (107g)', grams: 107 },
      { label: '2片 (214g)', grams: 214 },
    ],
  },
  {
    keywords: ['burger', 'hamburger', '汉堡', '汉堡包'],
    servings: [
      { label: '1个 (180g)', grams: 180 },
      { label: '1个大 (280g)', grams: 280 },
    ],
  },
  {
    keywords: ['sandwich', '三明治', '潜艇堡', 'sub', 'subway'],
    servings: [
      { label: '6英寸 (200g)', grams: 200 },
      { label: '12英寸 (400g)', grams: 400 },
    ],
  },
  {
    keywords: ['hot dog', '热狗'],
    servings: [
      { label: '1个 (100g)', grams: 100 },
    ],
  },
];

// ── 分类默认值（关键词无匹配时的兜底） ─────────────────────────────

export const CATEGORY_DEFAULTS: Record<FoodCategory, ServingSize[]> = {
  drink: [
    { label: '1杯 (240ml)', grams: 240 },
    { label: '小杯 (200ml)', grams: 200 },
    { label: '中杯 (350ml)', grams: 350 },
    { label: '大杯 (500ml)', grams: 500 },
  ],
  grain: [
    { label: '1份 (100g)', grams: 100 },
    { label: '1碗 (150g)', grams: 150 },
    { label: '大份 (200g)', grams: 200 },
  ],
  meat: [
    { label: '半份 (50g)', grams: 50 },
    { label: '1份 (100g)', grams: 100 },
    { label: '大份 (150g)', grams: 150 },
  ],
  seafood: [
    { label: '半份 (50g)', grams: 50 },
    { label: '1份 (100g)', grams: 100 },
    { label: '大份 (150g)', grams: 150 },
  ],
  vegetable: [
    { label: '半份 (50g)', grams: 50 },
    { label: '1份 (100g)', grams: 100 },
    { label: '大份 (200g)', grams: 200 },
  ],
  fruit: [
    { label: '半个 (75g)', grams: 75 },
    { label: '1个中 (150g)', grams: 150 },
    { label: '1个大 (200g)', grams: 200 },
  ],
  dairy: [
    { label: '1份 (100g)', grams: 100 },
    { label: '1杯 (240g)', grams: 240 },
  ],
  egg: [
    { label: '1个 (50g)', grams: 50 },
    { label: '2个 (100g)', grams: 100 },
    { label: '3个 (150g)', grams: 150 },
  ],
  soy: [
    { label: '1份 (100g)', grams: 100 },
    { label: '1杯 (240g)', grams: 240 },
  ],
  nut: [
    { label: '1小把 (28g)', grams: 28 },
    { label: '2把 (56g)', grams: 56 },
  ],
  oil: [
    { label: '1茶匙 (5g)', grams: 5 },
    { label: '1汤匙 (14g)', grams: 14 },
  ],
  snack: [
    { label: '1份 (28g)', grams: 28 },
    { label: '半包 (56g)', grams: 56 },
    { label: '1包 (100g)', grams: 100 },
  ],
  branded: [
    { label: '半份 (50g)', grams: 50 },
    { label: '1份 (100g)', grams: 100 },
    { label: '大份 (150g)', grams: 150 },
  ],
  other: [
    { label: '半份 (50g)', grams: 50 },
    { label: '1份 (100g)', grams: 100 },
    { label: '大份 (150g)', grams: 150 },
  ],
};
