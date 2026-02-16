import React from "react";

const ProductCardSkeleton = () => {
  return (
    <div className="w-full h-full">
      <div className="relative flex flex-col w-full h-full bg-white rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Image Skeleton */}
        <div className="h-40 sm:h-52 md:h-64 lg:h-72 w-full skeleton" />

        {/* Content Skeleton */}
        <div className="flex-1 p-3 sm:p-4 md:p-6 flex flex-col gap-4">

          {/* Title + category */}
          <div className="flex flex-col gap-2">
            <div className="skeleton h-4 w-3/4"></div>
            <div className="skeleton h-3 w-1/4"></div>
          </div>

          {/* Spacer */}
          <div className="flex-grow"></div>

          {/* Price section */}
          <div className="flex flex-col gap-2">
            <div className="skeleton h-6 w-20"></div>
            <div className="skeleton h-3 w-12"></div>
          </div>

          {/* Button Skeleton */}
          <div className="skeleton h-10 md:h-12 w-full rounded-xl md:rounded-2xl"></div>

        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
