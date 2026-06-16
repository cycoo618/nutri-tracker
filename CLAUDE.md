# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start Vite dev server
npm run build        # tsc -b && vite build  ← ALWAYS run before pushing
npm run build:ios    # build + sync to Xcode project
npm run open:ios     # open Xcode
npm run lint         # ESLint
npm run test         # Vitest (single run)
npm run test:watch   # Vitest watch mode
```

## 工作流规则（必须遵守）

**每次代码改动后，Claude 必须自动执行以下步骤，不需要用户提醒：**

1. `npm run build:ios` — 编译 + 同步到 Xcode（包含 TypeScript 检查）
2. 如果编译报错，立刻修复，直到编译通过为止

**用户不需要自己跑任何 CLI 命令。** Claude 有完整的 Bash 权限，所有构建、安装、脚本都应由 Claude 直接执行。

构建完成后告知用户只需在 Xcode 里按 Cmd+R 即可。

**Always run `npm run build` before `git push`.** The CI/CD pipeline runs the same build and will fail the GitHub Pages deployment if there are TypeScript errors.

## iOS / Capacitor

The app is wrapped with Capacitor. The `ios/` directory contains the Xcode project.

### Build and run

```bash
npm run build:ios    # tsc + vite build + cap sync ios
npm run open:ios     # opens Xcode
# In Xcode: select simulator or device, press Cmd+R
```

For JS-only changes: re-run `build:ios` then re-run in Xcode (no native recompile needed).

### Project structure

- `capacitor.config.ts` — appId, webDir, plugin config
- `ios/` — Xcode project (commit everything except `ios/App/Pods/`)
- `ios/App/App/Info.plist` — camera permissions, URL schemes for Firebase OAuth
- `ios/App/App/App.entitlements` — Sign in with Apple entitlement

### Auth on native iOS

`signInWithPopup` is blocked by WKWebView. `src/services/auth.ts` detects `Capacitor.isNativePlatform()` and uses `signInWithRedirect` instead. Firebase + `@capacitor/browser` automatically opens a SFSafariViewController for the OAuth flow, then redirects back via the registered URL scheme in `Info.plist`.

### Xcode one-time setup (after first `cap add ios`)

1. Set Bundle ID = `com.yc.nutritrack` and select Apple Developer account
2. Target → Signing & Capabilities → add "Sign in with Apple"
3. Download `GoogleService-Info.plist` from Firebase Console → drag into `ios/App/App/` in Xcode
4. Add to `Info.plist`:
   - `NSCameraUsageDescription` — camera permission string
   - `NSPhotoLibraryUsageDescription` — photo library permission string
   - `CFBundleURLTypes` with `com.yc.nutritrack` and `REVERSED_CLIENT_ID` from GoogleService-Info.plist

### Safe area

`viewport-fit=cover` is set in `index.html`. Use `env(safe-area-inset-top/bottom)` for content near the notch/home indicator (already applied to `body` in `index.css`).

### Never use `h-screen` or `100vh` on modal overlays

Use `style={{ top: 'var(--vvt, 0px)', height: 'var(--vvh, 100vh)' }}` (existing pattern — works in both Safari and WKWebView).

## Architecture

### State flow

`App.tsx` owns all top-level state and passes everything down as props — no Context or global store.

```
useAuth()       → auth state, user profile, onboarding flag
useFoodLog()    → daily log CRUD, date navigation, sync status
useNutrition()  → derived nutrition status from profile + dailyLog
        ↓
