'use client';

import { useEffect, useState } from 'react';

interface Video {
  video_id: string;
  account_handle: string;
  caption: string;
  views: number;
  likes: number;
  comments: number;
  engagement_rate: number;
  video_url: string;
}

interface PainPoint {
  category: string;
  extracted_insight: string;
  raw_comment: string;
  keywords: string[];
  sentiment: number;
}

interface Sound {
  name: string;
  author: string;
  video_count: number;
  virality_score: number;
}

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading data:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">🎵 TikTok Discovery Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-2">Total Videos</div>
            <div className="text-3xl font-bold">{data?.stats?.totalVideos || 0}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-2">Pain Points</div>
            <div className="text-3xl font-bold">{data?.stats?.totalInsights || 0}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-2">Trending Sounds</div>
            <div className="text-3xl font-bold">{data?.stats?.totalSounds || 0}</div>
          </div>
        </div>

        {/* Top Videos */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">📈 Top Performing Videos</h2>
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left">Account</th>
                  <th className="px-6 py-3 text-left">Caption</th>
                  <th className="px-6 py-3 text-right">Views</th>
                  <th className="px-6 py-3 text-right">Engagement</th>
                </tr>
              </thead>
              <tbody>
                {data?.videos?.slice(0, 10).map((video: Video) => (
                  <tr key={video.video_id} className="border-t border-gray-700 hover:bg-gray-750">
                    <td className="px-6 py-4">@{video.account_handle}</td>
                    <td className="px-6 py-4 max-w-md truncate">{video.caption}</td>
                    <td className="px-6 py-4 text-right">{video.views.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">{(video.engagement_rate * 100).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Pain Points */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">💡 User Insights</h2>
          <div className="grid gap-4">
            {data?.painPoints?.map((point: PainPoint, idx: number) => (
              <div key={idx} className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-start justify-between mb-2">
                  <span className="px-3 py-1 bg-blue-600 rounded-full text-sm">{point.category}</span>
                  <span className={`text-sm ${point.sentiment >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    Sentiment: {point.sentiment.toFixed(2)}
                  </span>
                </div>
                <p className="text-lg mb-2">{point.extracted_insight}</p>
                <p className="text-gray-400 text-sm italic">&quot;{point.raw_comment}&quot;</p>
                <div className="flex gap-2 mt-3">
                  {point.keywords.map((kw, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-700 rounded text-xs">{kw}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Trending Sounds */}
        <section>
          <h2 className="text-2xl font-bold mb-4">🎵 Trending Sounds</h2>
          <div className="grid grid-cols-3 gap-4">
            {data?.sounds?.map((sound: Sound, idx: number) => (
              <div key={idx} className="bg-gray-800 rounded-lg p-4">
                <div className="font-semibold truncate">{sound.name}</div>
                <div className="text-gray-400 text-sm truncate">{sound.author}</div>
                <div className="mt-2 flex justify-between text-sm">
                  <span>{sound.video_count} videos</span>
                  <span className="text-blue-400">{(sound.virality_score * 100).toFixed(0)}% viral</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
