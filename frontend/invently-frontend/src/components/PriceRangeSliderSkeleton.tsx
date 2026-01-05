const PriceRangeSliderSkeleton = () => {
  return (
    <div className="space-y-3">
      {/* Header with Price Display skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded animate-shimmer" />
        <div className="flex items-center gap-2">
          <div className="h-4 w-12 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded animate-shimmer" />
          <div className="h-3 w-2 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded animate-shimmer" />
          <div className="h-4 w-16 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded animate-shimmer" />
        </div>
      </div>

      {/* Slider skeleton */}
      <div className="relative h-6">
        {/* Track */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded-full transform -translate-y-1/2 animate-shimmer" />
        
        {/* Thumbs skeleton */}
        <div
          className="absolute top-1/2 w-5 h-5 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded-full transform -translate-y-1/2 animate-shimmer"
          style={{ left: 'calc(0% - 10px)' }}
        />
        <div
          className="absolute top-1/2 w-5 h-5 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded-full transform -translate-y-1/2 animate-shimmer"
          style={{ left: 'calc(100% - 10px)' }}
        />
      </div>
    </div>
  );
};

export default PriceRangeSliderSkeleton;

