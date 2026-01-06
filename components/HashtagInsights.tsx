'use client';

import { useEffect, useState } from 'react';

interface HashtagStat {
  hashtag: string;
  count: number;
  avgViews: number;
  avgEngagement: number;
  avgVirality: number;
  totalViews: number;
}

export default function HashtagInsights() {
  const [data, setData] = useState<HashtagStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'views' | 'count' | 'virality'>('virality');

  useEffect(() => {
    loadHashtagData();
  }, []);

  const loadHashtagData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hashtag-insights');
      const hashtagData = await res.json();
      setData(hashtagData);
    } catch (error) {
      console.error('Error loading hashtag insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="text-gray-400">Loading hashtag insights...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">#️⃣ Hashtag Performance</h2>
        <p className="text-gray-400">
          No hashtag data available yet. Videos need captions with hashtags to show insights.
        </p>
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => {
    switch (sortBy) {
      case 'views':
        return b.avgViews - a.avgViews;
      case 'count':
        return b.count - a.count;
      case 'virality':
        return b.avgVirality - a.avgVirality;
      default:
        return 0;
    }
  });

  const topHashtags = sortedData.slice(0, 15);

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">#️⃣ Hashtag Performance</h2>
          <p className="text-gray-400">
            Top {topHashtags.length} hashtags by performance
          </p>
        </div>

        {/* Sort Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('virality')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              sortBy === 'virality'
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            🔥 Virality
          </button>
          <button
            onClick={() => setSortBy('views')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              sortBy === 'views'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            👁️ Views
          </button>
          <button
            onClick={() => setSortBy('count')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              sortBy === 'count'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            📊 Usage
          </button>
        </div>
      </div>

      {/* Hashtag Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
              <th className="pb-3 font-semibold">Hashtag</th>
              <th className="pb-3 font-semibold text-center">Videos</th>
              <th className="pb-3 font-semibold text-right">Avg Views</th>
              <th className="pb-3 font-semibold text-right">Avg Engagement</th>
              <th className="pb-3 font-semibold text-right">Avg Virality</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {topHashtags.map((stat, idx) => (
              <tr key={stat.hashtag} className="hover:bg-gray-700/50 transition-colors">
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">#{idx + 1}</span>
                    <span className="text-blue-400 font-semibold">{stat.hashtag}</span>
                  </div>
                </td>
                <td className="py-3 text-center">
                  <span className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300">
                    {stat.count}
                  </span>
                </td>
                <td className="py-3 text-right text-white">
                  {stat.avgViews.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td className="py-3 text-right text-white">
                  {(stat.avgEngagement * 100).toFixed(2)}%
                </td>
                <td className="py-3 text-right">
                  <span className={`font-semibold ${
                    stat.avgVirality >= 2.0 ? 'text-green-400' :
                    stat.avgVirality >= 1.0 ? 'text-yellow-400' :
                    'text-gray-400'
                  }`}>
                    {stat.avgVirality.toFixed(2)}x
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Key Insight */}
      {topHashtags.length > 0 && (
        <div className="mt-6 bg-blue-900/30 border border-blue-700 rounded-lg p-4">
          <div className="text-blue-300 font-semibold mb-2">💡 Top Hashtag Strategy</div>
          <p className="text-gray-300">
            The top performing hashtag is <strong className="text-white">{topHashtags[0].hashtag}</strong>{' '}
            with an average virality of <strong className="text-white">{topHashtags[0].avgVirality.toFixed(2)}x</strong>{' '}
            across {topHashtags[0].count} video{topHashtags[0].count > 1 ? 's' : ''}.
            Consider using this hashtag in your content strategy!
          </p>
        </div>
      )}
    </div>
  );
}
