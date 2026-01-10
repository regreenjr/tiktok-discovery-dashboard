'use client'

import { TopInsight } from '@/lib/analytics/types'

interface TopInsightCardProps {
  insight: TopInsight | null
}

export function TopInsightCard({ insight }: TopInsightCardProps) {
  if (!insight) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Top Insight</h3>
        <p className="text-gray-400 text-sm">No data available yet</p>
      </div>
    )
  }

  const typeLabels = {
    hook_type: 'Hook Type',
    format: 'Format',
    emotion: 'Emotion',
  }

  const typeIcons = {
    hook_type: '🎣',
    format: '🎬',
    emotion: '💭',
  }

  return (
    <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg shadow p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium opacity-90">
          {typeIcons[insight.type]} Best Performing Pattern
        </h3>
        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
          {typeLabels[insight.type]}
        </span>
      </div>

      <div className="mb-4">
        <p className="text-2xl font-bold capitalize">{insight.value}</p>
        <p className="text-sm opacity-75 mt-1">
          Based on {insight.count} videos
        </p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/20">
        <div>
          <p className="text-xs opacity-75">Avg Virality</p>
          <p className="text-lg font-semibold">{insight.avgVirality.toFixed(2)}x</p>
        </div>
        <div className="text-right">
          <p className="text-xs opacity-75">Action</p>
          <p className="text-sm">Use more {insight.value}</p>
        </div>
      </div>
    </div>
  )
}
