// ============================================
// 中文食物词汇 → 英文查询词 映射表
// 用于将中文搜索词翻译成 USDA 可识别的英文
// ============================================

/**
 * 每条记录：中文关键词数组 → USDA 搜索用英文词组
 * 匹配策略：查询字符串包含任意中文关键词时，使用对应英文查询
 */
export const ZH_EN_FOOD_TERMS: Array<{ zh: string[]; en: string }> = [
  // ── 肉类 ──
  { zh: ['炸鸡', '脆皮鸡', '香炸鸡'], en: 'fried chicken' },
  { zh: ['鸡胸', '鸡胸肉'], en: 'chicken breast' },
  { zh: ['鸡腿'], en: 'chicken thigh' },
  { zh: ['鸡翅', '鸡翼'], en: 'chicken wing' },
  { zh: ['鸡块', '麦乐鸡', '鸡米花'], en: 'chicken nuggets' },
  { zh: ['牛排', '牛扒'], en: 'beef steak' },
  { zh: ['牛肉', '碎牛'], en: 'beef' },
  { zh: ['猪肉', '猪扒'], en: 'pork' },
  { zh: ['猪排', '排骨'], en: 'pork ribs' },
  { zh: ['培根'], en: 'bacon' },
  { zh: ['火腿'], en: 'ham' },
  { zh: ['香肠', '腊肠'], en: 'sausage' },
  { zh: ['火鸡', '火鸡肉'], en: 'turkey' },
  { zh: ['羊肉', '羊排'], en: 'lamb' },
  { zh: ['鸭肉', '烤鸭', '北京鸭'], en: 'duck' },
  // ── 海鲜 ──
  { zh: ['三文鱼', '鲑鱼'], en: 'salmon' },
  { zh: ['金枪鱼', '吞拿鱼'], en: 'tuna' },
  { zh: ['虾', '对虾', '基围虾', '大虾'], en: 'shrimp' },
  { zh: ['螃蟹', '蟹肉'], en: 'crab' },
  { zh: ['龙虾'], en: 'lobster' },
  { zh: ['扇贝'], en: 'scallop' },
  { zh: ['鱿鱼', '墨鱼'], en: 'squid' },
  { zh: ['鳕鱼'], en: 'cod' },
  { zh: ['鲈鱼'], en: 'sea bass' },
  { zh: ['罗非鱼'], en: 'tilapia' },
  { zh: ['沙丁鱼'], en: 'sardine' },
  // ── 主食 / 谷物 ──
  { zh: ['米饭', '白米饭', '白饭'], en: 'white rice cooked' },
  { zh: ['糙米', '糙米饭'], en: 'brown rice cooked' },
  { zh: ['炒饭', '蛋炒饭', '扬州炒饭'], en: 'fried rice' },
  { zh: ['燕麦', '麦片', '燕麦粥'], en: 'oatmeal' },
  { zh: ['面包', '白面包', '全麦面包', '吐司'], en: 'bread' },
  { zh: ['百吉饼', '贝果'], en: 'bagel' },
  { zh: ['意面', '意大利面', '意粉'], en: 'pasta' },
  { zh: ['面条', '拉面', '乌冬'], en: 'noodles' },
  { zh: ['薯条', '炸薯条'], en: 'french fries' },
  { zh: ['薯片'], en: 'potato chips' },
  { zh: ['馒头'], en: 'steamed bun' },
  { zh: ['饺子', '水饺'], en: 'dumpling' },
  { zh: ['包子'], en: 'steamed bao' },
  { zh: ['玉米'], en: 'corn' },
  // ── 蔬菜 ──
  { zh: ['西兰花', '花椰菜'], en: 'broccoli' },
  { zh: ['菠菜'], en: 'spinach' },
  { zh: ['胡萝卜'], en: 'carrot' },
  { zh: ['西红柿', '番茄'], en: 'tomato' },
  { zh: ['黄瓜'], en: 'cucumber' },
  { zh: ['土豆', '马铃薯', '洋芋'], en: 'potato' },
  { zh: ['红薯', '番薯', '地瓜'], en: 'sweet potato' },
  { zh: ['洋葱'], en: 'onion' },
  { zh: ['大蒜', '蒜'], en: 'garlic' },
  { zh: ['生菜', '沙拉菜'], en: 'lettuce' },
  { zh: ['沙拉'], en: 'salad' },
  { zh: ['蘑菇', '香菇'], en: 'mushroom' },
  { zh: ['青椒', '甜椒'], en: 'bell pepper' },
  { zh: ['芦笋'], en: 'asparagus' },
  // ── 水果 ──
  { zh: ['苹果'], en: 'apple' },
  { zh: ['香蕉'], en: 'banana' },
  { zh: ['橙子', '橙'], en: 'orange' },
  { zh: ['草莓'], en: 'strawberry' },
  { zh: ['蓝莓'], en: 'blueberry' },
  { zh: ['葡萄'], en: 'grape' },
  { zh: ['西瓜'], en: 'watermelon' },
  { zh: ['芒果'], en: 'mango' },
  { zh: ['牛油果', '鳄梨'], en: 'avocado' },
  { zh: ['菠萝', '凤梨'], en: 'pineapple' },
  { zh: ['桃子', '水蜜桃'], en: 'peach' },
  { zh: ['梨'], en: 'pear' },
  { zh: ['樱桃'], en: 'cherry' },
  // ── 奶制品 / 蛋 ──
  { zh: ['鸡蛋', '蛋'], en: 'egg' },
  { zh: ['牛奶', '全脂奶'], en: 'whole milk' },
  { zh: ['脱脂奶', '低脂奶'], en: 'skim milk' },
  { zh: ['酸奶', '希腊酸奶'], en: 'greek yogurt' },
  { zh: ['奶酪', '芝士', '起司'], en: 'cheese' },
  { zh: ['切达奶酪'], en: 'cheddar cheese' },
  { zh: ['奶油芝士', '奶油奶酪'], en: 'cream cheese' },
  { zh: ['黄油'], en: 'butter' },
  // ── 豆制品 / 坚果 ──
  { zh: ['豆浆'], en: 'soy milk' },
  { zh: ['豆腐'], en: 'tofu' },
  { zh: ['花生', '花生酱'], en: 'peanut butter' },
  { zh: ['杏仁'], en: 'almond' },
  { zh: ['核桃'], en: 'walnut' },
  { zh: ['腰果'], en: 'cashew' },
  { zh: ['开心果'], en: 'pistachio' },
  // ── 饮品 ──
  { zh: ['咖啡', '黑咖啡', '手冲咖啡'], en: 'black coffee' },
  { zh: ['美式咖啡'], en: 'americano coffee' },
  { zh: ['拿铁', '咖啡拿铁'], en: 'latte coffee' },
  { zh: ['卡布奇诺'], en: 'cappuccino' },
  { zh: ['意式浓缩', '浓缩咖啡'], en: 'espresso' },
  { zh: ['绿茶', '抹茶'], en: 'green tea' },
  { zh: ['红茶'], en: 'black tea' },
  { zh: ['奶茶', '珍珠奶茶'], en: 'bubble tea' },
  { zh: ['橙汁', '果汁'], en: 'orange juice' },
  { zh: ['燕麦奶'], en: 'oat milk' },
  { zh: ['杏仁奶'], en: 'almond milk' },
  { zh: ['可乐'], en: 'coca cola' },
  { zh: ['啤酒'], en: 'beer' },
  { zh: ['红酒', '葡萄酒'], en: 'red wine' },
  // ── 零食 / 甜点 ──
  { zh: ['巧克力', '黑巧克力'], en: 'dark chocolate' },
  { zh: ['饼干', '曲奇'], en: 'cookie' },
  { zh: ['蛋糕'], en: 'cake' },
  { zh: ['冰淇淋', '冰激凌'], en: 'ice cream' },
  { zh: ['蜂蜜'], en: 'honey' },
  { zh: ['枫糖浆'], en: 'maple syrup' },
  { zh: ['能量棒', '蛋白棒'], en: 'protein bar' },
  { zh: ['蛋白粉', '乳清蛋白'], en: 'whey protein' },
  // ── 快餐 / 外卖 ──
  { zh: ['汉堡', '汉堡包'], en: 'hamburger' },
  { zh: ['披萨', '比萨'], en: 'pizza' },
  { zh: ['三明治'], en: 'sandwich' },
  { zh: ['寿司', '握寿司'], en: 'sushi' },
  // ── 油脂 / 调料 ──
  { zh: ['橄榄油'], en: 'olive oil' },
  { zh: ['食用油', '植物油', '菜籽油'], en: 'vegetable oil' },
  { zh: ['酱油'], en: 'soy sauce' },
  { zh: ['番茄酱', '番茄沙司'], en: 'ketchup' },
  { zh: ['蛋黄酱', '沙拉酱'], en: 'mayonnaise' },
];

/**
 * 把中文查询翻译成英文搜索词。
 * 找到第一个匹配的中文关键词即返回对应英文。
 * 如果没有匹配，返回 null（说明无法翻译，跳过 USDA 搜索）。
 */
export function translateToEnglish(query: string): string | null {
  const q = query.trim();
  for (const entry of ZH_EN_FOOD_TERMS) {
    if (entry.zh.some(zh => q.includes(zh))) {
      return entry.en;
    }
  }
  return null;
}
