'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import ContentPatterns from '@/components/ContentPatterns';
import HashtagInsights from '@/components/HashtagInsights';
import FilterBar, { FilterOptions } from '@/components/FilterBar';

interface Video {
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

interface Brand {
  id: string;
  name: string;
}

export default function Dashboard() {
  const { user, signOut, loading: authLoading } = useAuth();
  const [data, setData] = useState<any>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [postTypeFilter, setPostTypeFilter] = useState<'all' | 'video' | 'slideshow'>('all');
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    hookType: '',
    contentFormat: '',
    emotionalTrigger: '',
    minVirality: 0,
    minViews: 0,
    minEngagement: 0,
    accountId: '',
    postType: '',
  });

  useEffect(() => {
    loadBrands();
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedBrand]);

  const loadBrands = async () => {
    const res = await fetch('/api/brands');
    const data = await res.json();
    setBrands(data);
  };

  const loadData = async () => {
    setLoading(true);
    const url = selectedBrand && selectedBrand !== 'all'
      ? `/api/data?brandId=${selectedBrand}`
      : '/api/data';

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading data:', err);
        setLoading(false);
      });
  };

  const applyFilters = (videos: Video[]) => {
    if (!videos) return [];

    return videos.filter((video) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const captionMatch = video.caption?.toLowerCase().includes(searchLower);
        if (!captionMatch) return false;
      }

      // AI Pattern filters
      if (filters.hookType && video.hook_type !== filters.hookType) return false;
      if (filters.contentFormat && video.content_format !== filters.contentFormat) return false;
      if (filters.emotionalTrigger && video.emotional_trigger !== filters.emotionalTrigger) return false;

      // Performance filters
      if (filters.minVirality > 0 && (video.virality_score || 0) < filters.minVirality) return false;
      if (filters.minViews > 0 && video.views < filters.minViews) return false;
      if (filters.minEngagement > 0 && video.engagement_rate < filters.minEngagement) return false;

      // Account filter
      if (filters.accountId && video.account_handle !== filters.accountId) return false;

      // Post type filter
      if (filters.postType && video.post_type !== filters.postType) return false;
      if (postTypeFilter !== 'all' && video.post_type !== postTypeFilter) return false;

      return true;
    });
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Auth provider will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">🎵 TikTok Discovery Dashboard</h1>
          <div className="flex gap-4 items-center">
            <div className="text-gray-400 text-sm">
              {user.email}
            </div>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-4 py-2 bg-gray-800 rounded border border-gray-700"
            >
              <option value="all">All Brands</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
            <select
              value={postTypeFilter}
              onChange={(e) => setPostTypeFilter(e.target.value as 'all' | 'video' | 'slideshow')}
              className="px-4 py-2 bg-gray-800 rounded border border-gray-700"
            >
              <option value="all">All Types</option>
              <option value="video">Videos Only</option>
              <option value="slideshow">Slideshows Only</option>
            </select>
            <Link
              href="/manage"
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
            >
              Manage
            </Link>
            <button
              onClick={signOut}
              className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
            >
              Sign Out
            </button>
          </div>
        </div>

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

        {/* Week 2: AI Content Pattern Analysis */}
        <div className="mb-12">
          <ContentPatterns />
        </div>

        {/* Week 3: Hashtag Performance Insights */}
        <div className="mb-12">
          <HashtagInsights />
        </div>

        {/* Week 3: Advanced Search & Filters */}
        <FilterBar
          onFilterChange={setFilters}
          accounts={data?.videos?.map((v: Video) => ({
            id: v.account_handle,
            username: v.account_handle,
          })).filter((acc: any, idx: number, arr: any[]) =>
            arr.findIndex((a) => a.id === acc.id) === idx
          ) || []}
        />

        {/* Top Videos */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">📈 Top Performing Videos</h2>
          <div className="grid gap-4">
            {applyFilters(data?.videos || [])
              .slice(0, 10)
              .map((video: Video) => (
                <div key={video.video_id} className="bg-gray-800 rounded-lg p-6">
                  <div className="flex gap-4">
                    {/* Slideshow Images or Video Indicator */}
                    <div className="flex-shrink-0 w-32 h-32 bg-gray-700 rounded-lg overflow-hidden">
                      {video.post_type === 'slideshow' && video.images && video.images.length > 0 ? (
                        <img
                          src={`${video.images[0]}?v=${Date.now()}`}
                          alt="Slideshow preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          {video.post_type === 'slideshow' ? '📸' : '🎥'}
                        </div>
                      )}
                    </div>

                    {/* Video Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">@{video.account_handle}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            video.post_type === 'slideshow'
                              ? 'bg-purple-600'
                              : 'bg-blue-600'
                          }`}>
                            {video.post_type === 'slideshow' ? '📸 Slideshow' : '🎥 Video'}
                            {video.post_type === 'slideshow' && video.images && ` (${video.images.length})`}
                          </span>
                        </div>
                        <a
                          href={video.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          View on TikTok →
                        </a>
                      </div>
                      <p className="text-gray-300 mb-3">{video.caption}</p>

                      {/* AI Pattern Badges */}
                      {(video.hook_type || video.content_format || video.emotional_trigger) && (
                        <div className="flex gap-2 mb-3 flex-wrap">
                          {video.hook_type && (
                            <span className="px-2 py-1 bg-blue-900/50 border border-blue-700 rounded text-xs text-blue-300">
                              🎣 {video.hook_type}
                            </span>
                          )}
                          {video.content_format && (
                            <span className="px-2 py-1 bg-purple-900/50 border border-purple-700 rounded text-xs text-purple-300">
                              📹 {video.content_format}
                            </span>
                          )}
                          {video.emotional_trigger && (
                            <span className="px-2 py-1 bg-green-900/50 border border-green-700 rounded text-xs text-green-300">
                              💡 {video.emotional_trigger}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex gap-6 text-sm text-gray-400">
                        <span>👁️ {video.views.toLocaleString()} views</span>
                        <span>❤️ {video.likes.toLocaleString()} likes</span>
                        <span>💬 {video.comments.toLocaleString()} comments</span>
                        <span>📊 {(video.engagement_rate * 100).toFixed(2)}% engagement</span>
                        {video.virality_score && (
                          <span className={`font-semibold ${
                            video.virality_score >= 2.0 ? 'text-green-400' :
                            video.virality_score >= 1.0 ? 'text-yellow-400' :
                            'text-gray-400'
                          }`}>
                            🔥 {video.virality_score.toFixed(2)}x
                          </span>
                        )}
                      </div>

                      {/* Slideshow Image Gallery */}
                      {video.post_type === 'slideshow' && video.images && video.images.length > 1 && (
                        <div className="mt-3 flex gap-2 overflow-x-auto">
                          {video.images.slice(1, 5).map((img, idx) => (
                            <img
                              key={idx}
                              src={`${img}?v=${Date.now()}`}
                              alt={`Slide ${idx + 2}`}
                              className="w-16 h-16 object-cover rounded"
                            />
                          ))}
                          {video.images.length > 5 && (
                            <div className="w-16 h-16 bg-gray-700 rounded flex items-center justify-center text-xs">
                              +{video.images.length - 5}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
