'use client'

import { GroupedMetric } from '@/lib/analytics/types'
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

interface EmotionAnalysisChartProps {
  data: GroupedMetric[]
}

// Color palette for the bars (warm yellow/orange tones)
const COLORS = ['#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A', '#FEF3C7']

export function EmotionAnalysisChart({ data }: EmotionAnalysisChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Emotion Analysis</h3>
        <div className="h-64 flex items-center justify-center text-gray-400">
          No emotion data available
        </div>
      </div>
    )
  }

  // Sort by average virality descending and take top 5
  const chartData = data
    .sort((a, b) => b.avgVirality - a.avgVirality)
    .slice(0, 5)
    .map((item) => ({
      name: item.name,
      avgVirality: Number(item.avgVirality.toFixed(2)),
      count: item.count,
      totalViews: item.totalViews,
    }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900 capitalize">{label}</p>
          <p className="text-sm text-yellow-600">
            Avg Virality: {data.avgVirality}x
          </p>
          <p className="text-sm text-gray-500">
            Videos: {data.count}
          </p>
          <p className="text-sm text-gray-500">
            Total Views: {formatNumber(data.totalViews)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Emotion Analysis</h3>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          By Avg Virality
        </span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              type="number"
              tickFormatter={(value) => `${value}x`}
              stroke="#9CA3AF"
              fontSize={12}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#9CA3AF"
              fontSize={12}
              width={70}
              tickFormatter={(value) => value.length > 10 ? value.slice(0, 10) + '...' : value}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="avgVirality"
              radius={[0, 4, 4, 0]}
              cursor="pointer"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex flex-wrap gap-2">
          {chartData.map((item, index) => (
            <div
              key={item.name}
              className="flex items-center text-xs text-gray-600"
            >
              <span
                className="w-3 h-3 rounded-sm mr-1"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="capitalize">{item.name}</span>
              <span className="ml-1 text-gray-400">({item.count})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
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
