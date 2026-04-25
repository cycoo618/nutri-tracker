// ============================================
// 简单双语系统：中文（默认）↔ 英文
// 只存储需要切换的 UI 字符串；食物名称等
// 由大模型/数据库决定，不在此处硬编码
// ============================================

export type Locale = 'zh' | 'en';

const STORAGE_KEY = 'nutri_locale';

export function getLocale(): Locale {
  return (localStorage.getItem(STORAGE_KEY) as Locale) ?? 'zh';
}

export function setLocale(locale: Locale) {
  localStorage.setItem(STORAGE_KEY, locale);
  // 通知所有监听者
  window.dispatchEvent(new CustomEvent('locale-change', { detail: locale }));
}

// ── 翻译表 ────────────────────────────────────────────────────────────
const translations: Record<string, Record<Locale, string>> = {
  // 餐次
  breakfast:   { zh: '早餐', en: 'Breakfast' },
  lunch:       { zh: '午餐', en: 'Lunch' },
  dinner:      { zh: '晚餐', en: 'Dinner' },
  snack:       { zh: '零食', en: 'Snack' },

  // 导航 / 按钮
  add:         { zh: '添加', en: 'Add' },
  save:        { zh: '保存', en: 'Save' },
  cancel:      { zh: '取消', en: 'Cancel' },
  delete:      { zh: '删除', en: 'Delete' },
  confirm:     { zh: '确认', en: 'Confirm' },
  back:        { zh: '↵ 返回', en: '↵ Back' },
  close:       { zh: '关闭', en: 'Close' },
  edit:        { zh: '编辑', en: 'Edit' },
  search:      { zh: '搜索', en: 'Search' },
  loading:     { zh: '加载中…', en: 'Loading…' },
  synced:      { zh: '☁️ 已同步', en: '☁️ Synced' },
  syncing:     { zh: '同步中', en: 'Syncing' },
  retry:       { zh: '⚠️ 重试', en: '⚠️ Retry' },

  // 主页
  today:            { zh: '今日', en: 'Today' },
  prevDay:          { zh: '前一天', en: 'Prev' },
  nextDay:          { zh: '后一天', en: 'Next' },
  remaining:        { zh: '剩余', en: 'Remaining' },
  consumed:         { zh: '已摄入', en: 'Consumed' },
  target:           { zh: '目标', en: 'Target' },
  overTarget:       { zh: '⚠️ 已超出目标', en: '⚠️ Over target' },
  advancedNutrition:{ zh: '进阶营养指标', en: 'Advanced Nutrition' },
  addedSugar:       { zh: '添加糖', en: 'Added Sugar' },
  todaysFoodLog:    { zh: '今日饮食', en: "Today's Food" },
  logFood:          { zh: '+ 记录今天吃了什么', en: '+ Log what you ate today' },
  editAmount:       { zh: '✏️ 修改用量', en: '✏️ Edit Amount' },
  confirmDelete:    { zh: '确认删除', en: 'Delete' },
  deleteQuestion:   { zh: '删除', en: 'Delete' },
  reSync:           { zh: '⚠️ 重新同步', en: '⚠️ Re-sync' },
  syncNow:          { zh: '🔄 同步', en: '🔄 Sync' },
  clickToSync:      { zh: '点击重新同步', en: 'Click to sync' },
  syncFailed:       { zh: '云端同步失败：', en: 'Sync failed:' },
  syncLocalOnly:    { zh: '数据已保存在本设备，跨设备暂不可见。', en: 'Data saved locally, not visible on other devices.' },
  calories:         { zh: '热量', en: 'Calories' },
  protein:          { zh: '蛋白质', en: 'Protein' },
  carbs:            { zh: '碳水', en: 'Carbs' },
  fat:              { zh: '脂肪', en: 'Fat' },
  fiber:            { zh: '膳食纤维', en: 'Fiber' },
  sodium:           { zh: '钠', en: 'Sodium' },
  sugar:            { zh: '糖', en: 'Sugar' },
  saturatedFat:     { zh: '饱和脂肪', en: 'Saturated Fat' },
  calcium:          { zh: '钙', en: 'Calcium' },
  iron:             { zh: '铁', en: 'Iron' },
  potassium:        { zh: '钾', en: 'Potassium' },
  vitaminC:         { zh: '维生素C', en: 'Vitamin C' },
  omega3:           { zh: 'Omega-3', en: 'Omega-3' },

  // 食物搜索
  searchPlaceholder: { zh: '输入食物名称…', en: 'Search food…' },
  noResults:         { zh: '没有找到', en: 'Not found' },
  recentFoods:       { zh: '常用食物', en: 'Recent Foods' },
  aiEstimate:        { zh: '🤖 AI 估算营养数据', en: '🤖 AI Estimate Nutrition' },
  aiEstimating:      { zh: 'AI 估算中…', en: 'AI estimating…' },
  scanLabel:         { zh: '📷 拍照识别', en: '📷 Scan Label' },
  customFood:        { zh: '🧪 自定义食物', en: '🧪 Custom Food' },
  manualEntry:       { zh: '手动录入', en: 'Manual Entry' },
  onlineSearch:      { zh: '🌐 联网搜索更多结果', en: '🌐 Search Online' },
  familyFoods:       { zh: '家庭食物', en: 'Family Foods' },

  // 食材库
  pantryTitle:    { zh: '我的食材库', en: 'My Pantry' },
  scanPackage:    { zh: '📷 扫描包装袋', en: '📷 Scan Package' },
  buildRecipe:    { zh: '🧪 组合食材', en: '🧪 Build Recipe' },
  myPantry:       { zh: '你的食材库', en: 'My Pantry' },
  familyPantry:   { zh: '家庭食材库', en: 'Family Pantry' },
  perHundredG:    { zh: '以下数据均为每100g', en: 'Per 100g' },

  // 录入模态框
  byServing:    { zh: '按份量', en: 'By Serving' },
  byGrams:      { zh: '按克重', en: 'By Grams' },
  servings:     { zh: '份数', en: 'Servings' },
  grams:        { zh: '克重', en: 'Grams (g)' },
  nutritionData:{ zh: '营养数据', en: 'Nutrition' },
  ingredients:  { zh: '食材组成', en: 'Ingredients' },
  addButton:    { zh: '添加', en: 'Add' },

  // 汉堡菜单
  myData:        { zh: '我的数据', en: 'My Stats' },
  familyShare:   { zh: '家庭共享', en: 'Family' },
  logout:        { zh: '登出', en: 'Logout' },
  fontSize:      { zh: '字体大小', en: 'Font Size' },
  fontSmall:     { zh: '小', en: 'S' },
  fontStandard:  { zh: '标准', en: 'M' },
  fontLarge:     { zh: '大', en: 'L' },
  language:      { zh: '语言', en: 'Language' },

  // 我的数据
  goalLabel:        { zh: '健康目标', en: 'Goal' },
  calorieTarget:    { zh: '每日热量目标', en: 'Daily Calorie Target' },
  bodyWeight:       { zh: '体重 (kg)', en: 'Weight (kg)' },
  bodyFat:          { zh: '体脂率 (%)', en: 'Body Fat (%)' },
  saveProfile:      { zh: '保存', en: 'Save' },

  // 目标类型
  goal_fat_loss:      { zh: '减脂', en: 'Fat Loss' },
  goal_muscle_gain:   { zh: '增肌', en: 'Muscle Gain' },
  goal_healthy_eating:{ zh: '健康饮食', en: 'Healthy Eating' },
  goal_blood_sugar:   { zh: '控血糖', en: 'Blood Sugar' },

  // GI
  giLow:    { zh: '低GI', en: 'Low GI' },
  giMed:    { zh: '中GI', en: 'Mid GI' },
  giHigh:   { zh: '高GI', en: 'High GI' },

  // 通用
  aiDataNote:   { zh: '⚠ AI 估算数据，仅供参考', en: '⚠ AI estimated, for reference only' },
  userDataNote: { zh: '📝 用户录入数据', en: '📝 User-entered data' },
};

export function t(key: string, locale?: Locale): string {
  const l = locale ?? getLocale();
  return translations[key]?.[l] ?? translations[key]?.['zh'] ?? key;
}
