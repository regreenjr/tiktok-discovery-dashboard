'use client'

import { Video } from '@/lib/analytics/types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface PostingTimeAnalysisChartProps {
  videos: Video[]
}

interface TimeSlotData {
  hour: number
  hourLabel: string
  avgVirality: number
  videoCount: number
  totalViews: number
}

// Color palette from teal to blue
const COLORS = [
  '#0D9488', // teal-600
  '#0891B2', // cyan-600
  '#0284C7', // sky-600
  '#2563EB', // blue-600
]

export function PostingTimeAnalysisChart({ videos }: PostingTimeAnalysisChartProps) {
  if (!videos || videos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Best Posting Times</h3>
        <div className="h-64 flex items-center justify-center text-gray-400">
          No video data available
        </div>
      </div>
    )
  }

  // Group videos by hour of day and calculate average virality
  const hourlyStats: Record<number, { totalVirality: number; count: number; totalViews: number }> = {}

  for (const video of videos) {
    const date = new Date(video.posted_at)
    const hour = date.getUTCHours()

    if (!hourlyStats[hour]) {
      hourlyStats[hour] = { totalVirality: 0, count: 0, totalViews: 0 }
    }
    hourlyStats[hour].totalVirality += video.virality_score
    hourlyStats[hour].count++
    hourlyStats[hour].totalViews += video.views
  }

  // Convert to array and format for chart
  const chartData: TimeSlotData[] = Object.entries(hourlyStats)
    .map(([hour, data]) => ({
      hour: parseInt(hour),
      hourLabel: formatHour(parseInt(hour)),
      avgVirality: Number((data.totalVirality / data.count).toFixed(2)),
      videoCount: data.count,
      totalViews: data.totalViews,
    }))
    .sort((a, b) => b.avgVirality - a.avgVirality) // Sort by performance

  // Get top 6 time slots for cleaner display
  const topTimeSlots = chartData.slice(0, 6)

  // Find the best time slot
  const bestTime = topTimeSlots[0]

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900">{data.hourLabel}</p>
          <p className="text-sm text-teal-600">
            Avg Virality: {data.avgVirality}x
          </p>
          <p className="text-sm text-gray-500">
            Videos: {data.videoCount}
          </p>
          <p className="text-sm text-gray-500">
            Total Views: {formatNumber(data.totalViews)}
          </p>
        </div>
      )
    }
    return null
  }

  // Determine color based on position (best times get darker colors)
  const getBarColor = (index: number) => {
    return COLORS[Math.min(index, COLORS.length - 1)]
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Best Posting Times</h3>
          <p className="text-xs text-gray-500">Top performing hours (UTC)</p>
        </div>
        {bestTime && (
          <span className="bg-teal-100 text-teal-700 px-2 py-1 rounded text-sm font-medium">
            Best: {bestTime.hourLabel}
          </span>
        )}
      </div>

      {topTimeSlots.length > 0 ? (
        <>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topTimeSlots}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={true} vertical={false} />
                <XAxis
                  type="number"
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickFormatter={(value) => `${value}x`}
                  domain={[0, 'dataMax']}
                />
                <YAxis
                  type="category"
                  dataKey="hourLabel"
                  stroke="#9CA3AF"
                  fontSize={12}
                  width={55}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="avgVirality"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={30}
                >
                  {topTimeSlots.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500">Peak Time</p>
                <p className="font-semibold text-teal-600">{bestTime?.hourLabel || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Peak Virality</p>
                <p className="font-semibold text-gray-900">{bestTime?.avgVirality || 0}x</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Time Slots</p>
                <p className="font-semibold text-gray-900">{chartData.length}</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="h-64 flex items-center justify-center text-gray-400">
          Not enough data to analyze posting times
        </div>
      )}
    </div>
  )
}

function formatHour(hour: number): string {
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:00 ${ampm}`
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}
