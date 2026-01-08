'use client';

import { useMemo } from 'react';
import { Video } from '@/lib/analytics/types';
import { calculateTopInsight } from '@/lib/analytics/insights';

interface TopInsightCardProps {
  videos: Video[];
  onFilterClick?: (category: string, value: string) => void;
}

export default function TopInsightCard({ videos, onFilterClick }: TopInsightCardProps) {
  const insight = useMemo(() => calculateTopInsight(videos), [videos]);

  if (!insight) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 h-[250px] flex items-center justify-center">
        <p className="text-gray-400">No data available</p>
      </div>
    );
  }

  const handleClick = () => {
    if (onFilterClick) {
      onFilterClick(insight.category, insight.topValue);
    }
  };

  return (
    <div
      className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-lg p-6 border border-blue-700/30 h-[250px] flex flex-col justify-between cursor-pointer hover:border-blue-500/50 transition-all"
      onClick={handleClick}
    >
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🔥</span>
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
            Top Insight
          </h3>
        </div>

        <p className="text-2xl font-bold text-white mb-3 leading-tight">{insight.insight}</p>

        <div className="flex items-center gap-3">
          <div className="bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30">
            <span className="text-lg font-bold text-green-400">{insight.metric.toFixed(1)}x</span>
          </div>
          <span className="text-sm text-gray-400">{insight.context}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">{insight.count} videos</span>
          <span className="text-blue-400 font-medium">View examples →</span>
        </div>

        <div className="bg-gray-900/50 p-3 rounded-md border border-gray-700">
          <p className="text-xs text-gray-300">
            <span className="text-yellow-400">💡</span> {insight.recommendation}
          </p>
        </div>
      </div>
    </div>
  );
}
