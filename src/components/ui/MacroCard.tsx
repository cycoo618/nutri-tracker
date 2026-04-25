// ============================================
// 宏量营养素卡片
// ============================================

import { ProgressBar } from './ProgressBar';
import { useLocale } from '../../i18n/useLocale';
import { localizeUnit } from '../../utils/servingLabels';

interface MacroCardProps {
  label: string;
  consumed: number;
  target: number;
  percent: number;
  unit?: string;
  color: string;
}

export function MacroCard({ label, consumed, target, percent, unit = 'g', color }: MacroCardProps) {
  const { locale } = useLocale();
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-xs text-gray-400">{consumed}/{target}{localizeUnit(unit, locale)}</span>
      </div>
      <ProgressBar percent={percent} color={color} showPercent={false} />
    </div>
  );
}
