// ============================================
// 营养标签视觉识别服务
// 使用 Groq LLaMA Vision API（免费）
// API Key 由用户提供，存储在 localStorage
// ============================================

import type { ExtractedNutrition } from '../features/food-log/NutritionLabelScanner';

const LOCAL_KEY = 'nutri_groq_key';

export function getGroqKey(): string | null {
  return localStorage.getItem(LOCAL_KEY)
    // 若部署时注入了环境变量，所有用户自动使用该 key
    ?? (import.meta.env.VITE_GROQ_API_KEY as string | undefined)
    ?? null;
}

/** 判断当前 key 是否来自环境变量（用于隐藏"更换 key"入口） */
export function isKeyFromEnv(): boolean {
  return !localStorage.getItem(LOCAL_KEY)
    && !!(import.meta.env.VITE_GROQ_API_KEY as string | undefined);
}

export function saveGroqKey(key: string) {
  localStorage.setItem(LOCAL_KEY, key.trim());
}

export function clearGroqKey() {
  localStorage.removeItem(LOCAL_KEY);
}

const PROMPT = `You are a nutrition label reader. Read the label in the image.
If the label has multiple languages, prefer English.

Step 1: Find the serving size (e.g. "1 serving (85g)", "per 28g", "每份 30g"). Extract the serving weight in grams as "serving_g". If no serving is listed, use 100.
Step 2: Read ALL nutrient values EXACTLY as printed for that serving size. Do NOT convert to per-100g — return the raw numbers from the label.
Step 3: Extract the food name from the package.

CRITICAL RULES:
- "fat" = TOTAL fat (the main "Fat" / "Total Fat" row). Do NOT use the saturated fat sub-row for this field.
- "saturatedFat" = the "Saturated" / "Saturated Fat" sub-row only.
- These are two separate rows on the label. Read each independently.
- If a bilingual label shows the same nutrient twice (e.g. English + French), read it once.

Return ONLY this JSON:
{
  "name": "product name (or '扫描食物' if unreadable)",
  "serving_g": number (grams per serving from the label),
  "serving_label": "serving description e.g. '1片' or '1 cup'" (omit if none),
  "calories": number (kcal for the serving; if kJ divide by 4.184),
  "protein": number (g),
  "carbs": number (g, total carbohydrate),
  "fat": number (g, TOTAL fat — not saturated fat),
  "fiber": number (g, 0 if not listed),
  "sodium": number (mg; if listed in g multiply by 1000),
  "sugar": number (g, omit if not listed),
  "saturatedFat": number (g, saturated fat sub-row only, omit if not listed),
  "calcium": number (mg, omit if only %DV),
  "iron": number (mg, omit if only %DV),
  "potassium": number (mg, omit if only %DV),
  "magnesium": number (mg, omit if only %DV),
  "zinc": number (mg, omit if only %DV),
  "vitaminA": number (μg RAE, omit if only %DV),
  "vitaminC": number (mg, omit if only %DV),
  "vitaminD": number (μg, omit if only %DV),
  "vitaminE": number (mg, omit if only %DV),
  "vitaminB1": number (mg thiamine, omit if only %DV),
  "vitaminB2": number (mg riboflavin, omit if only %DV),
  "cholesterol": number (mg, omit if not listed),
  "transFat": number (g, omit if not listed),
  "omega3": number (mg, omit if not listed)
}
Only JSON. If not a nutrition label return: {"error": "无法识别"}`;

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
 * 让 LLM 按份量回答（它更擅长这个），我们自己做 per-100g 换算
 * 避免让模型心算"570kcal ÷ 235g × 100"这种容易出错的步骤
 */
async function estimateByServing(
  foodName: string,
  groqKey: string,
): Promise<ExtractedNutrition | null> {
  const prompt =
    `You are a nutrition database. For the food: "${foodName}"\n\n` +
    `Step 1: Identify the standard serving (restaurant items = one order; packaged = labeled serving).\n` +
    `Step 2: Provide the nutrition for THAT serving.\n\n` +
    `Return ONLY JSON:\n` +
    `{"name":"food name","serving_g":weight_of_serving_in_grams,"kcal":total_calories,"protein_g":number,"carbs_g":number,"fat_g":number,"fiber_g":number,"sodium_mg":number}\n` +
    `Only JSON, no explanation. If unknown return {"error":"unknown"}.`;

  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!resp.ok) return null;

  const data = await resp.json();
  const text: string = data.choices?.[0]?.message?.content ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  let parsed: Record<string, unknown>;
  try { parsed = JSON.parse(jsonMatch[0]); } catch { return null; }
  if (parsed.error) return null;

  const servingG = Number(parsed.serving_g) || 0;
  const kcal     = Number(parsed.kcal)      || 0;
  if (servingG < 1 || kcal < 1) return null;

  // 换算成每 100g（我们做数学，不让 LLM 算）
  const per100 = (v: number) => Math.round(v / servingG * 100 * 10) / 10;

  return {
    name:         String(parsed.name ?? foodName),
    calories:     per100(kcal),
    protein:      per100(Number(parsed.protein_g) || 0),
    carbs:        per100(Number(parsed.carbs_g)   || 0),
    fat:          per100(Number(parsed.fat_g)     || 0),
    fiber:        per100(Number(parsed.fiber_g)   || 0),
    sodium:       per100(Number(parsed.sodium_mg) || 0),
    // 保留份量信息，让调用方可以直接加 serving size，用户不用想"多少克"
    servingLabel: `1份 (${Math.round(servingG)}g)`,
    servingGrams: servingG,
  };
}

