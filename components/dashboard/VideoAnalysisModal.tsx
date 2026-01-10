'use client'

import { useState } from 'react'

interface VideoAnalysis {
  videoId: string
  hookBreakdown: {
    type: string
    effectiveness: string
    openingLine: string
    timestamp: string
    analysis: string
  }
  formatAnalysis: {
    type: string
    pacing: string
    structure: string
    visualElements: string[]
    analysis: string
  }
  emotionMapping: {
    primaryEmotion: string
    secondaryEmotions: string[]
    emotionalArc: string
    analysis: string
  }
  whyItWorks: {
    summary: string
    keyFactors: string[]
    engagementDrivers: string[]
    replicationTips: string[]
  }
  metrics: {
    views: number
    comments: number
    shares: number
    likes: number
    viralityScore: number
  }
}

interface VideoAnalysisModalProps {
  videoId: string
  videoDescription: string
  isOpen: boolean
  onClose: () => void
}

export function VideoAnalysisModal({
  videoId,
  videoDescription,
  isOpen,
  onClose,
}: VideoAnalysisModalProps) {
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalysis = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/analyze/video/${videoId}`, {
        method: 'POST',
      })
      const data = await response.json()
      if (data.success) {
        setAnalysis(data.data)
      } else {
        setError(data.error || 'Failed to analyze video')
      }
    } catch (err) {
      setError('Failed to fetch analysis')
      console.error('[VideoAnalysisModal] Error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch analysis when modal opens
  if (isOpen && !analysis && !loading && !error) {
    fetchAnalysis()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        ></div>

        {/* Center modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white" id="modal-title">
                  AI Video Analysis
                </h3>
                <p className="text-sm text-purple-100 truncate max-w-md">
                  {videoDescription || 'No description'}
                </p>
              </div>
              <button
                type="button"
                className="rounded-md text-white hover:text-gray-200 focus:outline-none"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                <span className="ml-3 text-gray-500">Analyzing video...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">{error}</p>
                <button
                  onClick={fetchAnalysis}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Try again
                </button>
              </div>
            )}

            {analysis && (
              <div className="space-y-6">
                {/* Why It Works - Hero Section */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                  <h4 className="text-lg font-semibold text-green-800 flex items-center gap-2 mb-2">
                    <span>Why It Works</span>
                  </h4>
                  <p className="text-green-700 mb-3">{analysis.whyItWorks.summary}</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <h5 className="text-sm font-medium text-green-800 mb-2">Key Factors</h5>
                      <ul className="space-y-1">
                        {analysis.whyItWorks.keyFactors.map((factor, i) => (
                          <li key={i} className="text-sm text-green-600 flex items-start gap-2">
                            <span className="text-green-500">+</span>
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-green-800 mb-2">Engagement Drivers</h5>
                      <ul className="space-y-1">
                        {analysis.whyItWorks.engagementDrivers.map((driver, i) => (
                          <li key={i} className="text-sm text-green-600 flex items-start gap-2">
                            <span className="text-green-500">+</span>
                            {driver}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-green-800 mb-2">Replication Tips</h5>
                      <ul className="space-y-1">
                        {analysis.whyItWorks.replicationTips.map((tip, i) => (
                          <li key={i} className="text-sm text-green-600 flex items-start gap-2">
                            <span className="text-green-500">{i + 1}.</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Hook Breakdown */}
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="text-md font-semibold text-purple-800 flex items-center gap-2 mb-3">
                    <span>Hook Breakdown</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      analysis.hookBreakdown.effectiveness === 'high'
                        ? 'bg-green-100 text-green-700'
                        : analysis.hookBreakdown.effectiveness === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {analysis.hookBreakdown.effectiveness} effectiveness
                    </span>
                  </h4>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <span className="text-xs text-purple-600 font-medium">Type</span>
                      <p className="text-sm text-purple-800 capitalize">{analysis.hookBreakdown.type}</p>
                    </div>
                    <div>
                      <span className="text-xs text-purple-600 font-medium">Timestamp</span>
                      <p className="text-sm text-purple-800">{analysis.hookBreakdown.timestamp}</p>
                    </div>
                  </div>
                  <div className="mb-2">
                    <span className="text-xs text-purple-600 font-medium">Opening Line</span>
                    <p className="text-sm text-purple-800 italic">"{analysis.hookBreakdown.openingLine}"</p>
                  </div>
                  <p className="text-sm text-purple-700">{analysis.hookBreakdown.analysis}</p>
                </div>

                {/* Format Analysis */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="text-md font-semibold text-blue-800 flex items-center gap-2 mb-3">
                    <span>Format Analysis</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      {analysis.formatAnalysis.pacing} pacing
                    </span>
                  </h4>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <span className="text-xs text-blue-600 font-medium">Format Type</span>
                      <p className="text-sm text-blue-800">{analysis.formatAnalysis.type}</p>
                    </div>
                    <div>
                      <span className="text-xs text-blue-600 font-medium">Structure</span>
                      <p className="text-sm text-blue-800">{analysis.formatAnalysis.structure}</p>
                    </div>
                  </div>
                  <div className="mb-2">
                    <span className="text-xs text-blue-600 font-medium">Visual Elements</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {analysis.formatAnalysis.visualElements.map((el, i) => (
                        <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          {el}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-blue-700">{analysis.formatAnalysis.analysis}</p>
                </div>

                {/* Emotion Mapping */}
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <h4 className="text-md font-semibold text-yellow-800 flex items-center gap-2 mb-3">
                    <span>Emotion Mapping</span>
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                      {analysis.emotionMapping.primaryEmotion}
                    </span>
                  </h4>
                  <div className="mb-2">
                    <span className="text-xs text-yellow-600 font-medium">Secondary Emotions</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {analysis.emotionMapping.secondaryEmotions.map((em, i) => (
                        <span key={i} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                          {em}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mb-2">
                    <span className="text-xs text-yellow-600 font-medium">Emotional Arc</span>
                    <p className="text-sm text-yellow-800">{analysis.emotionMapping.emotionalArc}</p>
                  </div>
                  <p className="text-sm text-yellow-700">{analysis.emotionMapping.analysis}</p>
                </div>

                {/* Metrics Summary */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-md font-semibold text-gray-800 mb-3">Performance Metrics</h4>
                  <div className="grid grid-cols-5 gap-4 text-center">
                    <div>
                      <span className="text-2xl font-bold text-gray-900">
                        {formatCompactNumber(analysis.metrics.views)}
                      </span>
                      <p className="text-xs text-gray-500">Views</p>
                    </div>
                    <div>
                      <span className="text-2xl font-bold text-gray-900">
                        {formatCompactNumber(analysis.metrics.comments)}
                      </span>
                      <p className="text-xs text-gray-500">Comments</p>
                    </div>
                    <div>
                      <span className="text-2xl font-bold text-gray-900">
                        {formatCompactNumber(analysis.metrics.shares)}
                      </span>
                      <p className="text-xs text-gray-500">Shares</p>
                    </div>
                    <div>
                      <span className="text-2xl font-bold text-gray-900">
                        {formatCompactNumber(analysis.metrics.likes)}
                      </span>
                      <p className="text-xs text-gray-500">Likes/Saves</p>
                    </div>
                    <div>
                      <span className="text-2xl font-bold text-purple-600">
                        {analysis.metrics.viralityScore.toFixed(1)}x
                      </span>
                      <p className="text-xs text-gray-500">Virality</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 flex justify-end">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
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
