# Handoff: NutriTrack Redesign

> 一个面向中文用户的营养追踪 app · 主打"抗炎 + 减脂"等多目标
> 重设计聚焦: **信息分层** · **温暖手账质感** · **个性化主目标驱动**

---

## Overview

NutriTrack 是个营养追踪 app,用户记录每日饮食、卡路里、宏量营养素,并追踪"食物多样性"(7 类食物每周覆盖度)。

原版痛点:
1. 一屏信息密度过高,不知道先看哪里
2. 色彩单调(只有绿色)
3. 缺少情感化反馈和成就感
4. "食物多样性"这个差异化卖点埋在第二屏,曝光不足

这次重设计包含:
- **3 种主屏布局方向**,根据用户主目标动态选择
- **一致的视觉系统**: 温暖手账风(serif + 手写体)、4 套清爽明亮配色可切换
- **统一的导航和次屏**: 趋势分析、食物多样性详情、食材库、个人页、科学室

---

## About the Design Files

`prototype/` 里的所有文件是 **HTML/React 原型** — 表达视觉、交互意图的设计稿,不是可直接部署的生产代码。

任务是 **把这些设计在目标 app 的原有技术栈里复现** (React Native / SwiftUI / Flutter / 原生 iOS+Android — 都行),沿用项目里现成的组件库、命名约定、导航框架。如果项目还没有技术栈,推荐 **React Native** 或 **Flutter**(原 app 看起来是 web app,可能想转 mobile native)。

原型的实现细节是 React + Babel-standalone,这是设计稿快速预览的工具,不要照搬这个技术栈。

---

## Fidelity

**高保真 (hi-fi)**。颜色、字号、间距都有明确的 spec(见下方 Design Tokens)。请按值实现。

只有一处例外: 字体大小可以根据目标平台的可读性微调(比如原型里 `var(--ink-mute)` 文字用 9–11px,移动端可上调到 11–13px)。

---

## Critical Logic: Goal → Home View Mapping

这是 redesign 最重要的逻辑改动。用户在 **我的目标** 里能选 1–2 个目标,**主目标决定首页布局**,次目标只影响推荐文案优先级。

| 主目标 | 首页布局 | 文件 | 理由 |
|---|---|---|---|
| 减脂 (fat) | 营养日记本 (DiaryHome) | `variations/diary.jsx` | 单一焦点 "还能吃多少 kcal" 防暴饮暴食 |
| 抗炎 (antiInflam) | 七色花园 (GardenHome) | `variations/garden.jsx` | 把食物多样性放主视觉,卡路里退居二线 |
| 增肌 (muscle) | 蛋白仪表盘 (尚未设计) | TBD | 蛋白质摄入 + 训练日历同屏 |
| 控血糖 (glucose) | 时间节奏图 (尚未设计) | TBD | 按 GI 值和进食时段排版 |
| (无目标 / fallback) | DiaryHome | `variations/diary.jsx` | 默认 |

Pseudo-code:
```js
const Home = {
  fat:        DiaryHome,
  antiInflam: GardenHome,
  muscle:     ProteinHome,  // todo
  glucose:    RhythmHome,   // todo
}[user.goals[0]] ?? DiaryHome;
```

**次目标的作用**: 在推荐 banner、食物清单、suggestion 文案里把次目标相关的项目排前面。不切换布局。

**第 3 种布局 ChaptersHome** (`variations/chapters.jsx`) 是早期探索方案,**最终不采用** — 但代码留在原型里以便对比,可不实现。

---

## 主要屏幕清单

| 屏幕 | 文件 | 描述 |
|---|---|---|
| 总览 (Home) | `variations/diary.jsx` / `variations/garden.jsx` | 根据主目标渲染对应 home |
| 趋势 (Trends) | `screens/sevenday.jsx` | 7天/30天/年 切换;周节奏分、能量曲线、食物 × 天热力图、3 个趋势 sparkline、weekly note |
| 食材库 (Pantry) | `screens/pantry.jsx` | 扫描包装/组合食材 → 食材卡列表 |
| 食物多样性详情 | `screens/diversity.jsx` | 7 类食物每张独立卡 + 7天历史小条带 + 推荐食物 (从首页 inline panel "查看全部 7 类 ›" 进入) |
| 科学室 (Science) | `screens/science.jsx` | 推荐阅读、营养知识 facts、问答入口 |
| 我的 (Profile) | `screens/profile.jsx` | 头像、目标优先级选择、身体数据、热量目标、偏好设置 |

