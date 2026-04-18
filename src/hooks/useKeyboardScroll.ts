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
      // 所有弹窗已使用 height: var(--vvh) 自动缩至键盘上方，无需额外 scrollIntoView
      document.documentElement.style.setProperty('--vvh', `${vv.height}px`);
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
