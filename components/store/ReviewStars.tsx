'use client';

import React from 'react';
import { Star } from 'lucide-react';

interface ReviewStarsProps {
  rating: number;
  count?: number;
}

export default function ReviewStars({ rating, count }: ReviewStarsProps) {
  const clampedRating = Math.min(5, Math.max(0, rating));
  const fullStars = Math.floor(clampedRating);
  const hasHalfStar = clampedRating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {/* Filled stars */}
        {Array.from({ length: fullStars }, (_, i) => (
          <Star
            key={`full-${i}`}
            className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400"
          />
        ))}

        {/* Half star */}
        {hasHalfStar && (
          <div className="relative">
            <Star className="h-3.5 w-3.5 text-gray-300" />
            <div className="absolute inset-0 overflow-hidden w-[50%]">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        )}

        {/* Empty stars */}
        {Array.from({ length: emptyStars }, (_, i) => (
          <Star
            key={`empty-${i}`}
            className="h-3.5 w-3.5 text-gray-300"
          />
        ))}
      </div>

      {count !== undefined && (
        <span className="text-xs text-gray-400">({count})</span>
      )}
    </div>
  );
}
