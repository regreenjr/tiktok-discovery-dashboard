'use client';

import { useEffect, useState } from 'react';

interface ScrapeStatusProps {
  brandId: string;
}

interface ScrapeJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  accounts_processed: number;
}

interface StatusData {
  lastScraped: string | null;
  currentJob: ScrapeJob | null;
  isRunning: boolean;
}

export default function ScrapeStatus({ brandId }: ScrapeStatusProps) {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStatus = async () => {
    try {
      const res = await fetch(`/api/scrape-status?brandId=${brandId}`);
      const data = await res.json();
      setStatus(data);
    } catch (error) {
      console.error('Error loading scrape status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();

    // Poll for updates every 10 seconds if scraping
    const interval = setInterval(() => {
      if (status?.isRunning) {
        loadStatus();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [brandId, status?.isRunning]);

  if (loading || !status) {
    return (
      <div className="text-xs text-gray-500">
        Loading status...
      </div>
    );
  }

  const getTimeAgo = (timestamp: string | null) => {
    if (!timestamp) return 'Never';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getStatusBadge = () => {
    if (status.isRunning) {
      return (
        <span className="px-2 py-1 bg-blue-900/50 border border-blue-600 rounded-full text-xs text-blue-300 flex items-center gap-1">
          <span className="animate-pulse">●</span>
          Scraping...
        </span>
      );
    }

    if (!status.lastScraped) {
      return (
        <span className="px-2 py-1 bg-gray-700 border border-gray-600 rounded-full text-xs text-gray-400">
          No data
        </span>
      );
    }

    const age = new Date().getTime() - new Date(status.lastScraped).getTime();
    const hoursOld = age / (1000 * 60 * 60);

    if (hoursOld < 1) {
      return (
        <span className="px-2 py-1 bg-green-900/50 border border-green-600 rounded-full text-xs text-green-300">
          ✓ Fresh
        </span>
      );
    }

    if (hoursOld < 24) {
      return (
        <span className="px-2 py-1 bg-yellow-900/50 border border-yellow-600 rounded-full text-xs text-yellow-300">
          Recent
        </span>
      );
    }

    return (
      <span className="px-2 py-1 bg-red-900/50 border border-red-600 rounded-full text-xs text-red-300">
        Stale
      </span>
    );
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      {getStatusBadge()}
      <span className="text-gray-400">
        Last updated: {getTimeAgo(status.lastScraped)}
      </span>
    </div>
  );
}
