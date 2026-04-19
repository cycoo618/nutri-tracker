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

// 只有我们自己发起了 redirect 登录，才处理 redirect 结果，
// 避免 getRedirectResult 在每次 App 启动时自动把用户重新登录
const REDIRECT_PENDING_KEY = 'nt_auth_redirect_pending';

/** 通用登录：优先 popup，被拦截时降级为 redirect */
async function signInWith(provider: AuthProvider): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user') {
      // 降级为 redirect：记录标志，页面跳走前存入 sessionStorage
      sessionStorage.setItem(REDIRECT_PENDING_KEY, '1');
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

/** 监听认证状态变化（仅在我们主动发起 redirect 时才处理 redirect 结果） */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  if (sessionStorage.getItem(REDIRECT_PENDING_KEY)) {
    // 消费一次后立即清除标志，防止下次启动再次触发
    sessionStorage.removeItem(REDIRECT_PENDING_KEY);
    getRedirectResult(auth).catch(() => {});
  }
  return onAuthStateChanged(auth, callback);
}
