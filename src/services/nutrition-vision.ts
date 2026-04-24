// ============================================
// 营养标签视觉识别服务
// 使用 Groq LLaMA Vision API（免费）
// API Key 由用户提供，存储在 localStorage
// ============================================

import type { ExtractedNutrition } from '../features/food-log/NutritionLabelScanner';

const LOCAL_KEY = 'nutri_groq_key';

export function getGeminiKey(): string | null {
  return localStorage.getItem(LOCAL_KEY)
    ?? localStorage.getItem('nutri_gemini_key')
    ?? localStorage.getItem('nutri_anthropic_key')
    // 若部署时注入了环境变量，所有用户自动使用该 key
    ?? (import.meta.env.VITE_GROQ_API_KEY as string | undefined)
    ?? null;
}

/** 判断当前 key 是否来自环境变量（用于隐藏"更换 key"入口） */
export function isKeyFromEnv(): boolean {
  const hasLocal = !!(localStorage.getItem(LOCAL_KEY)
    ?? localStorage.getItem('nutri_gemini_key')
    ?? localStorage.getItem('nutri_anthropic_key'));
  return !hasLocal && !!(import.meta.env.VITE_GROQ_API_KEY as string | undefined);
}

export function saveGeminiKey(key: string) {
  localStorage.setItem(LOCAL_KEY, key.trim());
}

export function clearGeminiKey() {
  localStorage.removeItem(LOCAL_KEY);
  localStorage.removeItem('nutri_gemini_key');
  localStorage.removeItem('nutri_anthropic_key');
}

const PROMPT = `你是一个专业的营养成分表识别助手。
如果标签上同时有英文和法文（或其他语言），优先读取英文内容。
请识别图片中食品包装上的营养成分表，提取所有能读取到的数据，以 JSON 格式返回（均为每100g的数据）：
{
  "name": "食物名称（从包装上识别，若无法识别填'扫描食物'）",
  "calories": 数字（kcal，若标注kJ请除以4.184换算）,
  "protein": 数字（g）,
  "carbs": 数字（g，即碳水化合物）,
  "fat": 数字（g）,
  "fiber": 数字（g，若无此项填0）,
  "sodium": 数字（mg，若标注g请乘以1000），
  "sugar": 数字（g，糖，若有则填，否则省略此字段）,
  "saturatedFat": 数字（g，饱和脂肪，若有则填，否则省略此字段）,
  "calcium": 数字（mg，钙，若标注%NRV且无绝对值则省略，否则填mg数值），
  "iron": 数字（mg，铁，同上）,
  "potassium": 数字（mg，钾，同上）,
  "vitaminC": 数字（mg，维生素C，同上）,
  "omega3": 数字（mg，omega-3，若有则填，否则省略此字段）,
  "servingLabel": "参考份量描述，如'1袋'（若有，否则省略此字段）",
  "servingGrams": 数字（参考份量的克数，若有，否则省略此字段）
}
只返回 JSON，不要任何解释。若图片不是营养成分表，返回：{"error": "无法识别"}`;

// USDA 营养素 ID 映射（每 100g）
const USDA_NUTRIENT_IDS = {
  calories: 1008,  // Energy (kcal)
  protein:  1003,  // Protein
  carbs:    1005,  // Carbohydrate, by difference
  fat:      1004,  // Total lipid (fat)
  fiber:    1079,  // Fiber, total dietary
  sodium:   1093,  // Sodium, Na
} as const;

/** 从 USDA FoodData Central 搜索并返回每 100g 营养数据，找不到时返回 null */
async function searchUSDA(query: string, usdaKey: string): Promise<ExtractedNutrition | null> {
  const url =
    `https://api.nal.usda.gov/fdc/v1/foods/search` +
    `?query=${encodeURIComponent(query)}` +
    `&api_key=${usdaKey}` +
    `&pageSize=5` +
    `&dataType=Foundation,SR%20Legacy,Branded`;

  const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!resp.ok) return null;

  const data = await resp.json() as {
    foods?: Array<{
      description: string;
      foodNutrients: Array<{ nutrientId: number; value: number }>;
    }>;
  };

  // 选卡路里最高（且合理）的结果，避免取到残缺数据
  const foods = (data.foods ?? []).filter(f => {
    const cal = f.foodNutrients.find(n => n.nutrientId === USDA_NUTRIENT_IDS.calories)?.value ?? 0;
    return cal > 10;
  });
  const food = foods[0];
  if (!food) return null;

  const getNutrient = (id: number) =>
    food.foodNutrients.find(n => n.nutrientId === id)?.value ?? 0;

  return {
    name:     food.description,
    calories: getNutrient(USDA_NUTRIENT_IDS.calories),
    protein:  getNutrient(USDA_NUTRIENT_IDS.protein),
    carbs:    getNutrient(USDA_NUTRIENT_IDS.carbs),
    fat:      getNutrient(USDA_NUTRIENT_IDS.fat),
    fiber:    getNutrient(USDA_NUTRIENT_IDS.fiber),
    sodium:   getNutrient(USDA_NUTRIENT_IDS.sodium),
  };
}

