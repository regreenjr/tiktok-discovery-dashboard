'use client'

import { WorkingNowInsights } from '@/lib/analytics/types'

interface WorkingNowWidgetProps {
  insights: WorkingNowInsights
}

export function WorkingNowWidget({ insights }: WorkingNowWidgetProps) {
  const hasData = insights.topFormat || insights.topHashtag || insights.bestPostingTime

  if (!hasData) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-500 mb-2">
          What&apos;s Working Now
        </h3>
        <p className="text-gray-400 text-sm">No data available yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-4">
        🔥 What&apos;s Working Now
      </h3>

      <div className="space-y-4">
        {/* Top Format */}
        {insights.topFormat && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🎬</span>
              <span className="text-sm font-medium text-gray-700">Top Format</span>
            </div>
            <span className="text-sm font-semibold text-blue-700 capitalize">
              {insights.topFormat}
            </span>
          </div>
        )}

        {/* Top Hashtag */}
        {insights.topHashtag && (
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-lg">#</span>
              <span className="text-sm font-medium text-gray-700">Top Hashtag</span>
            </div>
            <span className="text-sm font-semibold text-purple-700">
              {insights.topHashtag}
            </span>
          </div>
        )}

        {/* Best Posting Time */}
        {insights.bestPostingTime && (
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🕐</span>
              <span className="text-sm font-medium text-gray-700">Best Time</span>
            </div>
            <span className="text-sm font-semibold text-green-700">
              {insights.bestPostingTime}
            </span>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Based on highest-performing content patterns
      </p>
    </div>
  )
}
