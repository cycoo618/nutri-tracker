import type { MealItem, MealType, DailyLog } from '../types/log';
import type { FoodItem, FoodCategory, FoodSource } from '../types/food';
import { FOOD_CATEGORY_LABELS, scaleNutrition } from '../types/food';
import { MEAL_LABELS } from '../types/log';
import {
  saveUserNotionSettings,
  deleteUserNotionSettings,
  getAllDailyLogs,
  saveDailyLog,
} from './firestore';
import { getAllCustomFoods, recordToFoodItem } from '../utils/customFoods';

export interface NotionSettings {
  workerUrl: string;
  token: string;
  databaseId: string;
  /** OAuth 连接时记录的 workspace 名称（手动配置时没有） */
  workspaceName?: string;
  /** 同步目标数据库的 Notion 链接（OAuth 连接时记录） */
  databaseUrl?: string;
  /** 「食物数据库」（食物 reference 表）的 Database ID，缺失时首次同步会自动创建 */
  foodDatabaseId?: string;
  /** 「食物数据库」的 Notion 链接 */
  foodDatabaseUrl?: string;
}

const STORAGE_KEY = 'notion_settings';

// localStorage 用于即时读取（不等 Firestore 异步）
export function getNotionSettings(): NotionSettings | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as NotionSettings;
    if (!s.workerUrl || !s.token || !s.databaseId) return null;
    return s;
  } catch { return null; }
}

// 同时写 localStorage（即时生效）和 Firestore（跨设备同步）
export function saveNotionSettings(s: NotionSettings, uid?: string): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  if (uid) saveUserNotionSettings(uid, s).catch(console.warn);
}

// 从 Firestore 加载设置并写入 localStorage（登录时调用）
export async function loadNotionSettingsFromFirestore(uid: string): Promise<NotionSettings | null> {
  const { getUserNotionSettings } = await import('./firestore');
  const s = await getUserNotionSettings(uid);
  if (s && s.workerUrl && s.token && s.databaseId) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    return s;
  }
  return null;
}

export function clearNotionSettings(uid?: string): void {
  localStorage.removeItem(STORAGE_KEY);
  // 食物 → Notion 页面映射跟随连接失效（换工作区后按 食物ID 重新查库去重）
  localStorage.removeItem('notion_food_pages');
  if (uid) deleteUserNotionSettings(uid).catch(console.warn);
}

// ─── API helpers ────────────────────────────────────────────────