/**
 * Open Food Facts — 免费、无需 API key、收录 300 万品牌食品
 * 对西方品牌 / 超市商品（含 Costco 自有品牌）覆盖较好
 */
async function searchOpenFoodFacts(query: string): Promise<ExtractedNutrition | null> {
  const url =
    `https://world.openfoodfacts.org/cgi/search.pl` +
    `?search_terms=${encodeURIComponent(query)}` +
    `&json=1&page_size=5&sort_by=unique_scans_n`;

  const resp = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!resp.ok) return null;

  const data = await resp.json() as {
    products?: Array<{
      product_name?: string;
      nutriments?: Record<string, number>;
    }>;
  };

  // 找第一个有有效卡路里的产品
  const product = (data.products ?? []).find(p => {
    const cal = p.nutriments?.['energy-kcal_100g'] ?? 0;
    return cal > 10;
  });
  if (!product || !product.nutriments) return null;

  const n = product.nutriments;
  return {
    name:     product.product_name || query,
    calories: n['energy-kcal_100g']      ?? 0,
    protein:  n['proteins_100g']         ?? 0,
    carbs:    n['carbohydrates_100g']    ?? 0,
    fat:      n['fat_100g']              ?? 0,
    fiber:    n['fiber_100g']            ?? 0,
    sodium:   (n['sodium_100g'] ?? 0) * 1000, // Open Food Facts 钠单位是 g，转 mg
  };
}

/**
 * Tavily 网页搜索 → LLM 提取
 * 专为 AI 应用设计，返回干净的摘要文本，CORS 友好
 * 免费 1000 次/月，需 VITE_TAVILY_API_KEY
 */
async function searchWithTavilyAndExtract(
  foodName: string,
  groqKey: string,
): Promise<ExtractedNutrition | null> {
  const tavilyKey = import.meta.env.VITE_TAVILY_API_KEY as string | undefined;
  if (!tavilyKey) return null;

  const query = `${foodName} nutrition facts calories protein fat carbs per 100g`;

  let searchContent: string;
  try {
    const resp = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: tavilyKey,
        query,
        search_depth: 'basic',
        max_results: 5,
        include_answer: true,   // Tavily 会直接给一个 AI 摘要答案
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!resp.ok) return null;
    const data = await resp.json() as {
      answer?: string;
      results?: Array<{ content: string }>;
    };
    // 优先用 Tavily 的 AI 直接回答；没有就拼接前几条结果摘要
    searchContent =
      data.answer ||
      (data.results ?? []).map(r => r.content).join('\n\n').slice(0, 3000);
  } catch {
    return null;
  }

  if (!searchContent || searchContent.length < 30) return null;

  const extractPrompt =
    `从以下搜索结果中提取"${foodName}"的营养成分，换算为每100g的数值。\n` +
    `如果数据是按份量给出（如整根热狗、整个汉堡），请先确认总克重再换算。\n\n` +
    `搜索结果：\n${searchContent}\n\n` +
    `返回JSON（每100g）：\n` +
    `{"name":"食物名称","calories":数字,"protein":数字,"carbs":数字,"fat":数字,"fiber":数字,"sodium":数字}\n` +
    `只返回JSON。搜索结果中没有相关数据则返回：{"error":"未找到"}`;

  const resp2 = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 200,
      messages: [{ role: 'user', content: extractPrompt }],
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!resp2.ok) return null;

  const data2 = await resp2.json();
  const text: string = data2.choices?.[0]?.message?.content ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  let parsed: Record<string, unknown>;
  try { parsed = JSON.parse(jsonMatch[0]); } catch { return null; }
  if (parsed.error) return null;

  const cal = Number(parsed.calories) || 0;
  if (cal < 1) return null;

  return {
    name:     String(parsed.name ?? foodName),
    calories: cal,
    protein:  Number(parsed.protein) || 0,
    carbs:    Number(parsed.carbs)   || 0,
    fat:      Number(parsed.fat)     || 0,
    fiber:    Number(parsed.fiber)   || 0,
    sodium:   Number(parsed.sodium)  || 0,
  };
}

