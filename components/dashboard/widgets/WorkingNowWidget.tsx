'use client';

import { useMemo } from 'react';
import { Video } from '@/lib/analytics/types';
import { groupByMetric } from '@/lib/analytics/insights';
import SparklineChart from '@/components/charts/SparklineChart';

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

interface WorkingNowWidgetProps {
  videos: Video[];
  hashtags?: HashtagStat[];
  sounds?: Sound[];
}

export default function WorkingNowWidget({ videos, hashtags = [], sounds = [] }: WorkingNowWidgetProps) {
  const topFormat = useMemo(() => {
    const formats = groupByMetric(videos, 'content_format');
    if (formats.length === 0) return null;

    const top = formats[0];
    const winRate = (top.count / videos.length) * 100;

    return {
      name: top.name,
      winRate: winRate.toFixed(0),
      avgVirality: top.avgVirality.toFixed(1),
    };
  }, [videos]);

  const topHashtag = useMemo(() => {
    if (hashtags.length === 0) return null;
    const sorted = [...hashtags].sort((a, b) => b.avgVirality - a.avgVirality);
    return sorted[0];
  }, [hashtags]);

  const topSound = useMemo(() => {
    if (sounds.length === 0) return null;
    const sorted = [...sounds].sort((a, b) => b.virality_score - a.virality_score);
    return sorted[0];
  }, [sounds]);

  // Mock sparkline data
  const sparklineData = [2.1, 2.3, 2.0, 2.4, 2.6, 2.5, 2.8];

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 h-[250px] flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">⚡</span>
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
            Working Now
          </h3>
        </div>

        <div className="space-y-4">
          {/* Top Format */}
          {topFormat && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Top Format</p>
                <p className="text-lg font-bold text-white">{topFormat.name}</p>
                <p className="text-xs text-gray-400">{topFormat.winRate}% win rate</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-green-400">{topFormat.avgVirality}x</p>
                <SparklineChart data={sparklineData} color="#10B981" width={60} height={20} />
              </div>
            </div>
          )}

          {/* Top Hashtag or Sound */}
          {topHashtag ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Top Hashtag</p>
                <p className="text-lg font-bold text-white">#{topHashtag.hashtag}</p>
                <p className="text-xs text-gray-400">{topHashtag.count} videos</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-blue-400">{topHashtag.avgVirality.toFixed(1)}x</p>
              </div>
            </div>
          ) : topSound ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Trending Sound</p>
                <p className="text-sm font-bold text-white truncate max-w-[180px]">{topSound.name}</p>
                <p className="text-xs text-gray-400">{topSound.video_count} videos</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-purple-400">{topSound.virality_score.toFixed(1)}x</p>
              </div>
            </div>
          ) : null}

          {/* Best Time (Placeholder) */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-700">
            <div>
              <p className="text-xs text-gray-400 mb-1">Peak Activity</p>
              <p className="text-lg font-bold text-white">6-9 PM</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Best engagement</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
