'use client'

import { Video } from '@/lib/analytics/types'

interface ContentCalendarWidgetProps {
  videos: Video[]
}

interface DaySchedule {
  day: string
  dayShort: string
  bestHour: number
  avgVirality: number
  videoCount: number
  isOptimal: boolean
}

const DAYS = [
  { full: 'Monday', short: 'Mon' },
  { full: 'Tuesday', short: 'Tue' },
  { full: 'Wednesday', short: 'Wed' },
  { full: 'Thursday', short: 'Thu' },
  { full: 'Friday', short: 'Fri' },
  { full: 'Saturday', short: 'Sat' },
  { full: 'Sunday', short: 'Sun' },
]

export function ContentCalendarWidget({ videos }: ContentCalendarWidgetProps) {
  if (!videos || videos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Content Calendar
        </h3>
        <p className="text-gray-400 text-sm">No video data to analyze</p>
      </div>
    )
  }

  // Analyze best posting times by day of week
  const dayStats: Record<number, { hours: Record<number, { totalVirality: number; count: number }> }> = {}

  for (const video of videos) {
    const date = new Date(video.posted_at)
    const dayOfWeek = date.getUTCDay() // 0 = Sunday, 1 = Monday, etc.
    const hour = date.getUTCHours()

    if (!dayStats[dayOfWeek]) {
      dayStats[dayOfWeek] = { hours: {} }
    }
    if (!dayStats[dayOfWeek].hours[hour]) {
      dayStats[dayOfWeek].hours[hour] = { totalVirality: 0, count: 0 }
    }
    dayStats[dayOfWeek].hours[hour].totalVirality += video.virality_score
    dayStats[dayOfWeek].hours[hour].count++
  }

  // Build schedule for each day
  const schedule: DaySchedule[] = DAYS.map((day, index) => {
    // Convert Monday-first index to JavaScript Sunday-first
    const jsDay = index === 6 ? 0 : index + 1 // Mon=1, Tue=2, ..., Sat=6, Sun=0

    if (!dayStats[jsDay]) {
      return {
        day: day.full,
        dayShort: day.short,
        bestHour: 12, // Default to noon
        avgVirality: 0,
        videoCount: 0,
        isOptimal: false,
      }
    }

    // Find best hour for this day
    let bestHour = 12
    let bestVirality = 0
    let totalCount = 0

    for (const [hour, stats] of Object.entries(dayStats[jsDay].hours)) {
      const avgVirality = stats.totalVirality / stats.count
      totalCount += stats.count
      if (avgVirality > bestVirality) {
        bestVirality = avgVirality
        bestHour = parseInt(hour)
      }
    }

    return {
      day: day.full,
      dayShort: day.short,
      bestHour,
      avgVirality: bestVirality,
      videoCount: totalCount,
      isOptimal: bestVirality >= 2.0, // Mark as optimal if viral
    }
  })

  // Find overall best day
  const bestDay = schedule.reduce((best, day) =>
    day.avgVirality > best.avgVirality ? day : best
  )

  // Count days with data
  const daysWithData = schedule.filter(d => d.videoCount > 0).length

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Content Calendar</h3>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          Optimal Schedule
        </span>
      </div>

      {/* Weekly Schedule Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {schedule.map((day) => (
          <div
            key={day.day}
            className={`text-center p-2 rounded-lg ${
              day.videoCount > 0
                ? day.isOptimal
                  ? 'bg-green-100 border border-green-300'
                  : 'bg-blue-50 border border-blue-200'
                : 'bg-gray-50 border border-gray-200'
            }`}
          >
            <div className="text-xs font-medium text-gray-600 mb-1">
              {day.dayShort}
            </div>
            {day.videoCount > 0 ? (
              <>
                <div
                  className={`text-sm font-bold ${
                    day.isOptimal ? 'text-green-700' : 'text-blue-700'
                  }`}
                >
                  {formatHour(day.bestHour)}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {day.avgVirality.toFixed(1)}x
                </div>
              </>
            ) : (
              <div className="text-xs text-gray-400">No data</div>
            )}
          </div>
        ))}
      </div>

      {/* Best Day Highlight */}
      {bestDay.videoCount > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Best Day to Post</p>
              <p className="font-semibold text-gray-900">
                {bestDay.day} at {formatHour(bestDay.bestHour)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Avg Virality</p>
              <p className={`font-bold ${
                bestDay.avgVirality >= 2.0 ? 'text-green-600' : 'text-blue-600'
              }`}>
                {bestDay.avgVirality.toFixed(1)}x
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <span className="flex items-center">
            <span className="w-3 h-3 bg-green-200 border border-green-300 rounded mr-1"></span>
            Optimal (2.0x+)
          </span>
          <span className="flex items-center">
            <span className="w-3 h-3 bg-blue-100 border border-blue-200 rounded mr-1"></span>
            Good
          </span>
        </div>
        <span>{daysWithData}/7 days analyzed</span>
      </div>
    </div>
  )
}

function formatHour(hour: number): string {
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}${ampm}`
}
