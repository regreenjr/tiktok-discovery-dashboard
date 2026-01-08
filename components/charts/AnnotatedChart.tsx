'use client';

import { ReactNode } from 'react';

interface AnnotatedChartProps {
  title: string;
  annotation?: string;
  children: ReactNode;
}

export default function AnnotatedChart({ title, annotation, children }: AnnotatedChartProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>

      {annotation && (
        <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded-md">
          <p className="text-sm text-blue-200 flex items-start gap-2">
            <span className="text-blue-400">💡</span>
            <span>{annotation}</span>
          </p>
        </div>
      )}

      <div className="mt-4">{children}</div>
    </div>
  );
}
