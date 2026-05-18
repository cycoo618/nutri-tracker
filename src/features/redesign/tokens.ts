// Food group data (used across DiaryHome, GardenHome, DiversityScreen)
export const FOOD_GROUPS = [
  { key: 'veg',   emoji: '🥬', name: '蔬菜',    v: 0,   t: 350, range: '300–500 g', daysAgo: 2, color: 'var(--veg)'  },
  { key: 'fruit', emoji: '🍎', name: '水果',    v: 20,  t: 250, range: '200–350 g', daysAgo: 0, color: 'var(--fruit)' },
  { key: 'grain', emoji: '🌾', name: '全谷物',  v: 215, t: 75,  range: '50–150 g',  daysAgo: 0, color: 'var(--grain)', done: true },
  { key: 'bean',  emoji: '🫘', name: '豆类',    v: 25,  t: 150, range: '≈150 g 豆腐', daysAgo: 0, color: 'var(--bean)' },
  { key: 'nut',   emoji: '🥜', name: '坚果',    v: 0,   t: 30,  range: '25–35 g',   daysAgo: 2, color: 'var(--nut)'  },
  { key: 'fish',  emoji: '🐟', name: '鱼/海鲜', v: 2,   t: 2,   range: '2 次/周',   daysAgo: 0, color: 'var(--fish)', done: true, isCount: true },
  { key: 'ferm',  emoji: '🫙', name: '发酵食品', v: 0,   t: 150, range: '每天一份',   daysAgo: 7, color: 'var(--ferm)' },
];

export type GoalOption = {
  key: string;
  emoji: string;
  name: string;
  desc: string;
  color: string;
};

export const GOAL_OPTIONS: GoalOption[] = [
  { key: 'fat_loss',          emoji: '🔥', name: '减脂',  desc: '温和热量缺口，可持续减脂，避免暴饮暴食', color: 'var(--tomato)' },
  { key: 'anti_inflammatory', emoji: '🫒', name: '抗炎',  desc: '地中海饮食为基础，关注抗炎食物、Omega-3 和多样蔬果', color: 'var(--moss)' },
  { key: 'muscle_gain',       emoji: '💪', name: '增肌',  desc: '适当增加蛋白质和优质碳水，支撑肌肉生长', color: 'var(--mustard)' },
  { key: 'blood_sugar',       emoji: '🩸', name: '控血糖', desc: '关注 GI 值，优先低GI食物，稳定全天血糖波动', color: 'var(--plum)' },
];
