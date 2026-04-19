// ============================================
// 用户相关类型定义
// ============================================

/** 目标类型 */
export type GoalType = 'fat_loss' | 'muscle_gain' | 'healthy_eating' | 'blood_sugar';

/** 目标类型中文映射 */
export const GOAL_LABELS: Record<GoalType, string> = {
  fat_loss: '减脂',
  muscle_gain: '增肌',
  healthy_eating: '健康饮食',
  blood_sugar: '降血糖',
};

/** 目标类型描述 */
export const GOAL_DESCRIPTIONS: Record<GoalType, string> = {
  fat_loss: '温和热量缺口，避免暴饮暴食，可持续减脂',
  muscle_gain: '适当增加蛋白质和优质碳水，支撑肌肉生长',
  healthy_eating: '均衡饮食，关注抗炎、控糖等高级营养指标',
  blood_sugar: '关注 GI 值，优先低GI食物，控制血糖波动',
};

/** 活动水平 */
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

/** 活动水平中文映射 + TDEE 系数 */
export const ACTIVITY_LEVELS: Record<ActivityLevel, { label: string; factor: number; description: string }> = {
  sedentary:    { label: '久坐不动', factor: 1.2,  description: '几乎不运动，办公室工作' },
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
  readFromHealth: boolean;   // 从健康 App 读取运动数据
  writeToHealth: boolean;    // 将饮食记录写入健康 App（营养数据）
}

/** 用户身体数据 */
export interface BodyMetrics {
  height: number;           // cm
  weight: number;           // kg
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  bodyFat?: number;         // 体脂率 %（可选，填写后使用更精准的 Katch-McArdle 公式）
}

/** 用户档案 */
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bodyMetrics?: BodyMetrics;
  goal: GoalType;
  targetCalories: number;
  targetCaloriesMode: CalorieTargetMode;
  // --- 健康数据同步（未来手机 App 开放） ---
  healthSync: HealthSyncSettings;
  // --- 付费功能参数 ---
  premiumEnabled: boolean;
  // --- 家庭共享 ---
  familyId?: string;
  // --- 时间戳 ---
  createdAt: string;
  updatedAt: string;
}

/** 默认用户配置 */
export const DEFAULT_USER_PROFILE: Partial<UserProfile> = {
  goal: 'healthy_eating',
  targetCalories: 2000,
  targetCaloriesMode: 'auto',
  healthSync: { readFromHealth: false, writeToHealth: false },
  premiumEnabled: true,
};