function notionFetch(settings: NotionSettings, path: string, method: string, body?: unknown) {
  const base = settings.workerUrl.replace(/\/$/, '');
  return fetch(`${base}/notion${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${settings.token}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function num(v: number | undefined | null) {
  return (v != null && isFinite(v) && v !== 0) ? { number: v } : { number: null };
}

function buildProperties(item: MealItem, date: string, mealType: MealType) {
  const n = item.nutrition;
  const categoryLabel = item.category
    ? (FOOD_CATEGORY_LABELS[item.category as keyof typeof FOOD_CATEGORY_LABELS] ?? item.category)
    : '其他';

  return {
    // Title
    '食物名称': { title: [{ text: { content: item.foodName } }] },

    // Date & time
    '日期': { date: { start: date } },
    '记录时间': item.loggedAt
      ? { date: { start: item.loggedAt } }
      : { date: { start: new Date().toISOString() } },

    // Classification
    '餐次': { select: { name: MEAL_LABELS[mealType] } },
    '食物分类': { select: { name: categoryLabel } },

    // Quantity
    '克重': { number: item.amount },
    '显示单位': { rich_text: [{ text: { content: item.unit } }] },

    // Core macros
    '热量(千卡)': num(n.calories),
    '蛋白质(g)': num(n.protein),
    '碳水化合物(g)': num(n.carbs),
    '脂肪(g)': num(n.fat),
    '膳食纤维(g)': num(n.fiber),

    // Additional nutrients
    '糖(g)': num(n.sugar),
    '饱和脂肪(g)': num(n.saturatedFat),
    '反式脂肪(g)': num(n.transFat),
    '钠(mg)': num(n.sodium),
    '胆固醇(mg)': num(n.cholesterol),
    'Omega-3(mg)': num(n.omega3),
    '钙(mg)': num(n.calcium),
    '铁(mg)': num(n.iron),
    '钾(mg)': num(n.potassium),
    '镁(mg)': num(n.magnesium),
    '锌(mg)': num(n.zinc),
    '维生素C(mg)': num(n.vitaminC),
    '维生素A(μg)': num(n.vitaminA),
    '维生素D(μg)': num(n.vitaminD),

    // Meta
    'GI值': num(item.gi),
    '条目ID': { rich_text: [{ text: { content: item.id } }] },
  };
}

// ─── 食物数据库（食物 reference 表） ─────────────────────────────

export const FOOD_DB_TITLE = '食物数据库';

// 字段必须与 buildFoodProperties() 逐一对应（notionOAuth.ts 一键建库也用这份 schema）
export const FOOD_DB_SCHEMA: Record<string, unknown> = {
  '食物名称': { title: {} },
  '来源': { select: {} },
  '食物分类': { select: {} },
  '品牌': { rich_text: {} },
  '基准份量': { rich_text: {} },
  '基准克重(g)': { number: {} },
  '热量(千卡)': { number: {} },
  '蛋白质(g)': { number: {} },
  '碳水化合物(g)': { number: {} },
  '脂肪(g)': { number: {} },
  '膳食纤维(g)': { number: {} },
  '糖(g)': { number: {} },
  '饱和脂肪(g)': { number: {} },
  '反式脂肪(g)': { number: {} },
  '钠(mg)': { number: {} },
  '胆固醇(mg)': { number: {} },
  'Omega-3(mg)': { number: {} },
  '钙(mg)': { number: {} },
  '铁(mg)': { number: {} },
  '钾(mg)': { number: {} },
  '镁(mg)': { number: {} },
  '锌(mg)': { number: {} },
  '维生素C(mg)': { number: {} },
  '维生素A(μg)': { number: {} },
  '维生素D(μg)': { number: {} },
  'GI值': { number: {} },
  '常用份量': { rich_text: {} },
  '食材明细': { rich_text: {} },
  '食物ID': { rich_text: {} },
  '首次记录': { date: {} },
  '最近记录': { date: {} },
};

function richText(s: string | undefined) {
  return { rich_text: s ? [{ text: { content: s } }] : [] };
}

function foodSourceLabel(food: FoodItem): string {
  if (food.source === 'builtin') return '内置数据库';
  if (food.source === 'openfoodfacts') return food.id.startsWith('usda_') ? 'USDA 数据库' : 'Open Food Facts';
  if (food.source === 'ai_estimated') return 'AI 估算';
  if (food.tags?.includes('扫码')) return '拍照识别';
  if (food.tags?.includes('手动')) return '手动录入';
  if (food.tags?.includes('自制')) return '组合食谱';
  return '自定义';
}

function buildFoodProperties(food: FoodItem, opts?: { firstLogged?: string }) {
  // 基准份量：拍照识别的食物用营养价值表上的每份份量，其余统一按 100g（最小标准单位）
  const labelServing = food.tags?.includes('扫码') ? food.servingSizes?.[0] : undefined;
  const base = labelServing && labelServing.grams > 0 ? labelServing : { label: '100g', grams: 100 };
  const n = scaleNutrition(food.per100g, base.grams);
  const baseLabel = base.label.includes(`${base.grams}g`) ? base.label : `${base.label}（${base.grams}g）`;

  const categoryLabel = FOOD_CATEGORY_LABELS[food.category] ?? '其他';
  const servings = (food.servingSizes ?? [])
    .map(s => s.label.includes(`${s.grams}g`) ? s.label : `${s.label}（${s.grams}g）`)
    .join('、');
  const ingredients = (food.ingredients ?? []).map(i => `${i.foodName} ${i.grams}g`).join(' + ');

  return {
    '食物名称': { title: [{ text: { content: food.name } }] },
    '来源': { select: { name: foodSourceLabel(food) } },
    '食物分类': { select: { name: categoryLabel } },
    '品牌': richText(food.brand),
    '基准份量': richText(baseLabel),
    '基准克重(g)': { number: base.grams },
    '热量(千卡)': num(n.calories),
    '蛋白质(g)': num(n.protein),
    '碳水化合物(g)': num(n.carbs),
    '脂肪(g)': num(n.fat),
    '膳食纤维(g)': num(n.fiber),
    '糖(g)': num(n.sugar),
    '饱和脂肪(g)': num(n.saturatedFat),
    '反式脂肪(g)': num(n.transFat),
    '钠(mg)': num(n.sodium),
    '胆固醇(mg)': num(n.cholesterol),
    'Omega-3(mg)': num(n.omega3),
    '钙(mg)': num(n.calcium),
    '铁(mg)': num(n.iron),
    '钾(mg)': num(n.potassium),
    '镁(mg)': num(n.magnesium),
    '锌(mg)': num(n.zinc),
    '维生素C(mg)': num(n.vitaminC),
    '维生素A(μg)': num(n.vitaminA),
    '维生素D(μg)': num(n.vitaminD),
    'GI值': num(food.gi),
    '常用份量': richText(servings),
    '食材明细': richText(ingredients),
    '食物ID': richText(food.id),
    ...(opts?.firstLogged ? { '首次记录': { date: { start: opts.firstLogged } } } : {}),
    '最近记录': { date: { start: new Date().toISOString() } },
  };
}

// ─── Public API ─────────────────────────────────────────────────

/** Create a Notion page for a food entry. Returns the Notion page ID. */
export async function notionAddEntry(
  item: MealItem,
  date: string,
  mealType: MealType,
): Promise<string | null> {
  const settings = getNotionSettings();
  if (!settings) return null;
  try {
    const resp = await notionFetch(settings, '/v1/pages', 'POST', {
      parent: { database_id: settings.databaseId },
      properties: buildProperties(item, date, mealType),
    });
    if (!resp.ok) { console.warn('Notion add failed:', await resp.text()); return null; }
    const data = await resp.json() as { id: string };
    return data.id;
  } catch (e) {
    console.warn('Notion addEntry error:', e);
    return null;
  }
}

/** Update an existing Notion page with new values. */
export async function notionUpdateEntry(
  notionPageId: string,
  item: MealItem,
  date: string,
  mealType: MealType,
): Promise<void> {
  const settings = getNotionSettings();
  if (!settings) return;
  try {
    const resp = await notionFetch(settings, `/v1/pages/${notionPageId}`, 'PATCH', {
      properties: buildProperties(item, date, mealType),
    });
    if (!resp.ok) console.warn('Notion update failed:', await resp.text());
  } catch (e) {
    console.warn('Notion updateEntry error:', e);
  }
}

/** Archive (soft-delete) a Notion page. */
export async function notionDeleteEntry(notionPageId: string): Promise<void> {
  const settings = getNotionSettings();
  if (!settings) return;
  try {
    const resp = await notionFetch(settings, `/v1/pages/${notionPageId}`, 'PATCH', {
      archived: true,
    });
    if (!resp.ok) console.warn('Notion delete failed:', await resp.text());
  } catch (e) {
    console.warn('Notion deleteEntry error:', e);
  }
}

/** Test connection — returns null on success, error message on failure. */
export async function notionTestConnection(settings: NotionSettings): Promise<string | null> {
  try {
    const resp = await notionFetch(settings, `/v1/databases/${settings.databaseId}`, 'GET');
    if (resp.status === 200) return null;
    if (resp.status === 401) return '认证失败，请检查 Token';
    if (resp.status === 404) return '找不到数据库，请检查 Database ID 并确认已分享给 Integration';
    return `错误 ${resp.status}`;
  } catch {
    return '无法连接，请检查 Worker URL';
  }
}

/** 查询数据库里已存在的条目（idProp 的值 → Notion page id），失败返回 null */
async function fetchExistingEntryMap(
  settings: NotionSettings,
  databaseId: string,
  idProp: string,
): Promise<Map<string, string> | null> {
  const map = new Map<string, string>();
  let cursor: string | undefined;
  try {
    do {
      const resp = await notionFetch(settings, `/v1/databases/${databaseId}/query`, 'POST', {
        page_size: 100,
        ...(cursor ? { start_cursor: cursor } : {}),
      });
      if (!resp.ok) return null;
      const data = await resp.json() as {
        results?: { id: string; properties?: Record<string, { rich_text?: { plain_text?: string }[] }> }[];
        has_more?: boolean;
        next_cursor?: string | null;
      };
      for (const page of data.results ?? []) {
        const entryId = page.properties?.[idProp]?.rich_text?.[0]?.plain_text;
        if (entryId) map.set(entryId, page.id);
      }
      cursor = data.has_more && data.next_cursor ? data.next_cursor : undefined;
    } while (cursor);
    return map;
  } catch {
    return null;
  }
}

/** 批量导入历史记录到 Notion（增量：以数据库实际内容为准，只补缺失的条目）。
 *  以「条目ID」比对当前数据库，本地 notionPageId 指向别的库/已删页面时会重新导入并修复映射；
 *  数据库查询失败时退回旧判断（跳过已有 notionPageId 的条目），保证绝不重复导入。 */
export async function importHistoricalToNotion(
  userId: string,
  onProgress?: (done: number, total: number) => void,
): Promise<{ imported: number; skipped: number }> {
  const settings = getNotionSettings();
  if (!settings) return { imported: 0, skipped: 0 };

  const logs: DailyLog[] = await getAllDailyLogs(userId);
  const existing = await fetchExistingEntryMap(settings, settings.databaseId, '条目ID');

  // 按日志分组，方便批量回写 Firestore
  const logMap = new Map<string, DailyLog>(logs.map(l => [l.id, l]));
  const changedLogIds = new Set<string>();
  const patchItem = (logId: string, itemId: string, notionPageId: string) => {
    const current = logMap.get(logId);
    if (!current) return;
    logMap.set(logId, {
      ...current,
      meals: current.meals.map(m => ({
        ...m,
        items: m.items.map(i => (i.id === itemId ? { ...i, notionPageId } : i)),
      })),
    });
    changedLogIds.add(logId);
  };

  // 收集缺失条目
  const tasks: { logId: string; date: string; mealType: MealType; item: MealItem }[] = [];
  let skipped = 0;
  for (const log of logs) {
    for (const meal of log.meals) {
      for (const item of meal.items) {
        const knownPageId = existing?.get(item.id);
        if (knownPageId) {
          // 数据库里已有：只在映射不一致时修复（如切换过数据库）
          if (item.notionPageId !== knownPageId) patchItem(log.id, item.id, knownPageId);
          skipped++;
        } else if (!existing && item.notionPageId) {
          // 查询失败的保守兜底：沿用旧判断，避免重复导入
          skipped++;
        } else {
          tasks.push({ logId: log.id, date: log.date, mealType: meal.type, item });
        }
      }
    }
  }

  let imported = 0;
  let failed = 0;
  const total = tasks.length;

  for (const { logId, date, mealType, item } of tasks) {
    try {
      const notionPageId = await notionAddEntry(item, date, mealType);
      if (notionPageId) {
        patchItem(logId, item.id, notionPageId);
        imported++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
    onProgress?.(imported + failed, total);
    // 限速：Notion API 3 req/s
    await new Promise(r => setTimeout(r, 350));
  }

  // 批量回写有变更的日志到 Firestore
  await Promise.allSettled([...changedLogIds].map(id => saveDailyLog(logMap.get(id)!)));

  return { imported, skipped: skipped + failed };
}

// ─── 食物数据库：自动建库 + upsert + 批量导入 ────────────────────

const FOOD_PAGE_MAP_KEY = 'notion_food_pages';

function loadFoodPageMap(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(FOOD_PAGE_MAP_KEY) || '{}');
  } catch { return {}; }
}

function saveFoodPageMap(map: Record<string, string>): void {
  try { localStorage.setItem(FOOD_PAGE_MAP_KEY, JSON.stringify(map)); } catch { /* ignore */ }
}

// 并发去重：同时记录多个食物时只建一次库
let ensureFoodDbPromise: Promise<string | null> | null = null;

/** 确保「食物数据库」存在（在每日饮食记录库的同一父页面下自动找/建），返回 database id */
export function ensureFoodDatabase(uid?: string): Promise<string | null> {
  const settings = getNotionSettings();
  if (!settings) return Promise.resolve(null);
  if (settings.foodDatabaseId) return Promise.resolve(settings.foodDatabaseId);
  if (!ensureFoodDbPromise) {
    ensureFoodDbPromise = findOrCreateFoodDatabase(settings, uid)
      .finally(() => { ensureFoodDbPromise = null; });
  }
  return ensureFoodDbPromise;
}

async function findOrCreateFoodDatabase(settings: NotionSettings, uid?: string): Promise<string | null> {
  try {
    // 1) 每日饮食记录库的父页面（即「健康饮食」）
    const dbResp = await notionFetch(settings, `/v1/databases/${settings.databaseId}`, 'GET');
    if (!dbResp.ok) return null;
    const db = await dbResp.json() as { parent?: { type?: string; page_id?: string } };
    const parentPageId = db.parent?.page_id;

    // 2) 父页面直接子块里找已有的「食物数据库」（blocks API 实时、无索引延迟）
    let foodDbId: string | null = null;
    if (parentPageId) {
      const kids = await notionFetch(settings, `/v1/blocks/${parentPageId}/children?page_size=100`, 'GET');
      if (kids.ok) {
        const blocks = (await kids.json() as { results?: { id: string; type?: string; child_database?: { title?: string } }[] }).results ?? [];
        const hit = blocks.find(b => b.type === 'child_database' && b.child_database?.title === FOOD_DB_TITLE);
        if (hit) foodDbId = hit.id;
      }
    }

    // 3) search 兜底（手动配置的库可能不在页面下，或换过位置）
    if (!foodDbId) {
      const s = await notionFetch(settings, '/v1/search', 'POST', {
        query: FOOD_DB_TITLE,
        filter: { property: 'object', value: 'database' },
      });
      if (s.ok) {
        const data = await s.json() as { results?: { object: string; id: string; title?: { plain_text?: string }[] }[] };
        const hit = data.results?.find(r => r.object === 'database' && (r.title?.[0]?.plain_text ?? '') === FOOD_DB_TITLE);
        if (hit) foodDbId = hit.id;
      }
    }

    // 4) 都没有 → 在父页面下新建
    if (!foodDbId && parentPageId) {
      const createResp = await notionFetch(settings, '/v1/databases', 'POST', {
        parent: { type: 'page_id', page_id: parentPageId },
        title: [{ type: 'text', text: { content: FOOD_DB_TITLE } }],
        properties: FOOD_DB_SCHEMA,
      });
      if (createResp.ok) {
        foodDbId = ((await createResp.json()) as { id: string }).id;
      }
    }
    if (!foodDbId) return null;

    const cleanId = foodDbId.replace(/-/g, '');
    const updated: NotionSettings = {
      ...settings,
      foodDatabaseId: cleanId,
      foodDatabaseUrl: `https://www.notion.so/${cleanId}`,
    };
    saveNotionSettings(updated, uid);
    return cleanId;
  } catch (e) {
    console.warn('Notion ensureFoodDatabase error:', e);
    return null;
  }
}

