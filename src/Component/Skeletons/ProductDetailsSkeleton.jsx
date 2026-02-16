import React from "react";

const ProductDetailsSkeleton = () => {
  return (
    <div className="container mx-auto px-4 pt-20 md:pt-32 pb-20 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* LEFT - Image Gallery Skeleton */}
        <div className="space-y-4">
          <div className="aspect-square w-full bg-gray-200 rounded-3xl" />
          <div className="flex gap-4 overflow-x-auto pb-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-20 h-20 bg-gray-100 rounded-xl flex-shrink-0" />
            ))}
          </div>
        </div>

        {/* RIGHT - Info Skeleton */}
        <div className="space-y-6">
          <div className="h-10 bg-gray-200 rounded-xl w-3/4" />
          
          <div className="space-y-3">
            <div className="h-4 bg-gray-100 rounded-lg w-full" />
            <div className="h-4 bg-gray-100 rounded-lg w-full" />
            <div className="h-4 bg-gray-100 rounded-lg w-2/3" />
          </div>

          <div className="py-8 space-y-4 border-t border-b border-gray-100">
            <div className="flex items-baseline gap-4">
              <div className="h-10 bg-gray-200 rounded-xl w-32" />
              <div className="h-6 bg-gray-100 rounded-lg w-20" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="h-14 bg-gray-200 rounded-2xl w-full" />
              <div className="h-14 bg-gray-900/10 rounded-2xl w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Accordion Skeleton */}
      <div className="mt-12 space-y-4">
        <div className="h-16 bg-gray-50 rounded-2xl w-full" />
        <div className="h-16 bg-gray-50 rounded-2xl w-full" />
      </div>

      {/* Reviews Section Skeleton */}
      <div className="mt-20">
        <div className="h-8 bg-gray-200 rounded-lg w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-gray-50 rounded-3xl w-full" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsSkeleton;
