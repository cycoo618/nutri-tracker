// ============================================
// 血糖记录类型 & 达标范围（控血糖目标专用）
// 独立数据实体，与饮食日志解耦
// ============================================

/** 血糖单位 */
export type GlucoseUnit = 'mmol/L' | 'mg/dL';

/** 测量场景 */
export type MeasureContext =
  | 'fasting'       // 空腹
  | 'pre_meal'      // 餐前
  | 'post_meal_2h'  // 餐后 2h
  | 'bedtime'       // 睡前
  | 'random';       // 随机

/** 单次血糖读数 */
export interface BloodSugarReading {
  id: string;               // generateId()
  userId: string;
  value: number;            // 血糖值（单位见 unit）
  unit: GlucoseUnit;        // 默认 'mmol/L'
  context: MeasureContext;  // 测量场景
  measuredAt: string;       // ISO timestamp，用于排序 / 趋势 X 轴
  date: string;             // "YYYY-MM-DD"，冗余，用于按天查询与本地缓存
  tookMedication?: boolean; // 本次（餐前）是否服用降糖药
  medicationNote?: string;  // 可选：药名 / 剂量
  note?: string;            // 可选备注
  notionPageId?: string;    // 预留：Notion 同步用
  createdAt: string;
  updatedAt: string;
}

/** 场景元数据（标签 + 录入顺序 + emoji） */
export const CONTEXT_META: Record<MeasureContext, { label: string; emoji: string }> = {
  fasting:      { label: '空腹',   emoji: '🌅' },
  pre_meal:     { label: '餐前',   emoji: '🍽️' },
  post_meal_2h: { label: '餐后2h', emoji: '⏱️' },
  bedtime:      { label: '睡前',   emoji: '🌙' },
  random:       { label: '随机',   emoji: '🎲' },
};

/** 录入 UI 里 chip 的固定顺序 */
export const CONTEXT_ORDER: MeasureContext[] = ['fasting', 'pre_meal', 'post_meal_2h', 'bedtime', 'random'];

// ── 达标范围（以 mmol/L 为基准，控糖人群常用目标）──────────────────
// 数值集中一处，日后可调。mg/dL = mmol/L × 18。

export type GlucoseStatus = 'low' | 'normal' | 'high';

/** 每个场景的达标区间（mmol/L）；normal = [normalLow, high) */
const TARGETS_MMOL: Record<MeasureContext, { low: number; high: number }> = {
  // 偏低统一 < 3.9；空腹/餐前达标 4.4–7.0
  fasting:      { low: 3.9, high: 7.0 },
  pre_meal:     { low: 3.9, high: 7.0 },
  // 餐后 2h 达标 < 10.0
  post_meal_2h: { low: 3.9, high: 10.0 },
  // 睡前达标 5.0–8.3
  bedtime:      { low: 3.9, high: 8.3 },
  // 随机达标 < 11.1
  random:       { low: 3.9, high: 11.1 },
};

/** 单位换算：把任意单位的值换算成 mmol/L */
export function toMmol(value: number, unit: GlucoseUnit): number {
  return unit === 'mg/dL' ? value / 18 : value;
}

/**
 * 判断一次读数相对于其场景的达标状态。
 * low = 偏低（蓝），normal = 达标（绿），high = 偏高（红）
 */
export function getGlucoseStatus(value: number, context: MeasureContext, unit: GlucoseUnit): GlucoseStatus {
  const v = toMmol(value, unit);
  const { low, high } = TARGETS_MMOL[context];
  if (v < low) return 'low';
  if (v >= high) return 'high';
  return 'normal';
}

/** 达标状态对应的 design-token 颜色 */
export const STATUS_COLOR: Record<GlucoseStatus, string> = {
  low:    'var(--sky)',
  normal: 'var(--sage)',
  high:   'var(--tomato)',
};

export const STATUS_LABEL: Record<GlucoseStatus, string> = {
  low:    '偏低',
  normal: '达标',
  high:   '偏高',
};

/** 达标区间文字，用于卡片提示，如 "空腹 4.4–7.0" */
export function targetHint(context: MeasureContext): string {
  const { label } = CONTEXT_META[context];
  switch (context) {
    case 'fasting':
    case 'pre_meal':     return `${label}达标 4.4–7.0`;
    case 'post_meal_2h': return `${label}达标 < 10.0`;
    case 'bedtime':      return `${label}达标 5.0–8.3`;
    case 'random':       return `${label}达标 < 11.1`;
  }
}
