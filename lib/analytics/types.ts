export interface Video {
  video_id: string;
  account_handle: string;
  post_type: 'video' | 'slideshow';
  caption: string;
  views: number;
  likes: number;
  comments: number;
  engagement_rate: number;
  virality_score?: number;
  video_url: string;
  images?: string[];
  hook_type?: string;
  content_format?: string;
  emotional_trigger?: string;
}

export interface InsightData {
  insight: string;
  category: string;
  topValue: string;
  metric: number;
  context: string;
  count: number;
  recommendation: string;
}

export interface MetricGroup {
  name: string;
  avgVirality: number;
  avgEngagement: number;
  avgViews: number;
  count: number;
}

export interface TrendData {
  date: string;
  avgVirality: number;
  breakdown: Record<string, number>;
}

export interface TrendIndicator {
  direction: 'up' | 'down' | 'stable';
  change: number;
}
