import React from "react";
import { Skeleton } from "./ui/skeleton";

export const CardSkeleton: React.FC = () => {
  return (
    <div className="group relative flex flex-col bg-gradient-to-br from-[var(--earth-700)] to-[var(--earth-800)] border border-[rgba(245,242,237,0.15)] p-8 rounded-3xl h-[220px] md:min-h-[280px] backdrop-blur-sm animate-pulse">
      <div className="relative z-10 flex flex-col h-full">
        {/* Icon skeleton */}
        <div className="mb-6">
          <Skeleton className="w-16 h-16 rounded-2xl bg-[var(--earth-800)]/80" />
        </div>

        {/* Content skeleton */}
        <div className="flex-1 flex flex-col justify-end space-y-3">
          {/* Title skeleton */}
          <Skeleton className="h-8 w-24 bg-[var(--earth-600)]/60" />

          {/* Description skeleton */}
          <Skeleton className="h-4 w-32 bg-[var(--earth-600)]/40" />

          {/* CTA skeleton */}
          <div className="mt-4">
            <Skeleton className="h-4 w-20 bg-[var(--earth-600)]/30" />
          </div>
        </div>
      </div>
    </div>
  );
};
