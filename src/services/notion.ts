import type { MealItem, MealType, DailyLog } from '../types/log';
import { FOOD_CATEGORY_LABELS } from '../types/food';
import { MEAL_LABELS } from '../types/log';
import {
  saveUserNotionSettings,
  deleteUserNotionSettings,
  getAllDailyLogs,
  saveDailyLog,
} from './firestore';

export interface NotionSettings {
  workerUrl: string;
  token: string;
  databaseId: string;
  /** OAuth 连接时记录的 workspace 名称（手动配置时没有） */
  workspaceName?: string;
  /** 同步目标数据库的 Notion 链接（OAuth 连接时记录） */
  databaseUrl?: string;
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

/** 查询数据库里已存在的条目（条目ID → Notion page id），失败返回 null */
async function fetchExistingEntryMap(settings: NotionSettings): Promise<Map<string, string> | null> {
  const map = new Map<string, string>();
  let cursor: string | undefined;
  try {
    do {
      const resp = await notionFetch(settings, `/v1/databases/${settings.databaseId}/query`, 'POST', {
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
        const entryId = page.properties?.['条目ID']?.rich_text?.[0]?.plain_text;
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
  const existing = await fetchExistingEntryMap(settings);

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
