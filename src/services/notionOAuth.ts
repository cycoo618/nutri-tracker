// ============================================
// Notion 一键 OAuth 连接
// 流程：连接按钮 → Notion 授权页（用户勾选页面）→ 回调
//   → Worker 换 token（client_secret 只在 Worker）
//   → 自动在授权页面下创建「每日饮食记录」数据库 → 保存设置
// Web 走整页跳转（notion-callback.html → ?notion_code=...），
// 原生 iOS 复用 Google PKCE 的模式（Browser.open + appUrlOpen 深链）。
// ============================================

import { Capacitor } from '@capacitor/core';
import {
  saveNotionSettings,
  FOOD_DB_TITLE,
  FOOD_DB_SCHEMA,
  RECIPE_DB_TITLE,
  buildRecipeDbSchema,
  buildSyncedPropRenames,
  type CreatedRecipeDb,
  type NotionSettings,
} from './notion';

const WORKER_URL = ((import.meta.env.VITE_NOTION_WORKER_URL as string | undefined) ?? '').replace(/\/$/, '');
const CALLBACK_URL = 'https://cycoo618.github.io/nutri-tracker/notion-callback.html';
const NATIVE_CALLBACK_PREFIX = 'com.yc.nutritrack://notion-oauth';
const STATE_KEY = 'notion_oauth_state';
const JUST_CONNECTED_KEY = 'notion_just_connected';
const DB_TITLE = '每日饮食记录';

/** OAuth 是否可用（需要构建时配置 VITE_NOTION_WORKER_URL） */
export function isNotionOAuthAvailable(): boolean {
  return !!WORKER_URL;
}

/** 连接完成后置位，ProfileRedesign 挂载时读取并触发历史导入 */
export function consumeJustConnectedFlag(): boolean {
  if (localStorage.getItem(JUST_CONNECTED_KEY)) {
    localStorage.removeItem(JUST_CONNECTED_KEY);
    return true;
  }
  return false;
}

function randomState(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

async function fetchClientId(): Promise<string> {
  const resp = await fetch(`${WORKER_URL}/oauth/config`);
  if (!resp.ok) throw new Error('无法连接授权服务，请稍后重试');
  const { clientId } = await resp.json() as { clientId?: string };
  if (!clientId) throw new Error('授权服务未配置 Notion Client ID');
  return clientId;
}

function buildAuthorizeUrl(clientId: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    owner: 'user',
    redirect_uri: CALLBACK_URL,
    state,
  });
  return `https://api.notion.com/v1/oauth/authorize?${params}`;
}

// ─── Token 交换 & 数据库自动创建 ─────────────────────────────────

async function exchangeCode(code: string): Promise<{ token: string; workspaceName?: string }> {
  const resp = await fetch(`${WORKER_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirect_uri: CALLBACK_URL }),
  });
  const data = await resp.json() as { access_token?: string; workspace_name?: string; error?: string };
  if (!resp.ok || !data.access_token) {
    throw new Error(data.error ? `授权失败：${data.error}` : `授权失败 (${resp.status})`);
  }
  return { token: data.access_token, workspaceName: data.workspace_name };
}

function api(token: string, path: string, method: string, body?: unknown) {
  return fetch(`${WORKER_URL}/notion${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// 字段必须与 services/notion.ts 的 buildProperties() 逐一对应
const DB_SCHEMA: Record<string, unknown> = {
  '食物名称': { title: {} },
  '日期': { date: {} },
  '记录时间': { date: {} },
  '餐次': { select: {} },
  '食物分类': { select: {} },
  '克重': { number: {} },
  '显示单位': { rich_text: {} },
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
  '条目ID': { rich_text: {} },
};

interface SearchResult {
  object: string;
  id: string;
  title?: { plain_text?: string }[];
}

interface BlockResult {
  id: string;
  type?: string;
  child_database?: { title?: string };
}

/** 从授权页面逐层向下遍历（blocks API 实时无索引延迟），找已有的同名数据库（可同时找多个） */
async function walkForDatabases(
  token: string,
  rootPageIds: string[],
  titles: string[],
): Promise<Map<string, string>> {
  const found = new Map<string, string>();
  const queue = rootPageIds.map(id => ({ id, depth: 0 }));
  let requests = 0;
  while (queue.length > 0 && requests < 30 && found.size < titles.length) {
    const { id, depth } = queue.shift()!;
    if (depth > 4) continue;
    requests++;
    try {
      const resp = await api(token, `/v1/blocks/${id}/children?page_size=100`, 'GET');
      if (!resp.ok) continue;
      const blocks = (await resp.json() as { results?: BlockResult[] }).results ?? [];
      for (const b of blocks) {
        const title = b.type === 'child_database' ? b.child_database?.title : undefined;
        if (title && titles.includes(title) && !found.has(title)) {
          found.set(title, b.id.replace(/-/g, ''));
        }
        if (b.type === 'child_page') queue.push({ id: b.id, depth: depth + 1 });
      }
    } catch { /* 单页失败不影响整体遍历 */ }
  }
  return found;
}

/** search 快速路径：找已有同名数据库（重复连接 / 手动创建过） */
async function searchDatabase(token: string, title: string): Promise<string | null> {
  const resp = await api(token, '/v1/search', 'POST', {
    query: title,
    filter: { property: 'object', value: 'database' },
  });
  if (!resp.ok) return null;
  const data = await resp.json() as { results?: SearchResult[] };
  const existing = data.results?.find(r =>
    r.object === 'database' && (r.title?.[0]?.plain_text ?? '') === title
  );
  return existing ? existing.id.replace(/-/g, '') : null;
}

async function createDatabase(token: string, parentPageId: string, title: string, schema: Record<string, unknown>): Promise<string> {
  const resp = await api(token, '/v1/databases', 'POST', {
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ type: 'text', text: { content: title } }],
    properties: schema,
  });
  if (!resp.ok) throw new Error(`创建 Notion 数据库失败 (${resp.status})`);
  return ((await resp.json()) as { id: string }).id.replace(/-/g, '');
}

/** 创建「配方明细」库（relation 指向食物数据库），并把食物数据库上自动生成的反向属性改成中文名 */
async function createRecipeDatabase(token: string, parentPageId: string, foodDatabaseId: string): Promise<string> {
  const resp = await api(token, '/v1/databases', 'POST', {
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ type: 'text', text: { content: RECIPE_DB_TITLE } }],
    properties: buildRecipeDbSchema(foodDatabaseId),
  });
  if (!resp.ok) throw new Error(`创建 Notion 数据库失败 (${resp.status})`);
  const created = await resp.json() as CreatedRecipeDb;
  const renames = buildSyncedPropRenames(created);
  if (Object.keys(renames).length > 0) {
    await api(token, `/v1/databases/${foodDatabaseId}`, 'PATCH', { properties: renames })
      .catch(() => { /* 改名失败不影响功能 */ });
  }
  return created.id.replace(/-/g, '');
}

