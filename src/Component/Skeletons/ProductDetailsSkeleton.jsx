import React from "react";

const ProductDetailsSkeleton = () => {
  return (
    <div className="container mx-auto px-4 pt-5 md:pt-8 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

        {/* LEFT - Image Gallery Skeleton */}
        <div className="space-y-4">
          <div className="skeleton w-full aspect-square rounded-3xl"></div>

          <div className="flex gap-4 overflow-x-auto pb-2">
            {[1,2,3,4].map((i)=>(
              <div key={i} className="skeleton w-20 h-20 rounded-xl flex-shrink-0"></div>
            ))}
          </div>
        </div>

        {/* RIGHT - Info Skeleton */}
        <div className="space-y-6">

          <div className="skeleton h-10 w-3/4 rounded-xl"></div>

          <div className="space-y-3">
            <div className="skeleton h-4 w-full rounded-lg"></div>
            <div className="skeleton h-4 w-full rounded-lg"></div>
            <div className="skeleton h-4 w-2/3 rounded-lg"></div>
          </div>

          <div className="py-8 space-y-4 border-y border-base-200">
            <div className="flex items-baseline gap-4">
              <div className="skeleton h-10 w-32 rounded-xl"></div>
              <div className="skeleton h-6 w-20 rounded-lg"></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="skeleton h-14 w-full rounded-2xl"></div>
              <div className="skeleton h-14 w-full rounded-2xl"></div>
            </div>
          </div>

        </div>
      </div>

      {/* Accordion Skeleton */}
      <div className="mt-12 space-y-4">
        <div className="skeleton h-16 w-full rounded-2xl"></div>
        <div className="skeleton h-16 w-full rounded-2xl"></div>
      </div>

      {/* Reviews Section Skeleton */}
      <div className="mt-20">
        <div className="skeleton h-8 w-48 mb-6 rounded-lg"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1,2].map((i)=>(
            <div key={i} className="skeleton h-40 w-full rounded-3xl"></div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default ProductDetailsSkeleton;
