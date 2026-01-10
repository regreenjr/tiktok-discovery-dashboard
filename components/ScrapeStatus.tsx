'use client'

import { useState, useEffect } from 'react'
import { getTimeAgo } from '@/lib/analytics/insights'
import { ScrapeStatusType, ScrapeStatusInfo } from '@/lib/analytics/types'

interface ScrapeStatusProps {
  brandId: string
}

export function ScrapeStatus({ brandId }: ScrapeStatusProps) {
  const [status, setStatus] = useState<ScrapeStatusInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStatus()
    // Poll for status updates every 10 seconds
    const interval = setInterval(fetchStatus, 10000)
    return () => clearInterval(interval)
  }, [brandId])

  const fetchStatus = async () => {
    try {
      const response = await fetch(`/api/scrape-status?brandId=${brandId}`)
      const data = await response.json()

      if (data.data) {
        const statusInfo = determineStatus(data.data)
        setStatus(statusInfo)
      }
    } catch (error) {
      console.error('[ScrapeStatus] Error fetching status:', error)
    } finally {
      setLoading(false)
    }
  }

  const determineStatus = (data: {
    lastScrapedAt: string | null
    isRunning: boolean
  }): ScrapeStatusInfo => {
    if (data.isRunning) {
      return {
        status: 'scraping',
        lastScrapedAt: data.lastScrapedAt,
        isRunning: true,
        timeAgo: null,
      }
    }

    if (!data.lastScrapedAt) {
      return {
        status: 'never',
        lastScrapedAt: null,
        isRunning: false,
        timeAgo: null,
      }
    }

    const lastScraped = new Date(data.lastScrapedAt)
    const now = new Date()
    const diffHours = (now.getTime() - lastScraped.getTime()) / (1000 * 60 * 60)

    let statusType: ScrapeStatusType
    if (diffHours < 1) {
      statusType = 'fresh'
    } else if (diffHours < 24) {
      statusType = 'recent'
    } else {
      statusType = 'stale'
    }

    return {
      status: statusType,
      lastScrapedAt: data.lastScrapedAt,
      isRunning: false,
      timeAgo: getTimeAgo(data.lastScrapedAt),
    }
  }

  if (loading || !status) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        Loading...
      </span>
    )
  }

  const statusStyles: Record<ScrapeStatusType, string> = {
    fresh: 'bg-green-100 text-green-800 border-green-200',
    recent: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    stale: 'bg-red-100 text-red-800 border-red-200',
    scraping: 'bg-blue-100 text-blue-800 border-blue-200',
    never: 'bg-gray-100 text-gray-600 border-gray-200',
  }

  const statusLabels: Record<ScrapeStatusType, string> = {
    fresh: 'Fresh',
    recent: 'Recent',
    stale: 'Stale',
    scraping: 'Scraping',
    never: 'Never scraped',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        statusStyles[status.status]
      }`}
      title={status.lastScrapedAt ? `Last scraped: ${new Date(status.lastScrapedAt).toLocaleString()}` : 'Never scraped'}
    >
      {status.status === 'scraping' && (
        <span className="mr-1 animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full"></span>
      )}
      {statusLabels[status.status]}
      {status.timeAgo && status.status !== 'scraping' && (
        <span className="ml-1 opacity-75">({status.timeAgo})</span>
      )}
    </span>
  )
}
