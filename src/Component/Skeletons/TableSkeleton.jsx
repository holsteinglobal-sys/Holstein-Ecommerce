import React from "react";

const TableSkeleton = ({ rows = 5, columns = 5 }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      {/* Header Skeleton */}
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 rounded-lg w-48" />
          <div className="h-4 bg-gray-100 rounded-lg w-64" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 bg-gray-200 rounded-xl w-32" />
          <div className="h-10 bg-gray-200 rounded-xl w-40" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr className="bg-gray-50/50">
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="py-4">
                  <div className="h-4 bg-gray-100 rounded w-20 mx-auto" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="py-4">
                    <div className="h-4 bg-gray-50 rounded w-3/4 mx-auto" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableSkeleton;