/** 把一个食物 upsert 到「食物数据库」（按 食物ID 去重）。fire-and-forget。 */
export async function notionUpsertFood(food: FoodItem, uid?: string): Promise<void> {
  const settings = getNotionSettings();
  if (!settings) return;
  try {
    const dbId = await ensureFoodDatabase(uid);
    if (!dbId) return;
    const freshSettings = getNotionSettings() ?? settings;

    const map = loadFoodPageMap();
    let pageId: string | undefined = map[food.id];

    // 本地没有映射 → 按 食物ID 查库（跨设备/清缓存后防重复）
    if (!pageId) {
      const q = await notionFetch(freshSettings, `/v1/databases/${dbId}/query`, 'POST', {
        filter: { property: '食物ID', rich_text: { equals: food.id } },
        page_size: 1,
      });
      if (q.ok) {
        pageId = ((await q.json()) as { results?: { id: string }[] }).results?.[0]?.id;
      }
    }

    if (pageId) {
      // 已有 → 更新（刷新营养数据和「最近记录」）
      const resp = await notionFetch(freshSettings, `/v1/pages/${pageId}`, 'PATCH', {
        properties: buildFoodProperties(food),
      });
      if (resp.ok) {
        map[food.id] = pageId;
        saveFoodPageMap(map);
        return;
      }
      // 页面已被删除/归档 → 清掉映射，走新建
      delete map[food.id];
    }

    const resp = await notionFetch(freshSettings, '/v1/pages', 'POST', {
      parent: { database_id: dbId },
      properties: buildFoodProperties(food, { firstLogged: new Date().toISOString() }),
    });
    if (resp.ok) {
      map[food.id] = ((await resp.json()) as { id: string }).id;
      saveFoodPageMap(map);
    } else {
      console.warn('Notion upsertFood failed:', await resp.text());
    }
  } catch (e) {
    console.warn('Notion upsertFood error:', e);
  }
}

