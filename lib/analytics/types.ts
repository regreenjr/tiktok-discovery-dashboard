// Core entity types

export interface Brand {
  id: string
  name: string
  created_at: string
  updated_at: string
  last_scraped_at: string | null
}

export interface CompetitorAccount {
  id: string
  handle: string
  display_name: string | null
  follower_count: number | null
  is_active: boolean
  category: string | null
  notes: string | null
  created_at: string
  updated_at: string
  brand_id: string
}

export interface Video {
  id: string
  video_id?: string  // Alias for compatibility
  account_id: string
  tiktok_id: string
  description: string
  views: number
  comments: number
  shares: number
  saves: number
  virality_score: number
  engagement_rate?: number  // Calculated engagement
  hook_type: string | null
  format: string | null
  content_format?: string | null  // Alias for format
  emotion: string | null
  emotional_trigger?: string | null  // Alias for emotion
  posted_at: string
  created_at: string
  updated_at: string
}

export interface ScrapeJob {
  id: string
  brand_id: string
  scraper_type: 'competitor' | 'comments' | 'trends' | 'all'
  status: 'pending' | 'running' | 'completed' | 'failed'
  started_at: string
  completed_at: string | null
  error_message: string | null
  accounts_processed: number
  videos_found: number
  created_at: string
}

// Analytics types

export interface TopInsight {
  type: 'hook_type' | 'format' | 'emotion'
  value: string
  avgVirality: number
  count: number
}

export interface PerformanceMetrics {
  viralPercentage: number
  avgVirality: number
  totalVideos: number
  viralVideos: number
}

export interface WorkingNowInsights {
  topFormat: string | null
  topHashtag: string | null
  bestPostingTime: string | null
}

export interface GroupedMetric {
  name: string
  count: number
  avgVirality: number
  totalViews: number
}

export interface MetricGroup {
  name: string
  virality?: number
  engagement?: number
  views?: number
  count: number
}

export interface TrendData {
  date: string
  virality: number
  avgVirality?: number
  engagement: number
  views: number
  breakdown?: Record<string, number>
}

// Scrape status types

export type ScrapeStatusType = 'fresh' | 'recent' | 'stale' | 'scraping' | 'never'

export interface ScrapeStatusInfo {
  status: ScrapeStatusType
  lastScrapedAt: string | null
  isRunning: boolean
  timeAgo: string | null
}

// API response types

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  perPage: number
}
