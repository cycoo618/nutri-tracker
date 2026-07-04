import type { MealItem, MealType } from '../types/log';
import { FOOD_CATEGORY_LABELS } from '../types/food';
import { MEAL_LABELS } from '../types/log';

export interface NotionSettings {
  workerUrl: string;   // e.g. https://notion-proxy.xxx.workers.dev
  token: string;       // Notion Integration secret (secret_xxx)
  databaseId: string;  // 32-char database ID
}

const STORAGE_KEY = 'notion_settings';

export function getNotionSettings(): NotionSettings | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as NotionSettings;
    if (!s.workerUrl || !s.token || !s.databaseId) return null;
    return s;
  } catch { return null; }
}

export function saveNotionSettings(s: NotionSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function clearNotionSettings(): void {
  localStorage.removeItem(STORAGE_KEY);
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
