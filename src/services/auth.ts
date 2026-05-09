// ============================================
// 认证服务
// 支持 Google / Apple 登录，未来可扩展邮箱密码
// ============================================

import {
  signInWithPopup,
  signInWithRedirect,
  signInWithCredential,
  getRedirectResult,
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
  type AuthProvider,
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { auth, googleProvider, appleProvider } from '../config/firebase';

export type AuthUser = User;

const REDIRECT_PENDING_KEY = 'nt_auth_redirect_pending';

/** Google 登录：原生 iOS 用 capacitor-google-auth 拿 token 再 signInWithCredential，
 *  绕过 Firebase 的域名检查；Web 用 signInWithPopup */
export async function signInWithGoogle(): Promise<User | null> {
  if (Capacitor.isNativePlatform()) {
    const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
    const googleUser = await GoogleAuth.signIn();
    const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
    const result = await signInWithCredential(auth, credential);
    return result.user;
  }

  try {
    const result = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
    return result.user;
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user') {
      sessionStorage.setItem(REDIRECT_PENDING_KEY, '1');
      await signInWithRedirect(auth, googleProvider, browserPopupRedirectResolver);
      return null;
    }
    throw err;
  }
}

/** Apple 登录：原生和 Web 都走 Firebase redirect/popup（Apple 没有类似 Google 的原生 Capacitor 插件） */
export async function signInWithApple(): Promise<User | null> {
  if (Capacitor.isNativePlatform()) {
    sessionStorage.setItem(REDIRECT_PENDING_KEY, '1');
    await signInWithRedirect(auth, appleProvider, browserPopupRedirectResolver);
    return null;
  }

  try {
    const result = await signInWithPopup(auth, appleProvider, browserPopupRedirectResolver);
    return result.user;
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user') {
      sessionStorage.setItem(REDIRECT_PENDING_KEY, '1');
      await signInWithRedirect(auth, appleProvider, browserPopupRedirectResolver);
      return null;
    }
    throw err;
  }
}

/** 登出 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/** 监听认证状态变化 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  if (sessionStorage.getItem(REDIRECT_PENDING_KEY)) {
    sessionStorage.removeItem(REDIRECT_PENDING_KEY);
    getRedirectResult(auth, browserPopupRedirectResolver).catch(() => {});
  }
  return onAuthStateChanged(auth, callback);
}

// 兼容旧调用方（如果有其他地方调用了 signInWith 通用函数）
export { googleProvider as _googleProvider, appleProvider as _appleProvider };
