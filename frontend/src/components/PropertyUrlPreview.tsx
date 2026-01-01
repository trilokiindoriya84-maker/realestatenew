'use client';

import { ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { getPropertyUrl } from '@/utils/propertyUrl';

interface PropertyUrlPreviewProps {
  slug: string;
  uniqueId: string;
  className?: string;
}

export default function PropertyUrlPreview({ slug, uniqueId, className = '' }: PropertyUrlPreviewProps) {
  const [copied, setCopied] = useState(false);
  const url = getPropertyUrl(slug, uniqueId);
  const fullUrl = `${window.location.origin}${url}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleOpen = () => {
    window.open(url, '_blank');
  };

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-blue-900 mb-1">Property URL</p>
          <p className="text-sm text-blue-700 break-all font-mono">{fullUrl}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-blue-100 rounded-lg transition"
            title="Copy URL"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4 text-blue-600" />
            )}
          </button>
          <button
            onClick={handleOpen}
            className="p-2 hover:bg-blue-100 rounded-lg transition"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4 text-blue-600" />
          </button>
        </div>
      </div>
      <p className="text-xs text-blue-600 mt-2">
        ✓ SEO-optimized URL with property title and unique ID
      </p>
    </div>
  );
}
