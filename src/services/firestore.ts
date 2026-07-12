// ============================================
// Firestore 数据操作服务
// 统一的 CRUD 接口，UI 层不直接调用 Firestore
// ============================================

import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, getDocs,
  arrayUnion, arrayRemove, writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { UserProfile } from '../types/user';
import type { DailyLog } from '../types/log';
import type { Family, FamilyMember } from '../types/family';

// 连续超时自动降级：部分网络/浏览器组合下 Firestore 的 WebChannel 连接会静默挂起，
// 连续 2 次超时就设置 flag，下次刷新页面后 config/firebase.ts 会强制长轮询兼容模式。
const LP_FLAG = 'nt_force_longpolling';
const LP_COUNT = 'nt_timeout_count';

function recordTimeout(): string {
  if (localStorage.getItem(LP_FLAG) === '1') return ''; // 已在兼容模式
  const n = Number(localStorage.getItem(LP_COUNT) ?? '0') + 1;
  localStorage.setItem(LP_COUNT, String(n));
  if (n >= 2) {
    localStorage.setItem(LP_FLAG, '1');
    return '，已自动切换兼容连接模式——请刷新页面后重试';
  }
  return '';
}

// 所有 Firestore 操作加超时，防止连接挂起时无限等待
function withTimeout<T>(promise: Promise<T>, ms = 10000): Promise<T> {
  return Promise.race([
    promise.then(v => { localStorage.setItem(LP_COUNT, '0'); return v; }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(
        `Firestore 连接超时（${ms / 1000}s）${recordTimeout()}`
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

export async function saveUserFood(userId: string, food: DocumentData, familyId?: string): Promise<void> {
  const docId = `${userId}_${food['id']}`;
  await withTimeout(setDoc(doc(db, USER_FOODS_COLLECTION, docId), stripUndefined({ ...food, userId, familyId }) as DocumentData));
}

/** 批量保存用户食物：writeBatch 一次网络往返提交，避免几十个并行请求在慢网络下集体超时 */
export async function saveUserFoods(userId: string, foods: DocumentData[], familyId?: string): Promise<void> {
  const CHUNK = 400; // Firestore batch 上限 500 ops
  for (let i = 0; i < foods.length; i += CHUNK) {
    const batch = writeBatch(db);
    for (const food of foods.slice(i, i + CHUNK)) {
      const docId = `${userId}_${food['id']}`;
      batch.set(doc(db, USER_FOODS_COLLECTION, docId), stripUndefined({ ...food, userId, familyId }) as DocumentData);
    }
    await withTimeout(batch.commit(), 30000);
  }
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
    memberUids: [userId],
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
    memberUids: arrayUnion(userId),
  }));
  await updateUserProfile(userId, { familyId: family.id });
  return family.id;
}

/**
 * 反查用户所属家庭：用于自愈 profile 丢失 familyId 的情况
 * （家庭成员名单里有该用户，但用户档案上没有家庭 ID）
 */
export async function findFamilyIdByMember(uid: string): Promise<string | null> {
  // 快速路径：memberUids array-contains（新家庭文档都有此字段）
  try {
    const q = query(collection(db, FAMILIES_COLLECTION), where('memberUids', 'array-contains', uid));
    const snap = await withTimeout(getDocs(q));
    if (!snap.empty) return (snap.docs[0].data() as Family).id;
  } catch { /* 查询被拒或超时，走全量扫描 */ }
  // 兜底：旧家庭文档可能没有 memberUids，families 集合很小，全量扫 members
  try {
    const snap = await withTimeout(getDocs(collection(db, FAMILIES_COLLECTION)));
    for (const d of snap.docs) {
      const fam = d.data() as Family;
      if (fam.members?.some(m => m.uid === uid)) {
        // 顺手补写 memberUids，让旧家庭文档也能被安全规则和快速路径使用
        if (!fam.memberUids) {
          updateDoc(d.ref, { memberUids: fam.members.map(m => m.uid) }).catch(() => {});
        }
        return fam.id;
      }
    }
  } catch { /* 无权限或网络问题，放弃自愈 */ }
  return null;
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
      memberUids: arrayRemove(userId),
    }));
  }
  await updateUserProfile(userId, { familyId: undefined });
}

/** 将 Groq API Key 保存到家庭文档（供家庭成员共享） */
export async function saveFamilyGroqKey(familyId: string, key: string): Promise<void> {
  await withTimeout(updateDoc(doc(db, FAMILIES_COLLECTION, familyId), { groqKey: key }));
}

/** 从家庭文档获取 Groq API Key */
export async function getFamilyGroqKey(familyId: string): Promise<string | null> {
  const snap = await withTimeout(getDoc(doc(db, FAMILIES_COLLECTION, familyId)));
  if (!snap.exists()) return null;
  return (snap.data() as { groqKey?: string }).groqKey ?? null;
}

/** 获取家庭成员的食物（排除自己） */
export async function getFamilyMemberFoods(
  memberUids: string[],
  excludeUserId: string,
  familyId?: string,
): Promise<DocumentData[]> {
  const otherUids = memberUids.filter(uid => uid !== excludeUserId);
  if (otherUids.length === 0) return [];

  try {
    // 按成员 uid 逐个查询：宽松规则下可用，且能读到没写 familyId 字段的旧文档
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
  } catch (err) {
    // 严格规则下按 userId 查询无法被静态证明会整体被拒；
    // 改用 familyId 等值查询（规则可证明），再在客户端剔除自己的
    if (!familyId) throw err;
    const q = query(
      collection(db, USER_FOODS_COLLECTION),
      where('familyId', '==', familyId),
    );
    const snap = await withTimeout(getDocs(q));
    return snap.docs.map(d => d.data()).filter(f => f['userId'] !== excludeUserId);
  }
}

// ---- Notion 设置（存在用户文档里，跨设备同步） ----

export interface NotionSettingsRecord {
  workerUrl: string;
  token: string;
  databaseId: string;
  workspaceName?: string;
  databaseUrl?: string;
}

export async function saveUserNotionSettings(uid: string, settings: NotionSettingsRecord): Promise<void> {
  await withTimeout(updateDoc(doc(db, USERS_COLLECTION, uid), { notionSettings: settings }));
}

export async function getUserNotionSettings(uid: string): Promise<NotionSettingsRecord | null> {
  const snap = await withTimeout(getDoc(doc(db, USERS_COLLECTION, uid)));
  if (!snap.exists()) return null;
  return (snap.data() as { notionSettings?: NotionSettingsRecord }).notionSettings ?? null;
}

export async function deleteUserNotionSettings(uid: string): Promise<void> {
  await withTimeout(updateDoc(doc(db, USERS_COLLECTION, uid), { notionSettings: null }));
}

/** 拉取用户所有历史日志（不限日期） */
export async function getAllDailyLogs(userId: string): Promise<DailyLog[]> {
  const q = query(
    collection(db, LOGS_COLLECTION),
    where('userId', '==', userId),
    orderBy('date', 'asc'),
  );
  const snap = await withTimeout(getDocs(q), 30000);
  return snap.docs.map(d => d.data() as DailyLog);
}