/** 找到用户已有的「每日饮食记录」「食物数据库」「配方明细」，缺哪个建哪个（三库放同一父页面下） */
async function findOrCreateDatabases(token: string): Promise<{
  databaseId: string;
  foodDatabaseId: string | null;
  recipeDatabaseId: string | null;
}> {
  // 1) search 快速路径
  let databaseId = await searchDatabase(token, DB_TITLE);
  let foodDatabaseId = await searchDatabase(token, FOOD_DB_TITLE);
  let recipeDatabaseId = await searchDatabase(token, RECIPE_DB_TITLE);

  // 2) 列出授权的页面（新建时也要用）
  const pageResp = await api(token, '/v1/search', 'POST', {
    filter: { property: 'object', value: 'page' },
    page_size: 10,
  });
  if (!pageResp.ok) throw new Error('无法读取授权的页面');
  const pages = (await pageResp.json() as { results?: SearchResult[] }).results ?? [];
  const page = pages.find(p => p.object === 'page');
  if (!page) {
    throw new Error('授权时没有选择任何页面。请重新连接，并在 Notion 授权页勾选至少一个页面');
  }

  // 3) search 对刚授权的深层内容有索引延迟，用 blocks API 逐层遍历兜底
  if (!databaseId || !foodDatabaseId || !recipeDatabaseId) {
    const missing = [
      ...(!databaseId ? [DB_TITLE] : []),
      ...(!foodDatabaseId ? [FOOD_DB_TITLE] : []),
      ...(!recipeDatabaseId ? [RECIPE_DB_TITLE] : []),
    ];
    const found = await walkForDatabases(token, pages.map(p => p.id), missing);
    databaseId ??= found.get(DB_TITLE) ?? null;
    foodDatabaseId ??= found.get(FOOD_DB_TITLE) ?? null;
    recipeDatabaseId ??= found.get(RECIPE_DB_TITLE) ?? null;
  }

  // 4) 确定食物数据库的父页面：跟随已有每日库的位置，否则用第一个授权页面
  let foodParentId = page.id;
  if (databaseId) {
    try {
      const dbResp = await api(token, `/v1/databases/${databaseId}`, 'GET');
      if (dbResp.ok) {
        const parent = ((await dbResp.json()) as { parent?: { page_id?: string } }).parent;
        if (parent?.page_id) foodParentId = parent.page_id;
      }
    } catch { /* 拿不到父页面就用授权页面 */ }
  }

  // 5) 缺哪个建哪个（食物/配方库创建失败不阻塞连接，之后同步时会自动重试）
  if (!databaseId) {
    databaseId = await createDatabase(token, page.id, DB_TITLE, DB_SCHEMA);
    foodParentId = page.id;
  }
  if (!foodDatabaseId) {
    try {
      foodDatabaseId = await createDatabase(token, foodParentId, FOOD_DB_TITLE, FOOD_DB_SCHEMA);
    } catch (e) {
      console.warn('创建食物数据库失败（稍后同步时会重试）:', e);
    }
  }
  // 配方明细的 relation 指向食物数据库，必须在食物数据库之后创建
  if (!recipeDatabaseId && foodDatabaseId) {
    try {
      recipeDatabaseId = await createRecipeDatabase(token, foodParentId, foodDatabaseId);
    } catch (e) {
      console.warn('创建配方明细库失败（稍后同步时会重试）:', e);
    }
  }

  return { databaseId, foodDatabaseId, recipeDatabaseId };
}

