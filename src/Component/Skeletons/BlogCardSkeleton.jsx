import React from "react";

const BlogCardSkeleton = () => {
  return (
    <div className="card bg-base-100 shadow-sm border border-gray-100 h-full">

      {/* Image skeleton */}
      <div className="skeleton h-56 w-full"></div>

      {/* Body */}
      <div className="card-body space-y-4">

        {/* Title + tag */}
        <div className="flex justify-between items-center">
          <div className="skeleton h-6 w-3/4"></div>
          <div className="skeleton h-5 w-16 rounded-full"></div>
        </div>

        {/* Description lines */}
        <div className="space-y-2">
          <div className="skeleton h-4 w-full"></div>
          <div className="skeleton h-4 w-5/6"></div>
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-2 mt-2">
          <div className="skeleton h-3 w-12"></div>
          <div className="skeleton h-3 w-4"></div>
          <div className="skeleton h-3 w-16"></div>
        </div>

        {/* Action button */}
        <div className="card-actions justify-end mt-4">
          <div className="skeleton h-5 w-20 rounded-full"></div>
        </div>

      </div>
    </div>
  );
};

export default BlogCardSkeleton;