const FALLBACK_PROMPT =
  `你是专业营养数据库。给出食物每100g营养成分（中国食物按食物成分表；` +
  `餐厅/品牌食品按该品牌公开数据，按份售卖的食物换算成每100g）。\n` +
  `返回JSON：{"name":"食物名称","calories":数字,"protein":数字,"carbs":数字,"fat":数字,"fiber":数字,"sodium":数字}\n` +
  `只返回JSON，不要解释。无法估算返回：{"error":"无法估算"}`;

export async function estimateFoodNutrition(foodName: string): Promise<ExtractedNutrition> {
  const apiKey = getGeminiKey();
  if (!apiKey) throw new Error('请先填入 Groq API Key');

  // Step 1：Tavily 网页搜索（搜真实营养数据库网页，最准确）
  try {
    const tavilyResult = await searchWithTavilyAndExtract(foodName, apiKey);
    if (tavilyResult && tavilyResult.calories > 10) return tavilyResult;
  } catch { /* 网络错误 → 继续 */ }

  // Step 2：USDA FoodData Central（基础食材 + 美国品牌食品）
  const usdaKey = import.meta.env.VITE_USDA_API_KEY as string | undefined;
  if (usdaKey) {
    try {
      const usdaResult = await searchUSDA(foodName, usdaKey);
      if (usdaResult && usdaResult.calories > 10) return usdaResult;
    } catch { /* 超时 → 继续 */ }
  }

  // Step 3：Open Food Facts（全球品牌商品）
  try {
    const offResult = await searchOpenFoodFacts(foodName);
    if (offResult && offResult.calories > 10) return offResult;
  } catch { /* 超时 → 继续 */ }

  // Step 4：LLM 纯估算（最后兜底）
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 200,
      messages: [{ role: 'user', content: `${FALLBACK_PROMPT}\n\n食物名称：${foodName}` }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { error?: { message?: string } }).error?.message || `API 错误 ${response.status}`;
    throw new Error(msg);
  }

  const data = await response.json();
  const text: string = data.choices?.[0]?.message?.content ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('API 返回格式异常');
  const parsed = JSON.parse(jsonMatch[0]);
  if (parsed.error) throw new Error(parsed.error);

  return {
    name:     parsed.name     ?? foodName,
    calories: Number(parsed.calories) || 0,
    protein:  Number(parsed.protein)  || 0,
    carbs:    Number(parsed.carbs)    || 0,
    fat:      Number(parsed.fat)      || 0,
    fiber:    Number(parsed.fiber)    || 0,
    sodium:   Number(parsed.sodium)   || 0,
  };
}

export async function analyzeNutritionLabel(imageBase64: string): Promise<ExtractedNutrition> {
  const apiKey = getGeminiKey();
  if (!apiKey) {
    throw new Error('请先填入 Groq API Key');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
            {
              type: 'text',
              text: PROMPT,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { error?: { message?: string } }).error?.message || `API 错误 ${response.status}`;
    throw new Error(msg);
  }

  const data = await response.json();
  const text: string = data.choices?.[0]?.message?.content ?? '';

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('API 返回格式异常');

  const parsed = JSON.parse(jsonMatch[0]);
  if (parsed.error) throw new Error(parsed.error);

  const maybeNum = (v: unknown) => (v != null && v !== '' ? Number(v) : undefined);

  return {
    name:         parsed.name        ?? '扫描食物',
    calories:     Number(parsed.calories)  || 0,
    protein:      Number(parsed.protein)   || 0,
    carbs:        Number(parsed.carbs)     || 0,
    fat:          Number(parsed.fat)       || 0,
    fiber:        Number(parsed.fiber)     || 0,
    sodium:       Number(parsed.sodium)    || 0,
    sugar:        maybeNum(parsed.sugar),
    saturatedFat: maybeNum(parsed.saturatedFat),
    calcium:      maybeNum(parsed.calcium),
    iron:         maybeNum(parsed.iron),
    potassium:    maybeNum(parsed.potassium),
    vitaminC:     maybeNum(parsed.vitaminC),
    omega3:       maybeNum(parsed.omega3),
    servingLabel: parsed.servingLabel || undefined,
    servingGrams: parsed.servingGrams ? Number(parsed.servingGrams) : undefined,
  };
}
