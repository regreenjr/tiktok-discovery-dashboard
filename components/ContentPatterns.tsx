'use client';

import { useState } from 'react';

export default function ContentPatterns() {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    analyzed: number;
    message: string;
  } | null>(null);

  const handleAnalyze = async () => {
    if (!confirm('This will analyze top 20 videos using Claude API. This uses API credits. Continue?')) {
      return;
    }

    setAnalyzing(true);
    setResult(null);

    try {
      const res = await fetch('/api/analyze-videos', {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        setResult({
          analyzed: data.analyzed || 0,
          message: data.message || 'Analysis complete',
        });
        // Refresh the page after a short delay to show updated patterns
        setTimeout(() => window.location.reload(), 2000);
      } else {
        alert(`Error: ${data.error || 'Failed to analyze videos'}`);
      }
    } catch (error) {
      console.error('Error analyzing videos:', error);
      alert('Failed to analyze videos. Check console for details.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">🧠 AI Content Pattern Analysis</h2>
          <p className="text-gray-400">
            Analyze top-performing videos to identify winning patterns (hooks, formats, emotional triggers)
          </p>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            analyzing
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {analyzing ? '⏳ Analyzing...' : '🚀 Analyze Top Videos with AI'}
        </button>
      </div>

      {result && (
        <div className="mt-4 bg-green-900/30 border border-green-700 rounded-lg p-4">
          <div className="text-green-300 font-semibold mb-1">✅ Analysis Complete</div>
          <p className="text-gray-300">
            {result.message} - Page will refresh to show insights.
          </p>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        💡 Tip: AI patterns appear as badges on video cards after analysis (e.g., "🎣 Question", "📹 Tutorial", "💡 PainPoint")
      </div>
    </div>
  );
}
