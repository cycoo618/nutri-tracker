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

  // 搜索状态
  searchingMore:       { zh: '正在联网搜索更多…',        en: 'Searching more online…' },
  searchingOnline:     { zh: '本地未找到，正在联网搜索…', en: 'Searching online…' },
  onlineNoResults:     { zh: '联网搜索无结果',            en: 'No online results' },
  onlineSearchError:   { zh: '联网搜索失败，请稍后再试',  en: 'Search failed, please try again' },
  onlineSearchFailed:  { zh: '（联网搜索失败）',          en: '(Search failed)' },
  scanPackageLabel:    { zh: '拍照识别包装营养标签',      en: 'Scan Package Nutrition Label' },
  retryOnline:         { zh: '重新联网',                  en: 'Retry Online' },
  searchHint:          { zh: '输入食物名称开始搜索',      en: 'Search for food to get started' },
  aiEstimateShort:     { zh: 'AI 估算',                   en: 'AI Est.' },
  aiEstimateFailed:    { zh: 'AI 估算失败',               en: 'AI estimate failed' },

  // 标签
  tagFamily:           { zh: '家庭',     en: 'Family' },
  tagScan:             { zh: '📷 扫码', en: '📷 Scanned' },
  tagManual:           { zh: '手动',     en: 'Manual' },
  tagCustom:           { zh: '自制',     en: 'Custom' },
  tagRecipe:           { zh: '🧪 自制', en: '🧪 Custom' },

  // 添加食物模态框
  servingInferred:     { zh: '份量为系统推断，如不准确请切换「按克重」', en: 'Serving size is inferred. Switch to "By Grams" if inaccurate.' },
  gramsPlaceholder:    { zh: '输入克数',  en: 'Enter grams' },
  selectedPrefix:      { zh: '已选：',   en: 'Selected: ' },

  // 食材库
  emptyLabel:          { zh: '（空）',   en: '(empty)' },
  itemUnit:            { zh: '种',       en: 'items' },
  pantryEmpty:         { zh: '食材库是空的',              en: 'Pantry is empty' },
  pantryEmptyHint:     { zh: '扫描包装袋或组合食材，保存到这里', en: 'Scan packages or build recipes to save here' },
  savedBadge:          { zh: '✓ 已保存', en: '✓ Saved' },
  ingredientsList:     { zh: '配料',     en: 'Ingredients' },
  addToLog:            { zh: '＋ 添加到今日饮食', en: '＋ Add to Today' },
  familyReadOnly:      { zh: '（只读，可添加到今日）', en: '(Read-only, can add to today)' },
  proteinShort:        { zh: '蛋白',     en: 'Protein' },

  // 档案编辑
  myGoal:              { zh: '我的目标', en: 'My Goal' },
  bodyData:            { zh: '身体数据', en: 'Body Data' },
  savingEllipsis:      { zh: '保存中…',  en: 'Saving…' },
  optional:            { zh: '可选',     en: 'Optional' },

  // 家庭共享页
  familyPageTitle:       { zh: '家庭共享',    en: 'Family Sharing' },
  familyCreateTitle:     { zh: '创建家庭',    en: 'Create Family' },
  familyJoinTitle:       { zh: '加入家庭',    en: 'Join Family' },
  familySharingDesc:     { zh: '创建或加入家庭，与家人共享自定义食物库，方便彼此添加和记录饮食。', en: 'Create or join a family to share a custom food library with your family members.' },
  joinFamilyWithCode:    { zh: '加入家庭（输入邀请码）', en: 'Join Family (Invite Code)' },
  familyNameLabel:       { zh: '家庭名称',    en: 'Family Name' },
  familyNamePlaceholder: { zh: '例如：张家人、我的家庭', en: 'e.g. Smith Family' },
  inviteCodeLabel:       { zh: '邀请码',      en: 'Invite Code' },
  inviteCodePlaceholder: { zh: '输入6位邀请码，如 ABC123', en: 'Enter 6-digit code, e.g. ABC123' },
  familyCreatedMsg:      { zh: '家庭创建成功！分享邀请码给家人', en: 'Family created! Share the code with your family.' },
  copied:                { zh: '已复制 ✓',   en: 'Copied ✓' },
  tapToCopy:             { zh: '点击复制',    en: 'Tap to Copy' },
  copy:                  { zh: '复制',        en: 'Copy' },
  familyCreator:         { zh: '创建者',      en: 'Creator' },
  you:                   { zh: '你',          en: 'You' },
  leaveFamily:           { zh: '退出家庭',    en: 'Leave Family' },
  confirmLeaveTitle:     { zh: '确认退出家庭？', en: 'Leave family?' },
  leaveFamilyNote:       { zh: '退出后将无法看到家庭成员的食物。', en: 'You will no longer see family members\' foods.' },
  leaveFamilyLastMember: { zh: '你是最后一位成员，退出后家庭将被删除。', en: 'You are the last member; leaving will delete the family.' },
  confirmLeaveBtn:       { zh: '确认退出',    en: 'Confirm Leave' },
  createBtn:             { zh: '创建',        en: 'Create' },
  joinBtn:               { zh: '加入',        en: 'Join' },
  loadFamilyError:       { zh: '加载家庭信息失败，请稍后再试', en: 'Failed to load family info, please try again' },
  familyNameRequired:    { zh: '请输入家庭名称', en: 'Please enter a family name' },
  createFamilyError:     { zh: '创建失败，请稍后再试', en: 'Failed to create, please try again' },
  inviteCodeMinLength:   { zh: '请输入6位邀请码', en: 'Please enter a 6-digit invite code' },
  joinFamilyError:       { zh: '加入失败，请检查邀请码后重试', en: 'Failed to join, please check the invite code' },
  leaveFamilyError:      { zh: '退出失败，请稍后再试', en: 'Failed to leave, please try again' },

  // 扫描营养标签
  scanNutritionLabel:    { zh: '扫描营养标签',  en: 'Scan Nutrition Label' },
  setupGroqKey:          { zh: '填入 Groq API Key', en: 'Enter Groq API Key' },
  saveAndContinue:       { zh: '保存并继续',    en: 'Save & Continue' },
  keyLocalOnly:          { zh: 'Key 仅存储在你的设备上，不经过任何服务器', en: 'Key is stored only on this device' },
  scanInstruction:       { zh: '拍摄或上传食品包装上的营养成分表，AI 会自动识别数据', en: 'Take or upload a photo of the nutrition label; AI will extract the data.' },
  takePhotoBtn:          { zh: '拍摄营养成分表', en: 'Take Photo' },
  tapToOpenCamera:       { zh: '点击开启相机',  en: 'Tap to open camera' },
  selectFromAlbum:       { zh: '从相册选择图片', en: 'Select from Album' },
  changeGroqKey:         { zh: '更换 Groq API Key', en: 'Change Groq API Key' },
  aiRecognizing:         { zh: 'AI 正在识别营养数据…', en: 'AI is reading nutrition data…' },
  aiTimeNote:            { zh: '通常需要 5-10 秒', en: 'Usually takes 5–10 seconds' },
  per100gNutrition:      { zh: '每 100g 营养数据', en: 'Per 100g Nutrition' },
  servingSizeOptional:   { zh: '参考份量（可选）', en: 'Serving Size (optional)' },
  servingNamePlaceholder:{ zh: '份量名称，如「1袋」', en: 'Serving name, e.g. "1 bag"' },
  gramsPlaceholderShort: { zh: '克数', en: 'Grams' },
  saveToLibrary:         { zh: '保存到食物库',  en: 'Save to Library' },
  retakePhoto:           { zh: '重新拍摄',      en: 'Retake' },
  recognitionFailed:     { zh: '识别失败',      en: 'Recognition Failed' },
  saveFailed:            { zh: '保存失败，请重试', en: 'Save failed, please retry' },
  recognitionFailedNote: { zh: '识别失败，请重试', en: 'Recognition failed, please retry' },
  notDetected:           { zh: '未检测到',      en: 'Not detected' },
  foodNameLabel:         { zh: '食物名称',      en: 'Food Name' },
  foodNameRequired:      { zh: '请输入食物名称', en: 'Please enter a food name' },
  foodNamePlaceholder:   { zh: '输入食物名称',  en: 'Enter food name' },

  // 手动录入
  manualEntryTitle:      { zh: '手动录入食物',  en: 'Manual Food Entry' },
  per100gNote:           { zh: '以下营养数据均为每 100g 的含量，可在包装背面食品标签找到', en: 'All values below are per 100g, as shown on the food nutrition label.' },
  foodNameRequiredLabel: { zh: '食物名称 *',    en: 'Food Name *' },
  categoryLabel:         { zh: '分类',          en: 'Category' },
  caloriesRequired:      { zh: '热量 *',        en: 'Calories *' },
  carbsFull:             { zh: '碳水化合物',    en: 'Carbs' },
  giOptional:            { zh: 'GI值（可选）',  en: 'GI (Optional)' },
  servingOptionalLabel:  { zh: '常用份量',      en: 'Serving Size' },
  servingOptionalNote:   { zh: '可选，方便下次快速选择', en: 'Optional, for quick selection next time' },
  nextConfirmAmount:     { zh: '下一步：确认用量', en: 'Next: Confirm Amount' },

  // 自制食物构建器
  editRecipeTitle:       { zh: '编辑自制食物',  en: 'Edit Custom Food' },
  createRecipeTitle:     { zh: '创建自定义食物', en: 'Create Custom Food' },
  servingLabelField:     { zh: '份量标签',      en: 'Serving Label' },
  servingLabelOptional:  { zh: '可选，默认"1份"', en: 'Optional, defaults to "1 serving"' },
  ingredientsRatioLabel: { zh: '食材配比 *',    en: 'Ingredients *' },
  addIngredientPlaceholder: { zh: '搜索并添加食材，如「黑米」「红枣」…', en: 'Search ingredients, e.g. "brown rice"…' },
  recipePreviewTitle:    { zh: '合并营养预览',  en: 'Nutrition Preview' },
  basedOnTotal:          { zh: '基于配比总量', en: 'Based on total' },
  totalCaloriesNote:     { zh: '这一份总热量', en: 'Total calories for this portion' },
  per100gCalories:       { zh: '每100g热量',   en: 'Per 100g calories' },
  ingredientsDetail:     { zh: '食材明细',      en: 'Ingredient Breakdown' },
  alreadyAdded:          { zh: '已添加',        en: 'Added' },
  noIngredientError:     { zh: '请至少添加一种食材', en: 'Please add at least one ingredient' },

  // 登录页
  loginTagline:  { zh: '智能饮食记录 · 科学营养管理', en: 'Smart Diet Tracking · Scientific Nutrition' },
  googleLogin:   { zh: '使用 Google 账号登录', en: 'Sign in with Google' },
  appleLogin:    { zh: '使用 Apple 账号登录',  en: 'Sign in with Apple' },
  loginTerms:    { zh: '登录即表示同意我们的服务条款和隐私政策', en: 'By signing in, you agree to our Terms of Service and Privacy Policy' },

  // 目标描述
  goal_fat_loss_desc:       { zh: '温和热量缺口，避免暴饮暴食，可持续减脂',        en: 'Moderate calorie deficit for sustainable fat loss' },
  goal_muscle_gain_desc:    { zh: '适当增加蛋白质和优质碳水，支撑肌肉生长',        en: 'Increase protein and quality carbs to support muscle growth' },
  goal_healthy_eating_desc: { zh: '均衡饮食，关注抗炎、控糖等高级营养指标',        en: 'Balanced diet focusing on anti-inflammatory and blood sugar control' },
  goal_blood_sugar_desc:    { zh: '关注 GI 值，优先低GI食物，控制血糖波动',       en: 'Focus on GI values, prioritize low-GI foods to control blood sugar' },
};

export function t(key: string, locale?: Locale): string {
  const l = locale ?? getLocale();
  return translations[key]?.[l] ?? translations[key]?.['zh'] ?? key;
}
