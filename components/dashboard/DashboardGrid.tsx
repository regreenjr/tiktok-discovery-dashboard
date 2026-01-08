'use client';

import { Video } from '@/lib/analytics/types';
import TopInsightCard from './widgets/TopInsightCard';
import PerformanceSummary from './widgets/PerformanceSummary';
import WorkingNowWidget from './widgets/WorkingNowWidget';

interface HashtagStat {
  hashtag: string;
  count: number;
  avgViews: number;
  avgEngagement: number;
  avgVirality: number;
  totalViews: number;
}

interface Sound {
  name: string;
  author: string;
  video_count: number;
  virality_score: number;
}

interface DashboardGridProps {
  videos: Video[];
  hashtags?: HashtagStat[];
  sounds?: Sound[];
  onFilterClick?: (category: string, value: string) => void;
}

export default function DashboardGrid({
  videos,
  hashtags = [],
  sounds = [],
  onFilterClick
}: DashboardGridProps) {
  return (
    <div className="space-y-6">
      {/* Hero Row - Layer 1: 5-Second Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <TopInsightCard videos={videos} onFilterClick={onFilterClick} />
        <PerformanceSummary videos={videos} />
        <WorkingNowWidget videos={videos} hashtags={hashtags} sounds={sounds} />
      </div>

      {/* Placeholder for future rows */}
      {/* Charts Row - Layer 2: Visual Comparisons */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HookPerformanceChart videos={videos} />
        <FormatComparisonChart videos={videos} />
      </div> */}

      {/* Trend Row - Layer 3: Time-Based Patterns */}
      {/* <div className="grid grid-cols-1 gap-6">
        <ViralityTrendChart videos={videos} />
      </div> */}

      {/* Compact Widgets Row - Layer 4: Progressive Disclosure */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <HashtagsCompact hashtags={hashtags} />
        <PainPointsCompact painPoints={painPoints} />
        <SoundsCompact sounds={sounds} />
      </div> */}
    </div>
  );
}
