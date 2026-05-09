# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start Vite dev server
npm run build        # tsc -b && vite build  ← ALWAYS run before pushing
npm run lint         # ESLint
npm run test         # Vitest (single run)
npm run test:watch   # Vitest watch mode
```

**Always run `npm run build` before `git push`.** The CI/CD pipeline runs the same build and will fail the GitHub Pages deployment if there are TypeScript errors.

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
