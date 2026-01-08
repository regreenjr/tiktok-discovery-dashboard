'use client';

interface ComparisonBarProps {
  value: number;
  max: number;
  label: string;
  color?: string;
  showValue?: boolean;
  context?: string;
}

export default function ComparisonBar({
  value,
  max,
  label,
  color = '#3B82F6',
  showValue = true,
  context,
}: ComparisonBarProps) {
  const percentage = (value / max) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-200">{label}</span>
        {showValue && (
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">{value.toFixed(1)}x</span>
            {context && <span className="text-xs text-gray-400">{context}</span>}
          </div>
        )}
      </div>
      <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}
