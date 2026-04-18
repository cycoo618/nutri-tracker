// ============================================
// Firestore 数据操作服务
// 统一的 CRUD 接口，UI 层不直接调用 Firestore
// ============================================

import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, getDocs,
  arrayUnion, arrayRemove,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { UserProfile } from '../types/user';
import type { DailyLog } from '../types/log';
import type { Family, FamilyMember } from '../types/family';

// 所有 Firestore 操作加超时，防止规则拒绝时无限挂起
function withTimeout<T>(promise: Promise<T>, ms = 10000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(
        `Firestore 连接超时（${ms / 1000}s）\n\n` +
        `请在 Firebase Console 确认以下步骤：\n` +
        `① Firestore Database → Rules → 粘贴新规则 → 点击 Publish\n` +
        `② 规则生效需约 1 分钟，请稍后再试\n\n` +
        `调试规则（临时）：\n` +
        `allow read, write: if request.auth != null;`
      )), ms)
    ),
  ]);
}

// ---- 用户档案 ----

const USERS_COLLECTION = 'users';

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await withTimeout(getDoc(doc(db, USERS_COLLECTION, uid)));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

/** 递归删除对象中所有 undefined 字段（Firestore 不接受 undefined） */
function stripUndefined<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await withTimeout(setDoc(doc(db, USERS_COLLECTION, profile.uid), stripUndefined(profile) as DocumentData));
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfile>,
): Promise<void> {
  await withTimeout(updateDoc(doc(db, USERS_COLLECTION, uid), {
    ...updates,
    updatedAt: new Date().toISOString(),
  } as DocumentData));
}

// ---- 饮食记录 ----

const LOGS_COLLECTION = 'dailyLogs';

export async function getDailyLog(userId: string, date: string): Promise<DailyLog | null> {
  const docId = `${userId}_${date}`;
  const snap = await withTimeout(getDoc(doc(db, LOGS_COLLECTION, docId)));
  return snap.exists() ? (snap.data() as DailyLog) : null;
}

export async function saveDailyLog(log: DailyLog): Promise<void> {
  await withTimeout(setDoc(doc(db, LOGS_COLLECTION, log.id), stripUndefined(log) as DocumentData));
}

export async function getDailyLogs(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<DailyLog[]> {
  const q = query(
    collection(db, LOGS_COLLECTION),
    where('userId', '==', userId),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'desc'),
  );
  const snap = await withTimeout(getDocs(q));
  return snap.docs.map(d => d.data() as DailyLog);
}

export async function deleteDailyLog(userId: string, date: string): Promise<void> {
  const docId = `${userId}_${date}`;
  await withTimeout(deleteDoc(doc(db, LOGS_COLLECTION, docId)));
}

// ---- 用户自定义食物库 ----

const USER_FOODS_COLLECTION = 'userFoods';

export async function getUserFoods(userId: string) {
  const q = query(
    collection(db, USER_FOODS_COLLECTION),
    where('userId', '==', userId),
  );
  const snap = await withTimeout(getDocs(q));
  return snap.docs.map(d => d.data());
}

export async function saveUserFood(userId: string, food: DocumentData): Promise<void> {
  const docId = `${userId}_${food['id']}`;
  await withTimeout(setDoc(doc(db, USER_FOODS_COLLECTION, docId), stripUndefined({ ...food, userId }) as DocumentData));
}

export async function deleteUserFood(userId: string, foodId: string): Promise<void> {
  const docId = `${userId}_${foodId}`;
  await withTimeout(deleteDoc(doc(db, USER_FOODS_COLLECTION, docId)));
}

// ---- 家庭共享 ----
// Firestore 安全规则说明：
//   families 集合需要：allow read, write: if request.auth != null;
//   userFoods 集合的读权限已允许已认证用户，可以读取家庭成员食物。

const FAMILIES_COLLECTION = 'families';

/** 生成随机 6 字符大写邀请码（字母+数字） */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 排除易混淆字符
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/** 检查邀请码是否已被使用 */
async function isInviteCodeTaken(code: string): Promise<boolean> {
  const q = query(collection(db, FAMILIES_COLLECTION), where('inviteCode', '==', code));
  const snap = await withTimeout(getDocs(q));
  return !snap.empty;
}

