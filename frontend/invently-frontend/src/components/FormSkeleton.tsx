import React from 'react';

const FormSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center space-x-4">
        <div className="h-5 w-20 bg-gray-200 rounded"></div>
      </div>

      <div className="card p-8">
        {/* Title skeleton */}
        <div className="h-8 w-64 bg-gray-200 rounded mb-8"></div>

        {/* Form fields skeleton */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-12 w-full bg-gray-200 rounded"></div>
            </div>
            <div>
              <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
              <div className="h-12 w-full bg-gray-200 rounded"></div>
            </div>
          </div>

          <div>
            <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
            <div className="h-24 w-full bg-gray-200 rounded"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="h-4 w-16 bg-gray-200 rounded mb-2"></div>
              <div className="h-12 w-full bg-gray-200 rounded"></div>
            </div>
            <div>
              <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-12 w-full bg-gray-200 rounded"></div>
            </div>
            <div>
              <div className="h-4 w-16 bg-gray-200 rounded mb-2"></div>
              <div className="h-12 w-full bg-gray-200 rounded"></div>
            </div>
          </div>

          {/* Buttons skeleton */}
          <div className="flex items-center justify-end space-x-4 pt-6">
            <div className="h-10 w-20 bg-gray-200 rounded"></div>
            <div className="h-10 w-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormSkeleton;