底部 tab 顺序: **总览 · 趋势 · ＋(中央) · 科学 · 我**。中央 ＋ 是悬浮主 CTA,打开 `AddSheet` (添加食物 bottom sheet)。

---

## 屏幕详解 — 总览 (DiaryHome) — 用户最看重的一个

布局从上到下:

### 1. 状态栏 (54px tall)
- 时间左 · 信号/Wi-Fi/电量右
- 平台原生即可,不必复刻原型里的 SVG icons

### 2. 顶部行 (padding: 22px 横向)
- **左**: caveat 手写体 "午安, 晚晚" (用户名)
- **右**: 横排 chips
  - 🫒 抗炎 (绿色 tinted chip)
  - 🔥 减脂 (橙红 tinted chip)
  - 📦 食材库按钮 (28×26 圆角矩形 → 导航到 pantry)

### 3. 大日期 hero (居中)
- `< 5月16日 >` (ZCOOL QingKe HuangYou 30px) + 下方 `周六 · 第 156 天` (13px ink-soft)
- 两侧 `<` `>` 圆按钮 30×30,改变 dayOffset
- **核心新增**: 不是今天时,日期下方显示 **`↩ 回到今天`** 黑底白字 pill button (主 CTA);是今天时,显示 `● 今日` 绿色小 chip 作为状态提示
- 这是因为用户反馈"妈妈容易看错日期",所以日期要醒目,跨日浏览时要有快速返回

### 4. 卡路里 hero 卡 (含轮播 banner)
单一 white 卡片,内容分两段:

**上段** — 卡路里:
- 标签 `还能吃` (用 `.mark` 高亮笔触)
- 大数字 `1043` (72px ZCOOL display)
- 单位 `千卡` (18px ink-soft)
- 下方一行 `已记录 457 / 1500 kcal · 30%` (11px ink-mute)
- 占满宽度的进度条 (height 5px, tomato 色)

**下段** — 轮播建议 banner (虚线分隔):
- 一次只显示一个 banner
- 内容: emoji icon 24px + 彩色 tag label (10px uppercase) + 一行文案 (12.5px ink-soft 1.6 line-height)
- **自动滚动**: 每 4.5 秒切换;鼠标悬停或最近 8s 内手动操作过则暂停
- **手动滑动**: 横向 swipe (native scroll-snap)
- **点击 dots 跳转**: 底部 6 个圆点,当前 dot 拉长 (14×5px) 且变为 tag 颜色

Banner 数据 (6 条):
| Tag | Color token | Body |
|---|---|---|
| 节奏 | tomato | 按目前节奏,可以放一餐 500 kcal 的晚饭,再留 500 kcal 给加餐 |
| 多样性 | sage | 差 5 类食物。今晚加 1 份酸奶 + 1 份叶菜,3 类一下就到位了 |
| 发酵食品 | ferm | 近 7 天未吃过,希腊酸奶、泡菜、味噌汤、纳豆均可 |
| 蔬菜 | veg | 已 2 天未吃,午餐或晚餐加一份叶菜,建议每天 300–500g |
| Omega-3 | fish | 今天还是 0 mg,加一小把核桃或一片三文鱼 |
| 连续记录 | mustard | 23 天 · 坚持就是 80% 的胜利 — 这个月还有 8 天 |

### 5. Mini-stats 行 (2 列)
两张点击展开的小卡:

**宏量平衡** (左):
- 折叠状态: 标签 `宏量平衡` + 大数字 `73 分` + **4 条迷你色条** (蛋白/碳水/脂肪/纤维 各自填充比例) + 副文案 `碳水偏多 · 蛋白偏少`
- 展开后: 2×2 grid of macro cards (emoji + 名称 + 充足/偏多/偏少 chip + 大数字 + % + 进度条 + "剩 X g · 作用") + 微量营养 3 卡 (添加糖/钠/Omega-3,带 ✓ 或 !) + 73 分汇总卡

**食物多样性** (右):
- 折叠状态: 标签 + 大数字 `2 / 7` + **7 个迷你 emoji 方块** (已完成填彩色,未完成灰底)+ 副文案 `加 1 类更稳`
- 展开后: 2/7 圆形徽章 + 一句话总结 + 2 列 7 个食物卡 (emoji + 名 + 量 + 进度条 + 未吃天数) + 底部 `查看全部 7 类 ›` 链接 → 跳到 `DiversityScreen`

