import React, { useState, useEffect, useRef } from 'react';

const BANNERS = [
  { tag: '节奏', tagColor: 'var(--tomato)', icon: '⏱', body: '按目前节奏，可以放一餐 500 kcal 的晚饭，再留 500 kcal 给加餐。' },
  { tag: '多样性', tagColor: 'var(--sage)', icon: '🌿', body: '差 5 类食物。今晚加 1 份酸奶 + 1 份叶菜，3 类一下就到位了。' },
  { tag: '发酵食品', tagColor: 'var(--ferm)', icon: '🫙', body: '近 7 天未吃过，希腊酸奶、泡菜、味噌汤、纳豆均可，每天一份即可。' },
  { tag: '蔬菜', tagColor: 'var(--veg)', icon: '🥬', body: '已 2 天未吃，午餐或晚餐加一份叶菜，建议每天 300–500g。' },
  { tag: 'Omega-3', tagColor: 'var(--fish)', icon: '🐟', body: '今天还是 0 mg，加一小把核桃或一片三文鱼。' },
  { tag: '连续记录', tagColor: 'var(--mustard)', icon: '✨', body: '23 天 · 坚持就是 80% 的胜利 — 这个月还有 8 天。' },
];

export function RotatingBanner() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setCurrent(c => (c + 1) % BANNERS.length);
    }, 4500);
    return () => clearInterval(id);
  }, [paused]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: current * scrollRef.current.offsetWidth, behavior: 'smooth' });
    }
  }, [current]);

  const handleTouchStart = () => {
    setPaused(true);
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
    pauseTimer.current = setTimeout(() => setPaused(false), 8000);
  };

  const handleMouseEnter = () => setPaused(true);
  const handleMouseLeave = () => setPaused(false);

  return (
    <div style={{ userSelect: 'none' }}>
      <div
        ref={scrollRef}
        onTouchStart={handleTouchStart}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          display: 'flex',
          overflowX: 'hidden',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
        }}
      >
        {BANNERS.map((b, i) => (
          <div
            key={i}
            style={{
              minWidth: '100%',
              scrollSnapAlign: 'start',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              padding: '8px 0 4px',
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1.2 }}>{b.icon}</span>
            <div style={{ flex: 1 }}>
              <span
                className="nt-chip"
                style={{ marginBottom: 3, background: b.tagColor + '18', borderColor: b.tagColor + '33', color: b.tagColor }}
              >
                {b.tag}
              </span>
              <p
                className="nt-serif"
                style={{ margin: 0, fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.55 }}
              >
                {b.body}
              </p>
            </div>
          </div>
        ))}
      </div>
      {/* Dots */}
      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 8 }}>
        {BANNERS.map((b, i) => (
          <div
            key={i}
            onClick={() => { setCurrent(i); setPaused(true); if (pauseTimer.current) clearTimeout(pauseTimer.current); pauseTimer.current = setTimeout(() => setPaused(false), 8000); }}
            style={{
              height: 5,
              width: i === current ? 14 : 5,
              borderRadius: 999,
              background: i === current ? b.tagColor : 'var(--ink-faint)',
              transition: 'all 0.3s',
              cursor: 'pointer',
            }}
          />
        ))}
      </div>
    </div>
  );
}
