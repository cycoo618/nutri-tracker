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
      document.documentElement.style.setProperty('--vvh', `${vv.height}px`);
      document.documentElement.style.setProperty('--vvt', `${vv.offsetTop}px`);
      // Use viewport height shrinkage as keyboard detector (more reliable than
      // offsetTop which also fires during elastic scroll at page bottom).
      const keyboardVisible = window.innerHeight - vv.height > 150;
      if (keyboardVisible && window.scrollY > 0) {
        window.scrollTo(0, 0);
      }
    };

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
