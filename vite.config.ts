import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// 唯一构建版本号（紧凑时间戳），用于给 SW 缓存名打版本
const SW_VERSION = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');

// build 时把 dist/sw.js 里的 __SW_VERSION__ 占位符替换成本次构建版本。
// → 每次部署缓存名不同，新 SW 激活时清掉所有旧缓存，用户不会被旧缓存卡住。
function stampSwVersion() {
  return {
    name: 'stamp-sw-version',
    apply: 'build' as const,
    closeBundle() {
      const p = resolve(__dirname, 'dist/sw.js');
      if (existsSync(p)) {
        const src = readFileSync(p, 'utf8').replace(/__SW_VERSION__/g, SW_VERSION);
        writeFileSync(p, src);
      }
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    stampSwVersion(),
  ],
  base: './',
  define: {
    // 构建时间戳，显示在食材库标题栏，用于确认线上跑的是哪个版本
    __BUILD_TIME__: JSON.stringify(new Date().toISOString().slice(5, 16).replace('T', ' ')),
  },
});