DashboardPage   → receives all of the above as props
```

App renders four mutually exclusive screens in order: loading → LoginPage → OnboardingPage → DashboardPage.

### Persistence layers

| Data | localStorage | Firestore |
|------|-------------|-----------|
| Daily food logs | Cache (instant display) | Source of truth |
| Custom foods (`CustomFoodRecord`) | Primary store | Synced via `saveUserFood` |
| Recent foods | Only | — |
| Search cache | Only | — |
| Scan photos (`imageDataUrl`) | **Never** — always stripped | **Never** |

`useFoodLog` uses a "local-first" pattern: write to localStorage immediately, then async-write to Firestore. On load: show localStorage instantly, then reconcile with Firestore.

`customFoods.ts` `save()` strips `imageDataUrl` from all records before writing to localStorage to avoid the 5 MB quota. This stripping is intentional — never remove it.

### Food data pipeline

Three-layer search in `FoodSearch.tsx`:
1. **Builtin** (`data/food-database.ts`) — loaded async at startup via `initFoodDatabase()`
2. **Open Food Facts** — for branded/packaged foods not in the builtin DB
3. **AI estimate** (`nutrition-vision.ts`) — Groq LLaMA Vision for label scanning; `estimateFoodNutrition` for name-based estimation

Custom/scanned foods are `CustomFoodRecord` objects stored in localStorage. `recordToFoodItem()` converts them to `FoodItem` for use in search results — it now reads `rec.category` first, then falls back to `inferCategory(name)` keyword matching.

### Two separate category systems — do not conflate

**`FoodCategory`** (`types/food.ts`) — classifies a food item:
`grain | vegetable | fruit | meat | seafood | dairy | egg | soy | nut | oil | drink | snack | branded | other`

**`MedCategory`** (`utils/goalAlerts.ts`) — used exclusively for Mediterranean diet tracking:
`vegetable | fruit | whole_grain | legume | nut | seafood | fermented`

These are different types with different values. Mediterranean diet tracking works by **keyword matching food names** against `MED_KEYWORDS` in `goalAlerts.ts`, not by looking at `FoodCategory`. When adding new foods that should count toward a Mediterranean category, add keywords to `MED_KEYWORDS` in `goalAlerts.ts`.

### iOS Safari modal system

`useKeyboardScroll()` (called once in `App.tsx`) injects two CSS variables updated by `visualViewport`:
- `--vvh` — visible viewport height (shrinks when keyboard opens)
- `--vvt` — viewport top offset (non-zero when page scrolls up for keyboard)

All bottom-sheet modals must use:
```tsx
style={{ top: 'var(--vvt, 0px)', height: 'var(--vvh, 100vh)' }}
```
**Never use `h-screen` or `100vh` directly on modal overlays.**

Bottom-sheet cards use `useSwipeDown` for drag-to-dismiss. Buttons inside the card that need to work reliably on iOS must use `onTouchEnd` in addition to `onClick`:
```tsx
onTouchEnd={e => { e.preventDefault(); e.stopPropagation(); handleAction(); }}
onClick={() => handleAction()}
```
`e.preventDefault()` stops the subsequent synthetic `click` event (prevents double-firing); `e.stopPropagation()` prevents the card's swipe handler from consuming the touch.

### i18n

All UI strings go in `src/i18n/index.ts` as `{ zh: '...', en: '...' }` entries. Access via `const { t, locale } = useLocale()`. Add new keys there before using `t('key')` in components.

### Firestore schema

Collections:
- `users/{uid}` — `UserProfile`
- `dailyLogs/{uid}_{date}` — `DailyLog`
- `userFoods/{uid}/foods/{foodId}` — `CustomFoodRecord` (without `imageDataUrl`)
- `families/{familyId}` — `Family` with `members[]`

All Firestore operations go through `services/firestore.ts` which wraps every call with a 10-second timeout. `stripUndefined()` is called before writes because Firestore rejects `undefined` values.

### Deployment

Pushes to `main` trigger GitHub Actions → GitHub Pages deployment. The workflow runs `npm run build`; failures block the deploy and show as red ✗ in the Actions tab.

---

## 科研论文分析工作流与写作偏好

### 标准工作流（每篇论文）

1. **检索阶段**：只收集标题、期刊、发表时间、摘要梗概，不读全文
2. **深度拆解**：对单篇论文获取全部信息——发表信息、作者机构、资助方/利益冲突、研究设计、研究对象、方法、原始数据、机制分析、局限性、结论
3. **验证阶段**：启动独立 sub-agent，对照原始论文逐项核查关键数据（人数、随访时长、HR 值、置信区间、p 值、百分比、资助方等），标注 ✅ CONFIRMED / ❌ INCORRECT / ⚠️ PARTIALLY CORRECT
4. **修正整合**：将验证结果并入正文，明确标注修正项
5. **改写输出**：按下方风格偏好改写为最终版

### 写作风格偏好

**整体风格：公众号深度文**
- 有叙事骨架和节奏，适合深度阅读
- 不是小红书碎片化风格（除非用户明确要求）
- 科学严格中立，不夸大结论

**禁止使用的表达**：
- "更令人着迷的是……"
- "耐人寻味"、"令人意外"、"令人震惊"
- 故弄玄虚的过渡句（如"但真正有趣的部分来了"）
- 修辞性反问句（如"等一下——LDL 贡献不显著？"）

**正确做法**：直接陈述数据、推论和结论，让数据本身说话。

### 内容结构偏好

每篇论文深度文的标准结构：

1. 发表信息（期刊、时间、DOI、资助方、利益冲突）
2. 研究类型说明（RCT / 队列 / 荟萃分析及其含义）
3. 研究对象（人数、人口特征、随访时长——用表格）
4. 研究方法（如何测量核心变量——用表格）
5. 测量指标（生物标志物等分类列表——用表格）
6. 各组数据对比（饮食、生活方式差异——用表格）
7. 核心结果（HR、置信区间、p 值——用表格）
8. 机制分析（中介分析等——用表格）
9. 局限性（列表，使用作者自述内容）
10. Action Items（分类列表，面向普通读者）
11. 一句话总结
12. 免责声明脚注（研究类型、资助方、适用人群）

**结构原则**：叙事骨架与数据表格融合在一篇文章里，不做 Appendix 分离。表格和列表是内容的一部分，不是附录。

### 数据准确性原则

- 核心统计数字（HR、p 值、置信区间、样本量）必须经过验证 sub-agent 核查后才能定稿
- HR 数字需注明对应的调整层级（基础模型 / 生活方式调整模型 / 完全调整模型）
- 资助方与利益冲突需区分：直接资助本研究 vs 作者个人的研究外资助
- 生物指标的分组数（如"8类"vs"10类"）需与原文核对
