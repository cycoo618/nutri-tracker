import React from 'react';

interface BarProps {
  value: number;
  target: number;
  color: string;
  height?: number;
  track?: string;
}

export function Bar({ value, target, color, height = 6, track = 'var(--line-soft)' }: BarProps) {
  const pct = Math.min(value / (target || 1), 1) * 100;
  return (
    <div style={{ height, background: track, borderRadius: 999, overflow: 'hidden' }}>
      <div style={{ width: pct + '%', height: '100%', background: color, borderRadius: 999, transition: 'width .3s' }} />
    </div>
  );
}
