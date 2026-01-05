// Competitor account from database
export interface CompetitorAccount {
  id: string;
  handle: string;
  category: string;
  is_active: boolean;
}

// Video discovered from competitor
export interface CompetitorVideo {
  account_id: string | null;
  account_handle: string;
  video_id: string;
  video_url: string;
  caption: string;
  hashtags: string[];
  sound_id: string | null;
  sound_name: string | null;
  duration_seconds: number | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagement_rate: number;
  discovered_at: string;
  analyzed: boolean;
}

// Pain point extracted from comments
export interface PainPoint {
  source_video_id: string;
  raw_comment: string;
  category: 'pain_point' | 'objection' | 'question' | 'feature_request' | 'complaint';
  extracted_insight: string;
  keywords: string[];
  sentiment: number;
  upvotes: number;
  used_in_content: boolean;
}

// Trending asset (sound or hashtag)
export interface TrendingAsset {
  asset_type: 'sound' | 'hashtag';
  tiktok_id: string;
  name: string;
  author: string | null;
  virality_score: number;
  video_count: number;
  niche_relevance: number;
  is_active: boolean;
}

// Apify TikTok video result (from Api Dojo scraper)
export interface ApifyTikTokVideo {
  id: string;
  title?: string;
  hashtags?: string[];
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  channel?: {
    username?: string;
    id?: string;
  };
  song?: {
    id?: string;
    title?: string;
    artist?: string;
  };
  video?: {
    duration?: number;
  };
  postPage?: string;
}

// Apify comment result
export interface ApifyComment {
  text?: string;
  comment?: string;
  diggCount?: number;
  likes?: number;
  uniqueId?: string;
  username?: string;
  videoUrl?: string;
  postUrl?: string;
}