async function completeConnection(code: string, uid: string): Promise<NotionSettings> {
  const { token, workspaceName } = await exchangeCode(code);
  const { databaseId, foodDatabaseId, recipeDatabaseId } = await findOrCreateDatabases(token);
  const settings: NotionSettings = {
    workerUrl: WORKER_URL,
    token,
    databaseId,
    databaseUrl: `https://www.notion.so/${databaseId}`,
    ...(foodDatabaseId ? {
      foodDatabaseId,
      foodDatabaseUrl: `https://www.notion.so/${foodDatabaseId}`,
    } : {}),
    ...(recipeDatabaseId ? {
      recipeDatabaseId,
      recipeDatabaseUrl: `https://www.notion.so/${recipeDatabaseId}`,
    } : {}),
    ...(workspaceName ? { workspaceName } : {}),
  };
  saveNotionSettings(settings, uid);
  localStorage.setItem(JUST_CONNECTED_KEY, '1');
  return settings;
}

// ─── 入口：原生 iOS ──────────────────────────────────────────────

async function connectNotionNative(uid: string): Promise<NotionSettings> {
  const { Browser } = await import('@capacitor/browser');
  const { App } = await import('@capacitor/app');

  const clientId = await fetchClientId();
  const state = 'native-' + randomState();

  return new Promise((resolve, reject) => {
    let settled = false;
    const listenerPromise = App.addListener('appUrlOpen', async (event) => {
      if (settled || !event.url.startsWith(NATIVE_CALLBACK_PREFIX)) return;
      settled = true;
      listenerPromise.then(h => h.remove()).catch(() => {});

      try {
        await Browser.close().catch(() => {});
        const cb = new URL(event.url);
        if (cb.searchParams.get('error')) throw new Error('授权已取消');
        const code = cb.searchParams.get('code');
        if (!code) throw new Error('授权回调缺少 code');
        if (cb.searchParams.get('state') !== state) throw new Error('授权校验失败，请重试');
        resolve(await completeConnection(code, uid));
      } catch (err) {
        reject(err);
      }
    });
    listenerPromise.catch(reject);
    Browser.open({ url: buildAuthorizeUrl(clientId, state) }).catch(reject);
  });
}

// ─── 入口：Web（整页跳转） ───────────────────────────────────────

async function startNotionConnectWeb(): Promise<null> {
  const clientId = await fetchClientId();
  const state = 'web-' + randomState();
  localStorage.setItem(STATE_KEY, state);
  window.location.href = buildAuthorizeUrl(clientId, state);
  return null; // 页面即将跳转
}

/** 统一入口：原生走应用内浏览器（直接返回结果），Web 走整页跳转（返回 null） */
export async function connectNotion(uid: string): Promise<NotionSettings | null> {
  if (!WORKER_URL) throw new Error('未配置 Notion 授权服务');
  if (Capacitor.isNativePlatform()) {
    return connectNotionNative(uid);
  }
  return startNotionConnectWeb();
}

// ─── Web 回调处理（App.tsx 登录后调用一次） ──────────────────────

export interface NotionConnectEventDetail {
  ok: boolean;
  settings?: NotionSettings;
  message?: string;
}

/** 检查 URL 是否带 OAuth 回调参数；有则完成连接并广播 'notion-connect' 事件 */
export async function handleNotionOAuthRedirect(uid: string): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('notion_code');
  const state = params.get('notion_state');
  const error = params.get('notion_error');
  if (!code && !error) return;

  // 清理 URL，避免刷新时重复处理
  const clean = new URL(window.location.href);
  ['notion_code', 'notion_state', 'notion_error'].forEach(k => clean.searchParams.delete(k));
  window.history.replaceState(null, '', clean.toString());

  const savedState = localStorage.getItem(STATE_KEY);
  localStorage.removeItem(STATE_KEY);

  let detail: NotionConnectEventDetail;
  try {
    if (error) throw new Error('授权已取消');
    if (!code) throw new Error('授权回调缺少 code');
    if (!savedState || savedState !== state) throw new Error('授权校验失败，请重试');
    const settings = await completeConnection(code, uid);
    detail = { ok: true, settings };
  } catch (err) {
    detail = { ok: false, message: (err as Error).message };
    console.warn('Notion OAuth 回调处理失败:', err);
  }
  window.dispatchEvent(new CustomEvent<NotionConnectEventDetail>('notion-connect', { detail }));
}
