'use client'

import { useState, useEffect } from 'react'
import { Video } from '@/lib/analytics/types'
import { TopInsightCard } from './widgets/TopInsightCard'
import { PerformanceSummary } from './widgets/PerformanceSummary'
import { WorkingNowWidget } from './widgets/WorkingNowWidget'
import { TopHashtagsWidget } from './widgets/TopHashtagsWidget'
import { ContentCalendarWidget } from './widgets/ContentCalendarWidget'
import { MetricsSparkline } from '../charts/SparklineChart'
import { VideoAnalysisModal } from './VideoAnalysisModal'
import {
  calculateTopInsight,
  getPerformanceMetrics,
  getWorkingNowInsights,
  groupByMetric,
  groupByHashtag,
} from '@/lib/analytics/insights'
import { fetchWithAuth } from '@/lib/api'
import { HookPerformanceChart } from './charts/HookPerformanceChart'
import { FormatComparisonChart } from './charts/FormatComparisonChart'
import { EmotionAnalysisChart } from './charts/EmotionAnalysisChart'
import { HashtagPerformanceChart } from './charts/HashtagPerformanceChart'
import { ViralityTrendChart } from './charts/ViralityTrendChart'
import { PostingTimeAnalysisChart } from './charts/PostingTimeAnalysisChart'

interface DashboardGridProps {
  brandId: string
}

export function DashboardGrid({ brandId }: DashboardGridProps) {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideoForAnalysis, setSelectedVideoForAnalysis] = useState<Video | null>(null)

  useEffect(() => {
    fetchVideos()
  }, [brandId])

  const fetchVideos = async () => {
    try {
      const response = await fetchWithAuth(`/api/videos?brand_id=${brandId}`)
      const data = await response.json()
      if (data.data) {
        setVideos(data.data)
      }
    } catch (error) {
      console.error('[DashboardGrid] Error fetching videos:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No video data</h3>
        <p className="mt-1 text-sm text-gray-500">
          Add competitor accounts and run the scraper to see insights.
        </p>
      </div>
    )
  }

  const topInsight = calculateTopInsight(videos)
  const performanceMetrics = getPerformanceMetrics(videos)
  const workingNow = getWorkingNowInsights(videos)
  const hookPerformanceData = groupByMetric(videos, 'hook_type')
  const formatComparisonData = groupByMetric(videos, 'format')
  const emotionAnalysisData = groupByMetric(videos, 'emotion')
  const hashtagPerformanceData = groupByHashtag(videos)

  return (
    <div className="space-y-6">
      {/* Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <TopInsightCard insight={topInsight} />
        <PerformanceSummary metrics={performanceMetrics} />
        <WorkingNowWidget insights={workingNow} />
      </div>

      {/* Phase 3 Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HookPerformanceChart data={hookPerformanceData} />
        <FormatComparisonChart data={formatComparisonData} />
        <EmotionAnalysisChart data={emotionAnalysisData} />
        <HashtagPerformanceChart data={hashtagPerformanceData} />
      </div>

      {/* Phase 4 Trend Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ViralityTrendChart videos={videos} />
        <PostingTimeAnalysisChart videos={videos} />
      </div>

      {/* Phase 5 Compact Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <TopHashtagsWidget hashtags={hashtagPerformanceData} />
        <ContentCalendarWidget videos={videos} />
      </div>

      {/* Video List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Videos ({videos.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {videos.slice(0, 10).map((video) => (
            <div key={video.id} className="px-6 py-4">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">
                    {video.description || 'No description'}
                  </p>
                  <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                    {video.hook_type && (
                      <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                        {video.hook_type}
                      </span>
                    )}
                    {video.format && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        {video.format}
                      </span>
                    )}
                    {video.emotion && (
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                        {video.emotion}
                      </span>
                    )}
                  </div>
                </div>
                <div className="ml-4 flex items-center space-x-4 text-sm text-gray-500">
                  <MetricsSparkline
                    views={video.views}
                    comments={video.comments}
                    shares={video.shares}
                    saves={video.saves}
                  />
                  <span title="Views">👁 {formatCompactNumber(video.views)}</span>
                  <span title="Comments">💬 {formatCompactNumber(video.comments)}</span>
                  <span title="Shares">🔄 {formatCompactNumber(video.shares)}</span>
                  <span title="Saves">💾 {formatCompactNumber(video.saves)}</span>
                  <span
                    className="font-semibold"
                    title="Virality Score"
                  >
                    ⚡ {video.virality_score.toFixed(1)}
                  </span>
                  <button
                    onClick={() => setSelectedVideoForAnalysis(video)}
                    className="ml-2 px-3 py-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-medium rounded-md hover:from-purple-600 hover:to-blue-600 transition-all shadow-sm"
                    title="AI Analysis"
                  >
                    Analyze
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Video Analysis Modal */}
      {selectedVideoForAnalysis && (
        <VideoAnalysisModal
          videoId={selectedVideoForAnalysis.id}
          videoDescription={selectedVideoForAnalysis.description}
          isOpen={!!selectedVideoForAnalysis}
          onClose={() => setSelectedVideoForAnalysis(null)}
        />
      )}
    </div>
  )
}

function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}
