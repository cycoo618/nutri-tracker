import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  OAuthProvider,
} from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);

// 用 initializeAuth 代替 getAuth + setPersistence：
// getAuth 初始化时默认先尝试 indexedDB（依赖跨域 iframe），
// 在 WKWebView（Capacitor）和 iOS Safari 中 ITP 会阻断该 iframe，
// 导致 onAuthStateChanged 永远不触发（一直 loading）。
// initializeAuth 直接指定 browserLocalPersistence，完全跳过 iframe 路径。
// 不在这里传 popupRedirectResolver：
// resolver 初始化时会加载 authDomain 的跨域 iframe，WKWebView ITP 会阻断它，
// 导致 onAuthStateChanged 永远不触发（一直 loading）。
// 改为在每次 signInWithRedirect / getRedirectResult 调用时按需传入。
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
});
// Firestore 默认用 WebChannel 流式连接，部分网络/浏览器组合（代理、广告拦截器、
// 某些 iOS Safari 配置）会让它静默挂起，表现为所有读写超时。
// services/firestore.ts 在连续超时后设置此 flag，刷新后强制走长轮询兼容模式。
const forceLongPolling = localStorage.getItem('nt_force_longpolling') === '1';
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: forceLongPolling,
  experimentalAutoDetectLongPolling: !forceLongPolling,
}, 'default');

export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');
