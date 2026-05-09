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
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { auth, googleProvider, appleProvider } from '../config/firebase';

export type AuthUser = User;

const REDIRECT_PENDING_KEY = 'nt_auth_redirect_pending';

// iOS OAuth client (from GoogleService-Info.plist)
const IOS_CLIENT_ID = '402005388165-v8996j1lkbgpn1lo5kjnjrp8u2goshep.apps.googleusercontent.com';
const IOS_REDIRECT_URI = 'com.googleusercontent.apps.402005388165-v8996j1lkbgpn1lo5kjnjrp8u2goshep:/oauth2redirect';

// PKCE helpers
function randomBase64Url(byteLength: number): string {
  const arr = new Uint8Array(byteLength);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function sha256Base64Url(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/** 原生 iOS: PKCE OAuth 流程（不依赖 CocoaPods 插件，完全 JS 实现）
 *  Browser.open → SFSafariViewController → callback via URL scheme → token exchange → signInWithCredential */
async function googleSignInPKCE(): Promise<User> {
  const { Browser } = await import('@capacitor/browser');
  const { App } = await import('@capacitor/app');

  const codeVerifier = randomBase64Url(48);
  const codeChallenge = await sha256Base64Url(codeVerifier);
  const state = randomBase64Url(16);

  const params = new URLSearchParams({
    client_id: IOS_CLIENT_ID,
    redirect_uri: IOS_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

  return new Promise((resolve, reject) => {
    let settled = false;

    App.addListener('appUrlOpen', async (event) => {
      if (settled) return;
      // Only handle our redirect URI
      if (!event.url.startsWith('com.googleusercontent.apps.402005388165-v8996j1lkbgpn1lo5kjnjrp8u2goshep:')) return;
      settled = true;

      try {
        await Browser.close();

        const callbackUrl = new URL(event.url);
        const code = callbackUrl.searchParams.get('code');
        const returnedState = callbackUrl.searchParams.get('state');

        if (!code) throw new Error('OAuth callback missing code');
        if (returnedState !== state) throw new Error('OAuth state mismatch');

        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: IOS_CLIENT_ID,
            redirect_uri: IOS_REDIRECT_URI,
            grant_type: 'authorization_code',
            code,
            code_verifier: codeVerifier,
          }),
        });

        const tokens = await tokenRes.json() as { id_token?: string; access_token?: string; error?: string };
        if (tokens.error || !tokens.id_token) throw new Error(tokens.error ?? 'No id_token in token response');

        const credential = GoogleAuthProvider.credential(tokens.id_token, tokens.access_token);
        const result = await signInWithCredential(auth, credential);
        resolve(result.user);
      } catch (err) {
        reject(err);
      }
    }).catch(reject);

    Browser.open({ url: authUrl }).catch(reject);
  });
}

/** Google 登录：原生 iOS 走 PKCE，Web 走 popup（fallback to redirect） */
export async function signInWithGoogle(): Promise<User | null> {
  if (Capacitor.isNativePlatform()) {
    return googleSignInPKCE();
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

/** Apple 登录：原生和 Web 都走 Firebase redirect/popup */
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

export { googleProvider as _googleProvider, appleProvider as _appleProvider };
