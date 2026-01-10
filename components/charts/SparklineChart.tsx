'use client'

import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface SparklineChartProps {
  data: number[]
  color?: string
  height?: number
  showDot?: boolean
}

export function SparklineChart({
  data,
  color = '#6366F1',
  height = 24,
  showDot = false,
}: SparklineChartProps) {
  if (!data || data.length === 0) {
    return null
  }

  // Convert array of numbers to chart data format
  const chartData = data.map((value, index) => ({
    value,
    index,
  }))

  return (
    <div style={{ width: '80px', height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={showDot ? { fill: color, strokeWidth: 0, r: 2 } : false}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// Helper component to create sparkline from video metrics
interface MetricsSparklineProps {
  views: number
  comments: number
  shares: number
  saves: number
}

export function MetricsSparkline({ views, comments, shares, saves }: MetricsSparklineProps) {
  // Normalize metrics to relative scale (0-100)
  const maxVal = Math.max(views, comments * 100, shares * 50, saves * 30)

  const normalizedData = [
    (views / maxVal) * 100,
    ((comments * 100) / maxVal) * 100,
    ((shares * 50) / maxVal) * 100,
    ((saves * 30) / maxVal) * 100,
  ]

  // Determine trend (up, down, or flat)
  const firstHalf = normalizedData.slice(0, 2).reduce((a, b) => a + b, 0) / 2
  const secondHalf = normalizedData.slice(2, 4).reduce((a, b) => a + b, 0) / 2

  let color = '#6366F1' // indigo (neutral)
  if (secondHalf > firstHalf * 1.1) {
    color = '#10B981' // green (up trend)
  } else if (secondHalf < firstHalf * 0.9) {
    color = '#EF4444' // red (down trend)
  }

  return <SparklineChart data={normalizedData} color={color} />
}
