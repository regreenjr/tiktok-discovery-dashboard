'use client'

import { GroupedMetric } from '@/lib/analytics/types'

interface TopHashtagsWidgetProps {
  hashtags: GroupedMetric[]
}

export function TopHashtagsWidget({ hashtags }: TopHashtagsWidgetProps) {
  // Get top 8 hashtags
  const topHashtags = hashtags.slice(0, 8)

  if (!topHashtags || topHashtags.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          # Top Hashtags
        </h3>
        <p className="text-gray-400 text-sm">No hashtag data available yet</p>
      </div>
    )
  }

  // Get max virality for relative bar widths
  const maxVirality = Math.max(...topHashtags.map(h => h.avgVirality))

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900"># Top Hashtags</h3>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          By Virality
        </span>
      </div>

      <div className="space-y-3">
        {topHashtags.map((hashtag, index) => {
          const barWidth = (hashtag.avgVirality / maxVirality) * 100
          const isTop3 = index < 3

          return (
            <div key={hashtag.name} className="relative">
              {/* Background bar */}
              <div
                className={`absolute inset-y-0 left-0 rounded ${
                  isTop3 ? 'bg-purple-100' : 'bg-gray-100'
                }`}
                style={{ width: `${barWidth}%` }}
              />

              {/* Content */}
              <div className="relative flex items-center justify-between py-2 px-3">
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xs font-bold ${
                      isTop3 ? 'text-purple-600' : 'text-gray-400'
                    }`}
                  >
                    #{index + 1}
                  </span>
                  <span
                    className={`text-sm font-medium truncate max-w-[140px] ${
                      isTop3 ? 'text-gray-900' : 'text-gray-700'
                    }`}
                    title={hashtag.name}
                  >
                    {hashtag.name}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-xs">
                  <span className="text-gray-500" title="Videos">
                    {hashtag.count} video{hashtag.count !== 1 ? 's' : ''}
                  </span>
                  <span
                    className={`font-semibold ${
                      hashtag.avgVirality >= 2.0
                        ? 'text-green-600'
                        : isTop3
                        ? 'text-purple-600'
                        : 'text-gray-600'
                    }`}
                    title="Avg Virality"
                  >
                    {hashtag.avgVirality.toFixed(1)}x
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{topHashtags.length} hashtags analyzed</span>
          <span className="flex items-center">
            <span className="w-2 h-2 bg-purple-500 rounded-full mr-1"></span>
            Top performers
          </span>
        </div>
      </div>
    </div>
  )
}