### 6. 今日笔记 (餐次时间轴)
- 标题: `今日笔记` serif 17px + caveat `today's pages`
- 左侧虚线 rail
- 每餐一行: 圆形首字 chip + 餐名 + 时间 + kcal + 食物列表 + 可选的手写 note (caveat font, tomato 色)
- 未记录的餐显示虚线边框 `＋ 记一笔` 按钮

### 7. 底部 dock
浮动圆角矩形,5 个 tab + 中央悬浮 ＋ 按钮 (tomato 色 52×52 圆,有阴影,向上突出 22px)。

---

## 屏幕详解 — 趋势 (SevenDayScreen)

期间切换器 chip: `7天 / 30天 / 年`

模块顺序:
1. **Header**: WEEK · 20 (uppercase 11px), `这一周` (ZCOOL 26px), 日期范围 + caveat day count
2. **本周节奏分 hero**: 大数字 (78/100) + 上周对比 chip + 一句话总结 + **7 个日点** (颜色按当日热量节奏: tomato 超标 / sage 正常 / mustard 偏低 / 灰 未记录, today 外加 1px 黑圈)
3. **3 张子分卡**: 能量 / 营养 / 多样 各自 big number + 单位 + % + bar + hint
4. **能量曲线**: SVG 折线图,带半透明面积填充,横向 day 标签 + 数字。目标线 (tomato 虚线) + 均值线 (sage 虚线)。today 圆点黑色填充加大。
5. **七色 × 七日 热力图**: rows = 7 食物组, cols = 7 天。cell 颜色按当天摄入强度 0–3 级 (color-mix var(--food-color) intensity% transparent)。today 列加 1px 黑框。底部图例
6. **3 趋势 sparkline 卡**: 体重 / 腰围 / 抗炎 — 每张含 name + value + unit + 25px SVG sparkline + delta
7. **Weekly note 卡** (warm 背景): 一段长文案 + 2 button (加入下周计划 / 导出周记 PDF)

---

## 屏幕详解 — 食材库 (PantryScreen)

1. 顶部 `< 食材库` (有返回按钮)
2. 两张大动作卡 (并排): 📷 扫包装袋 / ⚗ 组合食材
3. 搜索框 (灰 paper bg + 搜索图标 + placeholder + 件数)
4. Tabs: 全部 / 扫码 / 组合 + 排序按钮
5. 食材列表 (每张卡):
   - "票根"标签 (38×50 立式) 显示 📷 或 ⚗ + "扫码"/"组合"
   - 名称 + 子标签 (e.g., "mini 杯 · 57g") + 扫码日期
   - 紧凑 macro 行: kcal / P / C / F (用 ZCOOL display 数字,小尺寸)
   - `＋ 加到今日` 主按钮 + `更多` 次按钮 + ✎ / ⌫ 图标按钮
   - 展开"更多"后: 常用份量 chips (10g/15g/30g/1勺) + 抗炎评分条

---

## 屏幕详解 — 食物多样性详情 (DiversityScreen)

1. 顶部 `< 食物多样性` + 日期副标题
2. Hero 卡: Ring 92×92 显示 `2/7` + 总结句子 (今晚加什么涨到几类)
3. **7 类食物卡** (每张):
   - 左侧 44×44 圆角色块装 emoji
   - 名称 + 当前量/目标量 (右上,达成时绿色) + 建议范围 + "N天未吃"/"今日达成"
   - 进度条
   - 近 7 天历史小条带 (7 个小色块 + 日期字 + N/7 计数)
   - 主按钮 (`＋ 今天记一笔` 或 `＋ 再加一份`) + 次按钮 (`ⓘ 推荐食物`)
   - 达成的卡片右上角有 g.color 对角折角 + 白色 ✓
4. 底部"抗炎清单"warm 卡 (彩色食材文本列表)

---

## 屏幕详解 — 我的 (ProfileScreen)

