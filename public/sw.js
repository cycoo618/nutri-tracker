// NutriTrack Service Worker
// 策略：navigation 走 network-first（在线永远拿最新 index.html），
//       静态资源走 cache-first。缓存名带构建版本号（build 时由 vite 插件注入），
//       每次部署缓存名变化 → activate 清掉所有旧缓存 → 用户不会被旧缓存卡住。
//
// __SW_VERSION__ 是占位符：vite build 的 stamp-sw-version 插件会替换成构建时间戳。
// dev 环境不注册 SW（见 index.html），所以未被替换的占位符不影响开发。

const CACHE = 'nutritrack-__SW_VERSION__';

self.addEventListener('install', () => {
  // 立即接管，不等旧 SW 释放
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // 删除所有非当前版本的缓存（每次部署版本号变 → 旧缓存全清）
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  // 跳过 Firebase / 第三方跨域请求，始终走网络
  if (url.origin !== self.location.origin) return;

  // 导航（HTML）：network-first —— 在线永远拿最新 index.html（引用最新 hash 资源）；
  // 离线时回退到缓存的 index.html。成功后顺手更新缓存副本，保证离线兜底也是新的。
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put('./index.html', clone)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('./index.html').then(r => r || Response.error()))
    );
    return;
  }

  // 静态资源：cache-first。hash 化文件名不可变，命中即返回；未命中回源并缓存。
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
        }
        return res;
      });
    })
  );
});
