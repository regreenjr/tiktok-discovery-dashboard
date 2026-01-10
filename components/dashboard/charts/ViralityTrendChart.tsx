'use client'

import { Video } from '@/lib/analytics/types'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

interface ViralityTrendChartProps {
  videos: Video[]
}

interface TrendDataPoint {
  date: string
  avgVirality: number
  videoCount: number
  dateLabel: string
}

export function ViralityTrendChart({ videos }: ViralityTrendChartProps) {
  if (!videos || videos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Virality Trend</h3>
        <div className="h-64 flex items-center justify-center text-gray-400">
          No video data available
        </div>
      </div>
    )
  }

  // Group videos by date and calculate average virality per day
  const groupedByDate: Record<string, { totalVirality: number; count: number }> = {}

  for (const video of videos) {
    const date = new Date(video.posted_at).toISOString().split('T')[0]
    if (!groupedByDate[date]) {
      groupedByDate[date] = { totalVirality: 0, count: 0 }
    }
    groupedByDate[date].totalVirality += video.virality_score
    groupedByDate[date].count++
  }

  // Convert to array and sort by date
  const chartData: TrendDataPoint[] = Object.entries(groupedByDate)
    .map(([date, data]) => ({
      date,
      avgVirality: Number((data.totalVirality / data.count).toFixed(2)),
      videoCount: data.count,
      dateLabel: formatDate(date),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Calculate overall average for reference line
  const overallAvg = videos.reduce((sum, v) => sum + v.virality_score, 0) / videos.length

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900">{data.dateLabel}</p>
          <p className="text-sm text-indigo-600">
            Avg Virality: {data.avgVirality}x
          </p>
          <p className="text-sm text-gray-500">
            Videos: {data.videoCount}
          </p>
        </div>
      )
    }
    return null
  }

  // Get date range for display
  const startDate = chartData.length > 0 ? formatDate(chartData[0].date) : ''
  const endDate = chartData.length > 0 ? formatDate(chartData[chartData.length - 1].date) : ''

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Virality Trend</h3>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {startDate} - {endDate}
        </span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="dateLabel"
              stroke="#9CA3AF"
              fontSize={12}
              tickFormatter={(value) => value.split(' ')[0]}
            />
            <YAxis
              stroke="#9CA3AF"
              fontSize={12}
              tickFormatter={(value) => `${value}x`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={2.0}
              stroke="#10B981"
              strokeDasharray="5 5"
              label={{ value: 'Viral', position: 'right', fill: '#10B981', fontSize: 10 }}
            />
            <ReferenceLine
              y={overallAvg}
              stroke="#F59E0B"
              strokeDasharray="3 3"
              label={{ value: 'Avg', position: 'right', fill: '#F59E0B', fontSize: 10 }}
            />
            <Line
              type="monotone"
              dataKey="avgVirality"
              stroke="#6366F1"
              strokeWidth={2}
              dot={{ fill: '#6366F1', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#4F46E5' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center">
              <span className="w-3 h-0.5 bg-indigo-500 mr-1"></span>
              Virality Score
            </span>
            <span className="flex items-center">
              <span className="w-3 h-0.5 bg-green-500 mr-1" style={{ borderStyle: 'dashed' }}></span>
              Viral Threshold (2.0x)
            </span>
            <span className="flex items-center">
              <span className="w-3 h-0.5 bg-amber-500 mr-1" style={{ borderStyle: 'dashed' }}></span>
              Average ({overallAvg.toFixed(2)}x)
            </span>
          </div>
          <span>{chartData.length} data points</span>
        </div>
      </div>
    </div>
  )
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
