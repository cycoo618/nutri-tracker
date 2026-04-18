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
      // --vvh = 可见区域高度（键盘弹出后缩小）
      // --vvt = 可见区域顶部偏移（iOS 自动滚动时 > 0，弹窗需要随之下移）
      document.documentElement.style.setProperty('--vvh', `${vv.height}px`);
      document.documentElement.style.setProperty('--vvt', `${vv.offsetTop}px`);
    };

    // 初始化
    document.documentElement.style.setProperty('--vvh', `${vv.height}px`);
    document.documentElement.style.setProperty('--vvt', `${vv.offsetTop}px`);

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);
}
