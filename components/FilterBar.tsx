'use client';

import { useState } from 'react';

export interface FilterOptions {
  search: string;
  hookType: string;
  contentFormat: string;
  emotionalTrigger: string;
  minVirality: number;
  minViews: number;
  minEngagement: number;
  accountId: string;
  postType: string;
}

interface FilterBarProps {
  onFilterChange: (filters: FilterOptions) => void;
  accounts: Array<{ id: string; username: string }>;
}

export default function FilterBar({ onFilterChange, accounts }: FilterBarProps) {
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

  const handleFilterChange = (updates: Partial<FilterOptions>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const resetFilters = () => {
    const defaultFilters: FilterOptions = {
      search: '',
      hookType: '',
      contentFormat: '',
      emotionalTrigger: '',
      minVirality: 0,
      minViews: 0,
      minEngagement: 0,
      accountId: '',
      postType: '',
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">🔍 Search & Filters</h3>
        <button
          onClick={resetFilters}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Reset All
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search captions or hashtags..."
          value={filters.search}
          onChange={(e) => handleFilterChange({ search: e.target.value })}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* AI Pattern Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Hook Type</label>
          <select
            value={filters.hookType}
            onChange={(e) => handleFilterChange({ hookType: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All Hooks</option>
            <option value="Question">🎣 Question</option>
            <option value="Shock">⚡ Shock</option>
            <option value="Tutorial">📚 Tutorial</option>
            <option value="Story">📖 Story</option>
            <option value="Stat">📊 Stat</option>
            <option value="Problem">💡 Problem</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Content Format</label>
          <select
            value={filters.contentFormat}
            onChange={(e) => handleFilterChange({ contentFormat: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All Formats</option>
            <option value="Tutorial">📹 Tutorial</option>
            <option value="BeforeAfter">🔄 Before/After</option>
            <option value="Meme">😂 Meme</option>
            <option value="ProductDemo">🛍️ Product Demo</option>
            <option value="Storytime">📖 Storytime</option>
            <option value="Listicle">📝 Listicle</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Emotional Trigger</label>
          <select
            value={filters.emotionalTrigger}
            onChange={(e) => handleFilterChange({ emotionalTrigger: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All Emotions</option>
            <option value="PainPoint">😣 Pain Point</option>
            <option value="Aspiration">✨ Aspiration</option>
            <option value="Curiosity">🤔 Curiosity</option>
            <option value="Humor">😄 Humor</option>
            <option value="FOMO">⏰ FOMO</option>
            <option value="Relief">😌 Relief</option>
          </select>
        </div>
      </div>

      {/* Performance Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Min Virality: {filters.minVirality}x
          </label>
          <input
            type="range"
            min="0"
            max="5"
            step="0.5"
            value={filters.minVirality}
            onChange={(e) => handleFilterChange({ minVirality: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Min Views</label>
          <select
            value={filters.minViews}
            onChange={(e) => handleFilterChange({ minViews: parseInt(e.target.value) })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="0">Any</option>
            <option value="1000">1K+</option>
            <option value="10000">10K+</option>
            <option value="50000">50K+</option>
            <option value="100000">100K+</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Min Engagement</label>
          <select
            value={filters.minEngagement}
            onChange={(e) => handleFilterChange({ minEngagement: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="0">Any</option>
            <option value="0.02">2%+</option>
            <option value="0.05">5%+</option>
            <option value="0.10">10%+</option>
          </select>
        </div>
      </div>

      {/* Account and Post Type Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Account</label>
          <select
            value={filters.accountId}
            onChange={(e) => handleFilterChange({ accountId: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All Accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                @{account.username}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Post Type</label>
          <select
            value={filters.postType}
            onChange={(e) => handleFilterChange({ postType: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All Types</option>
            <option value="video">📹 Video</option>
            <option value="slideshow">📸 Slideshow</option>
          </select>
        </div>
      </div>
    </div>
  );
}
