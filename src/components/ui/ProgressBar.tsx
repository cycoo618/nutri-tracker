// ============================================
// 线性进度条 — 用于宏量营养素
// ============================================

interface ProgressBarProps {
  percent: number;
  color?: string;
  height?: number;
  label?: string;
  detail?: string;
  showPercent?: boolean;
}

export function ProgressBar({
  percent,
  color = '#3b82f6',
  height = 8,
  label,
  detail,
  showPercent = true,
}: ProgressBarProps) {
  const clampedPercent = Math.min(percent, 100);
  const isOver = percent > 100;

  return (
    <div className="w-full">
      {(label || detail) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm text-gray-600">{label}</span>}
          {detail && <span className="text-sm text-gray-500">{detail}</span>}
        </div>
      )}
      <div className="w-full rounded-full overflow-hidden" style={{ height, backgroundColor: '#e5e7eb' }}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${clampedPercent}%`,
            backgroundColor: isOver ? '#ef4444' : color,
          }}
        />
      </div>
      {showPercent && (
        <div className="text-right mt-0.5">
          <span className={`text-xs ${isOver ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
            {percent}%
          </span>
        </div>
      )}
    </div>
  );
}
