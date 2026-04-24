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
  const apiKey = getGeminiKey();
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
