// ============================================
// 键盘弹出时自动滚动输入框到可见区域
// 使用 visualViewport API（iOS Safari / Android Chrome 均支持）
// ============================================

import { useEffect } from 'react';

export function useKeyboardScroll() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      // --vvh = 可见区域高度（键盘弹出后缩小），供 CSS 使用
      document.documentElement.style.setProperty('--vvh', `${vv.height}px`);

      // 只有当输入框真的在可见区域下方时才滚动，且只滚最少的距离
      setTimeout(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return;
        if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return;
        const rect = el.getBoundingClientRect();
        if (rect.bottom > vv.height) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 150);
    };

    // 初始化
    document.documentElement.style.setProperty('--vvh', `${vv.height}px`);

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);
}
