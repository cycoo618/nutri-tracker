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
