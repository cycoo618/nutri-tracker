// ============================================
// 宏量营养素卡片
// ============================================

import { ProgressBar } from './ProgressBar';

interface MacroCardProps {
  label: string;
  consumed: number;
  target: number;
  percent: number;
  unit?: string;
  color: string;
}

export function MacroCard({ label, consumed, target, percent, unit = 'g', color }: MacroCardProps) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-xs text-gray-400">{consumed}/{target}{unit}</span>
      </div>
      <ProgressBar percent={percent} color={color} showPercent={false} />
    </div>
  );
}
