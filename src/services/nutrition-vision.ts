// ============================================
// 营养标签视觉识别服务
// 使用 Google Gemini Vision API 分析图片（免费）
// API Key 由用户提供，存储在 localStorage
// ============================================

import type { ExtractedNutrition } from '../features/food-log/NutritionLabelScanner';

const LOCAL_KEY = 'nutri_gemini_key';

export function getGeminiKey(): string | null {
  return localStorage.getItem(LOCAL_KEY);
}

export function saveGeminiKey(key: string) {
  localStorage.setItem(LOCAL_KEY, key.trim());
}

export function clearGeminiKey() {
  localStorage.removeItem(LOCAL_KEY);
}

const PROMPT = `你是一个专业的营养成分表识别助手。
请识别图片中食品包装上的营养成分表，提取数据并以 JSON 格式返回（均为每100g的数据）：
{
  "name": "食物名称（从包装上识别，若无法识别填'扫描食物'）",
  "calories": 数字（kcal，若标注kJ请除以4.184换算）,
  "protein": 数字（g）,
  "carbs": 数字（g，即碳水化合物）,
  "fat": 数字（g）,
  "fiber": 数字（g，若无此项填0）,
  "sodium": 数字（mg，若标注g请乘以1000）,
  "servingLabel": "参考份量描述，如'1袋'（若有，否则省略此字段）",
  "servingGrams": 数字（参考份量的克数，若有，否则省略此字段）
}
只返回 JSON，不要任何解释。若图片不是营养成分表，返回：{"error": "无法识别"}`;

export async function analyzeNutritionLabel(imageBase64: string): Promise<ExtractedNutrition> {
  const apiKey = getGeminiKey();
  if (!apiKey) {
    throw new Error('请先填入 Gemini API Key');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: imageBase64,
            },
          },
          { text: PROMPT },
        ],
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: 512,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { error?: { message?: string } }).error?.message || `API 错误 ${response.status}`;
    throw new Error(msg);
  }

  const data = await response.json();
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('API 返回格式异常');

  const parsed = JSON.parse(jsonMatch[0]);
  if (parsed.error) throw new Error(parsed.error);

  return {
    name:         parsed.name           ?? '扫描食物',
    calories:     Number(parsed.calories)    || 0,
    protein:      Number(parsed.protein)     || 0,
    carbs:        Number(parsed.carbs)       || 0,
    fat:          Number(parsed.fat)         || 0,
    fiber:        Number(parsed.fiber)       || 0,
    sodium:       Number(parsed.sodium)      || 0,
    servingLabel: parsed.servingLabel        || undefined,
    servingGrams: parsed.servingGrams ? Number(parsed.servingGrams) : undefined,
  };
}