1. 头像 56 圆形 + 名字 (ZCOOL 20px) + caveat "since Jan 2024 · 156 days strong" + `编辑` 次按钮
2. 3 张统计卡: 连续天数 / 减重 kg / 抗炎评分
3. **我的目标** — 关键:
   - 顶部标题 + hint "按优先级选 1–2 个"
   - 图例: ①主目标 决定首页和提议 / ②次目标 微调建议
   - 4 个目标卡 (减脂/增肌/抗炎/控血糖) 横放,每张含 emoji + 名称 + 一句描述 + 右侧圆形 indicator (selected 时显示 1 或 2)
   - **状态管理**: ordered array `goals = [primaryKey, secondaryKey]` (max length 2)
   - **交互**: 点击未选 → 加为次目标 (或顶替次目标);点击次目标 → 升级为主目标 (旧主目标降为次);点击主目标 → 移除
   - 选中状态的边框颜色和阴影: primary 用 g.color full;secondary 用 color-mix g.color 60% line
   - 下方 **"首页适配预览"** warm 卡: 显示主目标对应的首页布局名 + 一句话原因
4. **身体数据**: 体重 / 体脂率 2 列输入卡 (display 大数字 + 单位 + 7天 delta);下方每日热量目标全宽输入卡
5. **偏好**: 字体大小 segmented (小/标准/大) + 语言 segmented (中文/EN) + 深色模式 toggle
6. **更多**: 4 行链接 (饮食分析/家庭共享/导出/帮助)
7. 保存按钮 (黑底) + 登出 link

---

## 屏幕详解 — 科学 (ScienceScreen)

1. 标题 `科学室` + caveat tagline
2. **今日推荐** 大卡: 130px placeholder cover image + 标签 chip + ZCOOL 标题 + 简介 + `读 4 分钟 →` 按钮
3. **Fact band** warm 卡: 3 列 (7+/300g/≥30) 大数字 + 标签 + 副标签
4. **书架** 列表: 每行有"书脊" 44×56 + 标签 chip + 标题 + 副信息
5. **问答入口** warm 卡: 大 emoji + 标题 + 例子问题 + `问` 主按钮

---

## Design Tokens

### Colors — 4 palettes (用户可在 Settings 切换;CSS variables-based theming)

CSS class on `<body>`: `theme-morning-green` (默认) / `theme-coconut` / `theme-lemon` / `theme-peach`。

#### 1. 晨绿 (默认 · `theme-morning-green`) — fresh & healthy
```
paper        #F6F9F2    paper-2  #ECF2DE   card      #FFFFFF   card-warm #F9FBF4
line         #DAE5C9    line-soft #EAF0DE
ink          #1F2920    ink-soft #3F543F   ink-mute  #8B9886   ink-faint #C2CCBC
tomato       #FF6B57    persimmon #FF8F66
mustard      #F4B536    sage     #4FA663   moss      #2D6E40
plum         #D45D7F    sky      #3FA8DD
veg #4FA663  fruit #FF6B57  grain #F4B536  bean #D45D7F  nut #B87440  fish #3FA8DD  ferm #9374C2
```

#### 2. 椰岛 (`theme-coconut`) — cool teal + coral
```
paper #F4FAFB  card #FFFFFF
ink #142631
tomato #FF7458  sage #00B59C (teal)  sky #4AAEDB ...
```

#### 3. 柠檬田 (`theme-lemon`) — sunny + meadow
```
paper #FCFAEC  card #FFFFFF
ink #2A2A1C
mustard #F0B500 (saturated sun) sage #6FAE45 tomato #F76145 ...
```

#### 4. 桃子 (`theme-peach`) — warm peach + sage
```
paper #FDF7F2  card #FFFFFF
ink #2A1F19
tomato #F26756 (warm coral)  sage #5FA666  mustard #ECA938 ...
```

完整 CSS 见 `prototype/styles.css`。

### Typography

| Token | 字体 | 用途 |
|---|---|---|
| `.serif`  | Noto Serif SC, Georgia, serif | 正文、卡片标题 |
| `.hand`   | Ma Shan Zheng, cursive        | 中文手写体 (问候等装饰) |
| `.caveat` | Caveat, cursive               | 英文/英数手写注释 |
| `.display`| ZCOOL QingKe HuangYou, serif  | 大数字 hero/标题 |

字号 (基准 16px):
- Display 大数字: 64–76px
- 二级 display: 22–30px
- Body large: 14–17px
- Body: 12–13px
- Caption: 10–11px
- Micro / chip: 9–10px

