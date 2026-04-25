// Shared swipe-down-to-dismiss hook for bottom sheets and modals.
// cardRef        → attach to the element that physically moves
// dragHandlers   → attach to the drag handle (guaranteed to trigger swipe)
// cardDragHandlers → attach to the whole card; only activates when scrollable
//                    content inside is already scrolled to top
import { useRef, useEffect } from 'react';

export function useSwipeDown(onClose: () => void, threshold = 80) {
  const cardRef   = useRef<HTMLDivElement>(null);
  const startY    = useRef(0);
  const active    = useRef(false); // whether the current touch is a swipe gesture

  const begin = (clientY: number) => {
    startY.current = clientY;
    active.current = true;
    if (cardRef.current) {
      cardRef.current.style.transition = 'none';
      cardRef.current.style.willChange = 'transform';
    }
  };

  const move = (clientY: number) => {
    if (!active.current) return;
    const dy = clientY - startY.current;
    if (dy > 0 && cardRef.current) {
      cardRef.current.style.transform = `translateY(${dy}px)`;
    }
  };

  const end = (clientY: number) => {
    if (!active.current) return;
    active.current = false;
    const dy = clientY - startY.current;
    if (cardRef.current) {
      cardRef.current.style.willChange = '';
      if (dy > threshold) {
        cardRef.current.style.transition = 'transform 0.22s ease';
        cardRef.current.style.transform  = 'translateY(100%)';
        setTimeout(onClose, 200);
      } else {
        cardRef.current.style.transition = 'transform 0.25s ease';
        cardRef.current.style.transform  = 'translateY(0)';
      }
    } else if (dy > threshold) {
      onClose();
    }
  };

  // ESC 键关闭（桌面端）
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Always triggers swipe — for the small drag handle at the top
  const dragHandlers = {
    onTouchStart: (e: React.TouchEvent) => begin(e.touches[0].clientY),
    onTouchMove:  (e: React.TouchEvent) => move(e.touches[0].clientY),
    onTouchEnd:   (e: React.TouchEvent) => end(e.changedTouches[0].clientY),
  };

  // Only triggers swipe when the touched scrollable area is already at the top.
  // Attach to the whole card so users can swipe anywhere, not just the handle.
  const cardDragHandlers = {
    onTouchStart: (e: React.TouchEvent) => {
      // Find the nearest scrollable ancestor of the touch target
      let el: HTMLElement | null = e.target as HTMLElement;
      let scrollTop = 0;
      while (el && el !== cardRef.current) {
        if (el.scrollHeight > el.clientHeight) { scrollTop = el.scrollTop; break; }
        el = el.parentElement;
      }
      if (scrollTop > 2) { active.current = false; return; }
      begin(e.touches[0].clientY);
    },
    onTouchMove:  (e: React.TouchEvent) => move(e.touches[0].clientY),
    onTouchEnd:   (e: React.TouchEvent) => end(e.changedTouches[0].clientY),
  };

  return { cardRef, dragHandlers, cardDragHandlers };
}
