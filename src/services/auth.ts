// ============================================
// 认证服务
// 支持 Google / Apple 登录，未来可扩展邮箱密码
// popup 被拦截时自动降级为 redirect
// ============================================

import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
  type AuthProvider,
} from 'firebase/auth';
import { auth, googleProvider, appleProvider } from '../config/firebase';

export type AuthUser = User;

/** 通用登录：优先 popup，被拦截时降级为 redirect */
async function signInWith(provider: AuthProvider): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user') {
      // 降级为 redirect（页面会跳转，结果由 onAuthChange 处理）
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw err;
  }
}

/** Google 登录 */
export async function signInWithGoogle(): Promise<User | null> {
  return signInWith(googleProvider);
}

/** Apple 登录 */
export async function signInWithApple(): Promise<User | null> {
  return signInWith(appleProvider);
}

/** 登出 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/** 监听认证状态变化（含 redirect 回调处理） */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  // 处理 redirect 登录回来的结果
  getRedirectResult(auth).catch(() => {
    // redirect 未发生或已被处理，忽略
  });
  return onAuthStateChanged(auth, callback);
}
