// ============================================
// 家庭共享 — 类型定义
// ============================================

export interface FamilyMember {
  uid: string;
  displayName: string;
  photoURL?: string;
}

export interface Family {
  id: string;
  name: string;
  createdBy: string;       // userId
  inviteCode: string;      // 6位大写字母+数字，如 "ABC123"
  members: FamilyMember[];
  createdAt: string;
}
