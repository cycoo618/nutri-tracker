// ============================================
// GI 值标签
// ============================================

import { GI_REFERENCE } from '../../config/nutrition';
import { t } from '../../i18n';

interface GIBadgeProps {
  gi?: number;
  size?: 'sm' | 'md';
}

export function GIBadge({ gi, size = 'sm' }: GIBadgeProps) {
  if (gi === undefined) return null;

  const level = gi <= 55 ? 'low' : gi <= 69 ? 'medium' : 'high';
  const ref = GI_REFERENCE[level];
  const giLabel = level === 'low' ? t('giLow') : level === 'medium' ? t('giMed') : t('giHigh');

  const sizeClasses = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses}`}
      style={{
        backgroundColor: `${ref.color}15`,
        color: ref.color,
      }}
    >
      GI {gi} · {giLabel}
    </span>
  );
}