export async function estimateFoodNutrition(foodName: string): Promise<ExtractedNutrition> {
  const apiKey = getGroqKey();
  if (!apiKey) throw new Error('请先填入 Groq API Key');

  // Step 1：LLM 按份量估算 → 我们换算 per-100g（比直接问 per-100g 准确）
  try {
    const servingResult = await estimateByServing(foodName, apiKey);
    if (servingResult && servingResult.calories > 10) return servingResult;
  } catch { /* 失败 → 继续 */ }

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

  // Step 4：所有来源都失败，抛出错误让用户手动添加
  throw new Error('无法获取该食物的营养数据，请手动添加');
}

// ── 食物照片识别 ──────────────────────────────────────────────────────

export interface RecognizedFood {
  foodName: string;
  estimatedGrams: number;
  portionDescription: string;
}

const FOOD_PHOTO_PROMPT = `你是食物识别专家。分析图片中的食物。

返回 ONLY JSON，不要其他文字：
{
  "foodName": "食物中文名（如：白米饭、烤鸡腿、苹果）",
  "estimatedGrams": 估算克数（整数）,
  "portionDescription": "简短份量描述（如：一碗、半盘、1只）"
}

估算规则：
- 普通碗装米饭 ≈ 150-200g；炒菜一人份 ≈ 150-250g；餐厅主菜 ≈ 200-350g
- 多种食物时，取最主要的一种或整体命名
- 无法识别时返回 {"error": "无法识别食物"}`;

export async function recognizeFoodPhoto(imageBase64: string): Promise<RecognizedFood> {
  const apiKey = getGroqKey();
  if (!apiKey) throw new Error('请先填入 Groq API Key');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      max_tokens: 200,
      messages: [{ role: 'user', content: [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
        { type: 'text', text: FOOD_PHOTO_PROMPT },
      ]}],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message || `API 错误 ${response.status}`);
  }

  const data = await response.json();
  const text: string = data.choices?.[0]?.message?.content ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('API 返回格式异常');

  const parsed = JSON.parse(jsonMatch[0]);
  if (parsed.error) throw new Error(parsed.error);

  const foodName = String(parsed.foodName ?? '').trim();
  const estimatedGrams = Math.round(Number(parsed.estimatedGrams) || 150);
  const portionDescription = String(parsed.portionDescription ?? '1份').trim();

  if (!foodName) throw new Error('无法识别食物名称');
  if (estimatedGrams < 1 || estimatedGrams > 5000) throw new Error('重量估算异常，请重试');

  return { foodName, estimatedGrams, portionDescription };
}

export async function analyzeNutritionLabel(imageBase64: string): Promise<ExtractedNutrition> {
  const apiKey = getGroqKey();
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

  const servingG = Number(parsed.serving_g) || 100;
  // Scale raw per-serving values to per-100g — we do the math, not the AI
  const per100 = (v: unknown) => v != null && v !== '' ? Math.round(Number(v) / servingG * 100 * 10) / 10 : undefined;
  const per100req = (v: unknown) => Math.round((Number(v) || 0) / servingG * 100 * 10) / 10;

  return {
    name:         parsed.name        ?? '扫描食物',
    calories:     per100req(parsed.calories),
    protein:      per100req(parsed.protein),
    carbs:        per100req(parsed.carbs),
    fat:          per100req(parsed.fat),
    fiber:        per100req(parsed.fiber),
    sodium:       per100req(parsed.sodium),
    sugar:        per100(parsed.sugar),
    saturatedFat: per100(parsed.saturatedFat),
    vitaminA:     per100(parsed.vitaminA),
    vitaminC:     per100(parsed.vitaminC),
    vitaminD:     per100(parsed.vitaminD),
    vitaminE:     per100(parsed.vitaminE),
    vitaminB1:    per100(parsed.vitaminB1),
    vitaminB2:    per100(parsed.vitaminB2),
    calcium:      per100(parsed.calcium),
    iron:         per100(parsed.iron),
    potassium:    per100(parsed.potassium),
    magnesium:    per100(parsed.magnesium),
    zinc:         per100(parsed.zinc),
    cholesterol:  per100(parsed.cholesterol),
    transFat:     per100(parsed.transFat),
    omega3:       per100(parsed.omega3),
    servingLabel: parsed.serving_label || undefined,
    servingGrams: servingG !== 100 ? servingG : undefined,
  };
}
