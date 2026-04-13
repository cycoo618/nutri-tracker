// ============================================
// 营养标签视觉识别服务
// 使用 Claude claude-haiku-4-5-20251001 Vision API 分析图片
// API Key 由用户自己提供，存储在 localStorage（不经过服务器）
// ============================================

import type { ExtractedNutrition } from '../features/food-log/NutritionLabelScanner';

const LOCAL_KEY = 'nutri_anthropic_key';

export function getAnthropicKey(): string | null {
  return localStorage.getItem(LOCAL_KEY);
}

export function saveAnthropicKey(key: string) {
  localStorage.setItem(LOCAL_KEY, key.trim());
}

export function clearAnthropicKey() {
  localStorage.removeItem(LOCAL_KEY);
}

const SYSTEM_PROMPT = `你是一个专业的营养成分表识别助手。
用户会上传食品包装上的营养成分表图片，你需要提取其中的数据。

请以 JSON 格式返回，字段如下（均为每100g的数据）：
{
  "name": "食物名称（从包装上识别，若无法识别填'扫描食物'）",
  "calories": 数字（kcal，若标注kJ请除以4.184换算）,
  "protein": 数字（g）,
  "carbs": 数字（g，即碳水化合物）,
  "fat": 数字（g）,
  "fiber": 数字（g，若无此项填0）,
  "sodium": 数字（mg，若标注g请乘以1000）,
  "servingLabel": "参考份量描述，如'1袋'或'1份'（若有）",
  "servingGrams": 数字（参考份量的克数，若有）
}

只返回 JSON，不要有任何解释文字。若图片无法识别或不是营养成分表，返回：{"error": "无法识别"}`;

export async function analyzeNutritionLabel(imageBase64: string): Promise<ExtractedNutrition> {
  const apiKey = getAnthropicKey();
  if (!apiKey) {
    throw new Error('请先在设置中填入 Anthropic API Key');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-allow-browser': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: '请识别这张营养成分表并返回 JSON 数据。',
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
  const text: string = data.content?.[0]?.text ?? '';

  // 提取 JSON（可能被 markdown 包裹）
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('API 返回格式异常');

  const parsed = JSON.parse(jsonMatch[0]);
  if (parsed.error) throw new Error(parsed.error);

  return {
    name:          parsed.name         ?? '扫描食物',
    calories:      Number(parsed.calories)  || 0,
    protein:       Number(parsed.protein)   || 0,
    carbs:         Number(parsed.carbs)     || 0,
    fat:           Number(parsed.fat)       || 0,
    fiber:         Number(parsed.fiber)     || 0,
    sodium:        Number(parsed.sodium)    || 0,
    servingLabel:  parsed.servingLabel  || undefined,
    servingGrams:  parsed.servingGrams ? Number(parsed.servingGrams) : undefined,
  };
}