字重: 400 (regular) / 500 (medium) / 700 (bold)。中文字符建议 +1 字重以保持视觉重量。

### Spacing

- 卡片内 padding: 12–22px (信息密度越高用越大)
- 卡片之间垂直间距: 8–14px
- 屏幕横向 padding: 18px (卡片层) / 22px (标题层)
- 卡片间隔: 8–10px (gap)

### Radius

- `--r-card`: 18px (主要卡片)
- 小卡 / 内嵌元素: 10–14px
- `--r-pill`: 999px (chip / button)
- 圆形按钮: 50%

### Shadows

- 卡片柔和: `0 1px 0 rgba(255,255,255,0.6) inset, 0 1px 2px rgba(76,55,30,0.05), 0 6px 14px rgba(76,55,30,0.06)`
- Primary button: `0 4px 14px rgba(0,0,0,0.18)`
- 主 CTA 圆 (＋): `0 6px 16px rgba(tomato,0.4), inset 0 1px 0 rgba(255,255,255,0.3)`
- Banner 卡内: `0 2px 8px color-mix(in oklab, var(--ink) 4%, transparent)`

### Background paper (app bg)

Radial gradient:
```css
radial-gradient(120% 80% at 50% -10%,
  color-mix(in oklab, var(--paper) 70%, white 30%) 0%,
  var(--paper) 55%,
  var(--paper-2) 100%)
```

加上 1px paper grain dots (rgba 0.06 alpha) 制造纸质感。

---

## Interactions & Behavior

### Date navigation (DiaryHome)
- 状态: `dayOffset` (number, -2 to 2),0 = today
- `<` 按钮: `dayOffset--`,`>` 按钮: `dayOffset++`,各自 clamp 在 -2..2
- 当 `dayOffset !== 0`,显示 `↩ 回到今天` 主按钮 (淡入)
- 当 `dayOffset === 0`,显示 `● 今日` 绿色 chip
- 切换日期时,所有日期相关数据应该 fetch 对应那天的数据 (mock 即可)

### Rotating banner (DiaryHome)
- 6 张 banner,horizontal scroll-snap container
- `setInterval` 每 4.5s 触发 `scrollTo({ left: clientWidth * nextIdx, behavior: 'smooth' })`
- **暂停条件**: `lastInteract.current` 最近 8000ms 内 OR `hovering.current === true`
- `onScroll` 监听 scrollLeft,Math.round(scrollLeft/clientWidth) = active idx
- Dots indicator: 6 个 button,当前 idx 拉长到 14×5 px + 颜色变 tag color
- 点击 dot 调用 `goTo(i)` = `scrollTo` + 重置 lastInteract

### Mini-stat expand
- 状态: `expanded = 'macro' | 'diversity' | null`
- 点击同一卡: toggle null
- 点击另一卡: switch to that key
- 展开 panel 有 `sheet-in` 动画 (translateY + opacity transition, 0.24s)
- 折叠时仍显示 preview (4 macro bars / 7 emoji squares)

### Goal priority picker (ProfileScreen)
```js
const toggleGoal = (k) => {
  const idx = goals.indexOf(k);
  if (idx === 0) setGoals(goals.slice(1));        // 移除 primary
  else if (idx === 1) setGoals([k, goals[0]]);    // 升级 secondary → primary
  else {
    if (goals.length === 0) setGoals([k]);
    else if (goals.length === 1) setGoals([...goals, k]);
    else setGoals([goals[0], k]);                  // 替换 secondary
  }
};
```
当 `goals[0]` 改变,**通知 navigation 切换首页布局组件** (按 Goal→Home Mapping 表)。

### Add food (AddSheet)
- 中央 ＋ 按钮触发 `sheetOpen = true`
- 半透明 backdrop + 底部弹出 sheet (sheet-in animation)
- Sheet 内容: drag handle / 标题 / 餐次 segmented (早/午/晚/加餐) / 搜索框 / 常吃 list
- 点击 backdrop 关闭

### Pantry / Diversity navigation
- 顶部 ‹ 返回按钮跳回上一屏 (or 总览 fallback)

### Tabs
- 底部 dock 5 个 tab: 总览 · 趋势 · ＋ · 科学 · 我
- 活动 tab 用 ink 色 + bold + 下方红点
- 路由名建议: `home / trends / add / science / profile`
- 食材库 / 多样性详情 / 添加 sheet 不是顶层 tab,从其他屏导航进入