/** 从历史日志条目反推 FoodItem（内置库里找不到时的兜底） */
function deriveFoodFromItem(item: MealItem): FoodItem {
  const per100g = item.amount > 0
    ? scaleNutrition(item.nutrition, 10000 / item.amount)
    : { ...item.nutrition };
  const source: FoodSource =
    item.foodId.startsWith('off_') || item.foodId.startsWith('usda_') ? 'openfoodfacts'
    : item.foodId.startsWith('ai_') ? 'ai_estimated'
    : item.foodId.startsWith('custom_') ? 'user_added'
    : 'builtin';
  return {
    id: item.foodId,
    name: item.foodName,
    category: (item.category as FoodCategory | undefined) ?? 'other',
    per100g,
    gi: item.gi,
    source,
    ingredients: item.recipeIngredients,
  };
}

/** 批量导入所有已知食物到「食物数据库」（自定义食材库 + 历史日志里的每种食物，按 食物ID 去重增量） */
export async function importFoodsToNotion(
  userId: string,
  onProgress?: (done: number, total: number) => void,
): Promise<{ imported: number; skipped: number }> {
  const settings = getNotionSettings();
  if (!settings) return { imported: 0, skipped: 0 };
  const dbId = await ensureFoodDatabase(userId);
  if (!dbId) return { imported: 0, skipped: 0 };
  const freshSettings = getNotionSettings() ?? settings;

  // 收集候选食物（自定义食材库优先，数据最全）
  const candidates = new Map<string, { food: FoodItem; firstLogged: string }>();
  for (const rec of getAllCustomFoods()) {
    candidates.set(rec.id, { food: recordToFoodItem(rec), firstLogged: rec.createdAt });
  }

  // 历史日志：内置库能找到就用完整数据，找不到就从条目反推
  const logs: DailyLog[] = await getAllDailyLogs(userId);
  const { initFoodDatabase, getDatabase } = await import('./food-lookup');
  await initFoodDatabase();
  const builtinDb = getDatabase();
  for (const log of logs) {
    for (const meal of log.meals) {
      for (const item of meal.items) {
        const loggedAt = item.loggedAt ?? log.date;
        const existing = candidates.get(item.foodId);
        if (existing) {
          if (loggedAt < existing.firstLogged) existing.firstLogged = loggedAt;
        } else {
          const builtin = builtinDb.find(f => f.id === item.foodId);
          candidates.set(item.foodId, { food: builtin ?? deriveFoodFromItem(item), firstLogged: loggedAt });
        }
      }
    }
  }

  // 与数据库实际内容比对，只补缺失的
  const existing = await fetchExistingEntryMap(freshSettings, dbId, '食物ID');
  const map = loadFoodPageMap();
  const tasks: { food: FoodItem; firstLogged: string }[] = [];
  let skipped = 0;
  for (const [foodId, cand] of candidates) {
    const knownPageId = existing?.get(foodId);
    if (knownPageId) {
      map[foodId] = knownPageId;
      skipped++;
    } else if (!existing && map[foodId]) {
      // 查询失败的保守兜底：本地有映射就跳过，避免重复导入
      skipped++;
    } else {
      tasks.push(cand);
    }
  }
  saveFoodPageMap(map);

  let imported = 0;
  let failed = 0;
  const total = tasks.length;
  for (const { food, firstLogged } of tasks) {
    try {
      const resp = await notionFetch(freshSettings, '/v1/pages', 'POST', {
        parent: { database_id: dbId },
        properties: buildFoodProperties(food, { firstLogged }),
      });
      if (resp.ok) {
        map[food.id] = ((await resp.json()) as { id: string }).id;
        saveFoodPageMap(map);
        imported++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
    onProgress?.(imported + failed, total);
    // 限速：Notion API 3 req/s
    await new Promise(r => setTimeout(r, 350));
  }

  return { imported, skipped: skipped + failed };
}
