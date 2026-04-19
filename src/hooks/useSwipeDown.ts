// Shared swipe-down-to-dismiss hook for bottom sheets and modals.
// cardRef  → attach to the element that physically moves
// dragHandlers → attach to the drag handle (or the full card if no scroll)
import { useRef } from 'react';

export function useSwipeDown(onClose: () => void, threshold = 80) {
  const cardRef = useRef<HTMLDivElement>(null);
  const startY  = useRef(0);

  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    if (cardRef.current) {
      cardRef.current.style.transition = 'none';
      cardRef.current.style.willChange = 'transform';
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0 && cardRef.current) {
      cardRef.current.style.transform = `translateY(${dy}px)`;
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const dy = e.changedTouches[0].clientY - startY.current;
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

  const dragHandlers = { onTouchStart, onTouchMove, onTouchEnd };
  return { cardRef, dragHandlers };
}
