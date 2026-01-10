'use client'

import { PerformanceMetrics } from '@/lib/analytics/types'

interface PerformanceSummaryProps {
  metrics: PerformanceMetrics
}

export function PerformanceSummary({ metrics }: PerformanceSummaryProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-4">
        Performance Summary
      </h3>

      <div className="space-y-4">
        {/* Viral Percentage */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600">Viral Rate</span>
            <span className="text-lg font-semibold text-green-600">
              {metrics.viralPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(metrics.viralPercentage, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {metrics.viralVideos} of {metrics.totalVideos} videos with virality ≥ 2.0
          </p>
        </div>

        {/* Average Virality */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Avg Virality Score</span>
            <span className="text-2xl font-bold text-blue-600">
              {metrics.avgVirality.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Higher is better. 2.0+ is considered viral.
          </p>
        </div>

        {/* Total Videos */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Videos Analyzed</span>
            <span className="text-lg font-semibold text-gray-900">
              {metrics.totalVideos}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
