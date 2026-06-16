// ============================================
// 用户相关类型定义
// ============================================

/** 目标类型 */
export type GoalType = 'fat_loss' | 'muscle_gain' | 'anti_inflammatory' | 'blood_sugar';

/** 互斥目标组（组内只能选其一） */
export const GOAL_MUTEX_GROUPS: GoalType[][] = [
  ['fat_loss', 'muscle_gain'],
];

/** 目标类型中文映射 */
export const GOAL_LABELS: Record<GoalType, string> = {
  fat_loss:           '减脂',
  muscle_gain:        '增肌',
  anti_inflammatory:  '抗炎',
  blood_sugar:        '控血糖',
};

/** 目标类型描述 */
export const GOAL_DESCRIPTIONS: Record<GoalType, string> = {
  fat_loss:           '温和热量缺口，可持续减脂，避免暴饮暴食',
  muscle_gain:        '适当增加蛋白质和优质碳水，支撑肌肉生长',
  anti_inflammatory:  '地中海饮食为基础，关注抗炎食物、Omega-3 和多样蔬果',
  blood_sugar:        '关注 GI 值，优先低GI食物，稳定全天血糖波动',
};

/** 目标图标 */
export const GOAL_ICONS: Record<GoalType, string> = {
  fat_loss:           '🔥',
  muscle_gain:        '💪',
  anti_inflammatory:  '🫒',
  blood_sugar:        '🩸',
};

/** 活动水平 */
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

/** 活动水平中文映射 + TDEE 系数 */
export const ACTIVITY_LEVELS: Record<ActivityLevel, { label: string; factor: number; description: string }> = {
  sedentary:    { label: '久坐不动', factor: 1.2,   description: '几乎不运动，办公室工作' },
  light:        { label: '轻度活动', factor: 1.375, description: '每周轻度运动 1-3 天' },
  moderate:     { label: '中度活动', factor: 1.55,  description: '每周中等强度运动 3-5 天' },
  active:       { label: '高度活动', factor: 1.725, description: '每周高强度运动 6-7 天' },
  very_active:  { label: '极高活动', factor: 1.9,   description: '每天高强度运动或体力劳动' },
};

/** 性别 */
export type Gender = 'male' | 'female';

/** 卡路里目标模式 */
export type CalorieTargetMode = 'auto' | 'manual';

/** 健康数据同步设置（未来手机 App 使用） */
export interface HealthSyncSettings {
  readFromHealth: boolean;
  writeToHealth: boolean;
}

/** 用户身体数据 */
export interface BodyMetrics {
  height: number;
  weight: number;
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  bodyFat?: number;
}

/** 用户档案 */
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bodyMetrics?: BodyMetrics;
  /** 主目标（向后兼容，取 goals[0]）*/
  goal: GoalType;
  /** 多目标列表（新字段，优先使用） */
  goals?: GoalType[];
  targetCalories: number;
  targetCaloriesMode: CalorieTargetMode;
  healthSync: HealthSyncSettings;
  premiumEnabled: boolean;
  familyId?: string;
  createdAt: string;
  updatedAt: string;
}

const VALID_GOALS = new Set<string>(['fat_loss', 'muscle_gain', 'anti_inflammatory', 'blood_sugar']);

/** 获取用户实际目标列表（兼容旧数据只有 goal 字段的情况） */
export function getActiveGoals(profile: Pick<UserProfile, 'goal' | 'goals'>): GoalType[] {
  if (profile.goals && profile.goals.length > 0) {
    const valid = profile.goals.filter(g => VALID_GOALS.has(g));
    if (valid.length > 0) return valid;
  }
  // 旧数据迁移：healthy_eating → anti_inflammatory
  const g = profile.goal === ('healthy_eating' as GoalType) ? 'anti_inflammatory' : profile.goal;
  if (g && VALID_GOALS.has(g)) return [g];
  return ['anti_inflammatory']; // 数据损坏时的安全兜底
}

/** 默认用户配置 */
export const DEFAULT_USER_PROFILE: Partial<UserProfile> = {
  goal: 'anti_inflammatory',
  goals: ['anti_inflammatory'],
  targetCalories: 2000,
  targetCaloriesMode: 'auto',
  healthSync: { readFromHealth: false, writeToHealth: false },
  premiumEnabled: true,
};