/** 生成唯一邀请码（碰撞时重试） */
async function generateUniqueInviteCode(): Promise<string> {
  let code = generateInviteCode();
  let attempts = 0;
  while (attempts < 5 && await isInviteCodeTaken(code)) {
    code = generateInviteCode();
    attempts++;
  }
  return code;
}

/** 创建新家庭，返回 familyId */
export async function createFamily(
  userId: string,
  userName: string,
  familyName: string,
): Promise<string> {
  const inviteCode = await generateUniqueInviteCode();
  const familyId = `family_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const member: FamilyMember = { uid: userId, displayName: userName };
  const family: Family = {
    id: familyId,
    name: familyName,
    createdBy: userId,
    inviteCode,
    members: [member],
    createdAt: new Date().toISOString(),
  };
  await withTimeout(setDoc(doc(db, FAMILIES_COLLECTION, familyId), stripUndefined(family) as DocumentData));
  // 同时更新用户档案 familyId
  await updateUserProfile(userId, { familyId });
  return familyId;
}

/** 通过邀请码加入家庭，返回 familyId */
export async function joinFamilyByCode(
  userId: string,
  userName: string,
  inviteCode: string,
): Promise<string> {
  const upperCode = inviteCode.trim().toUpperCase();
  const q = query(collection(db, FAMILIES_COLLECTION), where('inviteCode', '==', upperCode));
  const snap = await withTimeout(getDocs(q));
  if (snap.empty) {
    throw new Error('邀请码不存在，请检查后重试');
  }
  const familyDoc = snap.docs[0];
  const family = familyDoc.data() as Family;
  const alreadyMember = family.members.some(m => m.uid === userId);
  if (alreadyMember) {
    // 已是成员，直接返回
    return family.id;
  }
  const newMember: FamilyMember = { uid: userId, displayName: userName };
  await withTimeout(updateDoc(doc(db, FAMILIES_COLLECTION, family.id), {
    members: arrayUnion(newMember),
  }));
  await updateUserProfile(userId, { familyId: family.id });
  return family.id;
}

/** 获取家庭数据 */
export async function getFamily(familyId: string): Promise<Family | null> {
  const snap = await withTimeout(getDoc(doc(db, FAMILIES_COLLECTION, familyId)));
  return snap.exists() ? (snap.data() as Family) : null;
}

/** 退出家庭；如果是最后一个成员则删除家庭文档 */
export async function leaveFamily(userId: string, familyId: string): Promise<void> {
  const snap = await withTimeout(getDoc(doc(db, FAMILIES_COLLECTION, familyId)));
  if (!snap.exists()) {
    await updateUserProfile(userId, { familyId: undefined });
    return;
  }
  const family = snap.data() as Family;
  const memberToRemove = family.members.find(m => m.uid === userId);
  if (!memberToRemove) {
    await updateUserProfile(userId, { familyId: undefined });
    return;
  }
  const remaining = family.members.filter(m => m.uid !== userId);
  if (remaining.length === 0) {
    // 最后一个成员，删除家庭文档
    await withTimeout(deleteDoc(doc(db, FAMILIES_COLLECTION, familyId)));
  } else {
    await withTimeout(updateDoc(doc(db, FAMILIES_COLLECTION, familyId), {
      members: arrayRemove(memberToRemove),
    }));
  }
  await updateUserProfile(userId, { familyId: undefined });
}

/** 获取家庭成员的食物（排除自己），返回带 ownerName 的扁平数组 */
export async function getFamilyMemberFoods(
  memberUids: string[],
  excludeUserId: string,
): Promise<DocumentData[]> {
  const otherUids = memberUids.filter(uid => uid !== excludeUserId);
  if (otherUids.length === 0) return [];

  const results = await Promise.all(
    otherUids.map(async uid => {
      const q = query(
        collection(db, USER_FOODS_COLLECTION),
        where('userId', '==', uid),
      );
      const snap = await withTimeout(getDocs(q));
      return snap.docs.map(d => d.data());
    }),
  );
  return results.flat();
}
