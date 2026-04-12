// ============================================
// Firestore 数据操作服务
// 统一的 CRUD 接口，UI 层不直接调用 Firestore
// ============================================

import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, getDocs,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { UserProfile } from '../types/user';
import type { DailyLog } from '../types/log';

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

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await withTimeout(setDoc(doc(db, USERS_COLLECTION, profile.uid), profile as DocumentData));
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
  await withTimeout(setDoc(doc(db, LOGS_COLLECTION, log.id), log as DocumentData));
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
  const docId = `${userId}_${food.id}`;
  await withTimeout(setDoc(doc(db, USER_FOODS_COLLECTION, docId), { ...food, userId }));
}