### Status icons (top right of home only)
- 🫒 / 🔥 chips 显示当前 goals (从 goals state 派生)
- 📦 按钮 → 食材库

---

## State Management

### Global / Server state
- `user.profile` — 头像、名字、注册日期
- `user.goals` — ordered array (max 2): `['fat', 'antiInflam']`
- `user.body` — { weight, bodyFat, kcalTarget }
- `user.preferences` — { fontSize, lang, dark }
- `entries[date]` — 当天饮食记录 (meals[], totals: kcal/macros/diversity)
- `pantry[]` — 用户食材库
- `streak` — 连续记录天数

### Local UI state
- `dayOffset` (DiaryHome) — 当前查看日期 offset
- `expanded` (DiaryHome) — 哪个 mini-stat 展开
- `bannerIdx` (RotatingBanner) — 当前 banner
- `palette` — 当前色板 class
- `sheetOpen` — 添加食物 sheet
- `activeTab` (top-level nav)

### Fetch patterns
- 切换 date → fetch that day's entry
- 进入趋势 → fetch last N days summary
- 进入食材库 → fetch pantry items

---

## Assets / Fonts

### Fonts (Google Fonts)
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;700;900&family=Ma+Shan+Zheng&family=Caveat:wght@500;700&family=ZCOOL+QingKe+HuangYou&display=swap">
```
中文衬线 + 中文手写 + 英文手写 + 装饰大数字字体。

### Icons
- 状态栏图标用平台原生
- App 内大量使用 **emoji** 作为食物分类标识 (🥬🍎🌾🫘🥜🐟🫙) — 跨平台一致,无需 icon font
- 少量装饰用 unicode (◐ ☰ ✦ ◯ ❦ ‹ › ↩ ✓)
- Banner / mini-stat 用 emoji 24px (⏱ 🌿 🫙 🥬 🐟 ✨)
- 替换为目标平台的 emoji 渲染即可

### Imagery
- 食物图片 / 头像 — 设计稿用 placeholder,实际接入用户上传或品牌图库
- 科学室 cover 图 — 130px tall 占位,实际接入文章封面

---

## File Map (prototype/)

```
prototype/
├── index.html                  # 设计画布入口 (3 个 home variants + 设计说明)
├── styles.css                  # 4 套色板 + 排版 + 卡片样式
├── shared.jsx                  # 数据 mock + 公共组件 (Ring, Bar, Dock, AddSheet, NavRouter)
├── ios-frame.jsx               # 设计画布用的 iPhone 边框 — 实现时不需要
├── design-canvas.jsx           # 设计画布工具 — 实现时不需要
├── variations/
│   ├── diary.jsx               # ★ DiaryHome (减脂主目标 → 默认首页)
│   ├── garden.jsx              # ★ GardenHome (抗炎主目标)
│   └── chapters.jsx            # 早期探索,不采用
└── screens/
    ├── sevenday.jsx            # ★ 趋势屏
    ├── pantry.jsx              # ★ 食材库
    ├── diversity.jsx           # ★ 食物多样性详情屏
    ├── profile.jsx             # ★ 我的屏 (含目标优先级 picker)
    └── science.jsx             # ★ 科学屏
```

★ = 需要实现的屏。

---

## 实现建议

1. **从 design tokens 开始**: 把 4 套色板做成 theme system (CSS vars 或 platform equivalent)。
2. **核心组件先建**: `<Ring>`, `<Bar>`, `<Card>`, `<Chip>`, `<MiniStat>`, `<RotatingBanner>`, `<DateNav>`,这些跨多屏复用。
3. **按屏开发**: 总览 (DiaryHome) → 趋势 → 食物多样性详情 → 我的 → 食材库 → 科学。GardenHome 是次屏,可后做。
4. **Goal-driven 首页**: 在 root nav / app shell 里读 `user.goals[0]`,switch 到对应 home component。
5. **Banner 自动滚动**: 用 platform-native 的 horizontal pager (ViewPager / PageView / FlatList horizontal + paging),配合 timer 实现自动翻页。
6. **手写体字号大些**: caveat 字体小尺寸下不易读,建议 14–16px 起。

如果有疑问,优先以原型里的实现为准 (`prototype/` 文件里的实际 px 数和颜色值)。
