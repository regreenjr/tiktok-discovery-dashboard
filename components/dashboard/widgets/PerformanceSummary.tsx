'use client';

import { useMemo } from 'react';
import { Video } from '@/lib/analytics/types';
import { calculateViralPercentage, calculateAvgVirality } from '@/lib/analytics/insights';

interface PerformanceSummaryProps {
  videos: Video[];
}

export default function PerformanceSummary({ videos }: PerformanceSummaryProps) {
  const viralPercentage = useMemo(() => calculateViralPercentage(videos), [videos]);
  const avgVirality = useMemo(() => calculateAvgVirality(videos), [videos]);

  // Mock week-over-week change (would need historical data)
  const weekOverWeekChange = 5;
  const isPositive = weekOverWeekChange > 0;

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 h-[250px] flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">📊</span>
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
            Performance Summary
          </h3>
        </div>

        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">{Math.round(viralPercentage)}%</span>
            <span className="text-sm text-gray-400">viral</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Videos with 2.0x+ virality</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">0%</span>
            <span className="text-gray-500">100%</span>
          </div>
          <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-1000"
              style={{ width: `${viralPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {/* Delta */}
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-md ${
            isPositive ? 'bg-green-900/20 border border-green-700/30' : 'bg-red-900/20 border border-red-700/30'
          }`}
        >
          <span className={`text-lg ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '↗' : '↘'}
          </span>
          <span className={`text-sm font-medium ${isPositive ? 'text-green-300' : 'text-red-300'}`}>
            {isPositive ? '+' : ''}{weekOverWeekChange} vs last week
          </span>
        </div>

        {/* Average Virality */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Avg Virality</span>
          <span className="text-white font-bold">{avgVirality.toFixed(1)}x</span>
        </div>
      </div>
    </div>
  );
}
