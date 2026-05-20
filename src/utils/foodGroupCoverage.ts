// ============================================
// 食物多样性覆盖计算
// 从当日食物日志推断覆盖了哪些食物类别
// ============================================

import type { DailyLog } from '../types/log';
import type { FoodCategory } from '../types/food';

// ---- 关键词匹配表（食物名 → FOOD_GROUP key） ----
const NAME_TO_GROUP: { pattern: RegExp; group: string }[] = [
  {
    pattern: /鱼(?!香)|虾|蟹|海鲜|鱿|墨鱼|章鱼|扇贝|蛤|贝|牡蛎|鲑|三文鱼|金枪鱼|tuna|salmon|鳕鱼|鲈鱼|带鱼|鲷/i,
    group: 'fish',
  },
  {
    pattern: /蔬菜|菠菜|西兰花|花椰菜|生菜|叶菜|白菜|青菜|芹菜|胡萝卜|黄瓜|番茄|西红柿|茄子|辣椒|韭菜|萝卜|南瓜|丝瓜|苦瓜|秋葵|莴苣|青椒|红椒|卷心菜|大白菜|小白菜|上海青|空心菜|水菜|菜心|芥兰|芦笋|豆角|扁豆(?!腐)|西葫芦|山药|莲藕/i,
    group: 'veg',
  },
  {
    pattern: /水果|苹果|香蕉|橙子|橙|草莓|蓝莓|葡萄|西瓜|芒果|桃|梨|柠檬|菠萝|哈密瓜|樱桃|柚子|杨梅|石榴|木瓜|猕猴桃|鲜枣|荔枝|龙眼|枇杷|杏|李子|柑橘|橘子/i,
    group: 'fruit',
  },
  {
    pattern: /米饭|白米|糙米|米粥|粥|面条|面包|馒头|包子|饺子|馄饨|全麦|燕麦|麦片|藜麦|小米|玉米|荞麦|薏米|意面|通心粉|意大利面|pasta|饼|糕点(?!豆)|年糕|汤圆|粽子/i,
    group: 'grain',
  },
  {
    pattern: /豆腐|豆浆|毛豆|豌豆|黑豆|红豆|绿豆|黄豆|豆制品|腐竹|豆皮|豆干|千张|纳豆|豆(?:腐|浆|皮|干)/i,
    group: 'bean',
  },
  {
    pattern: /核桃|杏仁|腰果|榛子|开心果|松子|葵花籽|芝麻|花生|坚果|瓜子|夏威夷果|碧根果|巴旦木/i,
    group: 'nut',
  },
  {
    pattern: /酸奶|泡菜|味噌|纳豆|开菲尔|kefir|kimchi|发酵|乳酸菌|kombucha|康普茶/i,
    group: 'ferm',
  },
];

/** 从食物名推断 FOOD_GROUP key */
export function inferFoodGroupFromName(name: string): string | null {
  for (const { pattern, group } of NAME_TO_GROUP) {
    if (pattern.test(name)) return group;
  }
  return null;
}

/** 从食物名推断 FoodCategory（用于 AI 估算食物的分类写入） */
export function inferCategoryFromName(name: string): FoodCategory {
  if (/鱼(?!香)|虾|蟹|海鲜|鱿|墨鱼|章鱼|扇贝|贝|牡蛎|鲑|三文鱼|金枪鱼|tuna|salmon|鳕鱼|鲈鱼|带鱼/i.test(name)) return 'seafood';
  if (/蔬菜|菠菜|西兰花|花椰菜|生菜|叶菜|白菜|青菜|芹菜|胡萝卜|黄瓜|番茄|西红柿|茄子|辣椒|韭菜|萝卜|南瓜|丝瓜|苦瓜|秋葵|卷心菜|菜心|芥兰|芦笋|豆角|西葫芦|山药|莲藕/i.test(name)) return 'vegetable';
  if (/水果|苹果|香蕉|橙|草莓|蓝莓|葡萄|西瓜|芒果|桃|梨|柠檬|菠萝|哈密瓜|樱桃|柚子|石榴|木瓜|猕猴桃|鲜枣|荔枝|龙眼/i.test(name)) return 'fruit';
  if (/米饭|白米|糙米|粥|面条|面包|馒头|包子|全麦|燕麦|麦片|藜麦|小米|玉米|荞麦|薏米|意面|通心粉|pasta|饼|年糕/i.test(name)) return 'grain';
  if (/豆腐|豆浆|毛豆|豌豆|黑豆|红豆|绿豆|黄豆|豆制品|腐竹|豆皮|豆干|千张/i.test(name)) return 'soy';
  if (/核桃|杏仁|腰果|榛子|开心果|松子|葵花籽|芝麻|花生|坚果|瓜子/i.test(name)) return 'nut';
  if (/猪肉|牛肉|羊肉|鸡肉|鸭肉|排骨|五花|里脊|腿肉|肉末|红烧肉|叉烧|培根|火腿|香肠/i.test(name)) return 'meat';
  if (/鸡蛋|鸭蛋|蛋(?:白|黄|液)|炒蛋|煮蛋|荷包蛋|蒸蛋|egg/i.test(name)) return 'egg';
  if (/酸奶|牛奶|奶|milk|cream|黄油|butter|奶酪|乳酪|cheese|泡菜|味噌|纳豆|发酵/i.test(name)) return 'dairy';
  if (/茶|咖啡|果汁|豆浆(?!豆)|饮料|drink/i.test(name)) return 'drink';
  return 'other';
}

/** 从当日日志计算覆盖了哪些食物类别（FOOD_GROUP key 集合） */
export function computeCoveredGroups(dailyLog: DailyLog | null): Set<string> {
  if (!dailyLog) return new Set();
  const covered = new Set<string>();
  for (const meal of dailyLog.meals) {
    for (const item of meal.items) {
      const group = inferFoodGroupFromName(item.foodName);
      if (group) covered.add(group);
    }
  }
  return covered;
}
