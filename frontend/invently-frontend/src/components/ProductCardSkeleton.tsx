const ProductCardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
      {/* Image skeleton */}
      <div className="aspect-square bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 bg-[length:200%_200%] animate-shimmer" />
      
      {/* Content skeleton */}
      <div className="p-3 sm:p-4 space-y-3">
        {/* Category tag skeleton */}
        <div className="h-4 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded w-20 animate-shimmer" />
        
        {/* Title skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded animate-shimmer" />
          <div className="h-4 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded w-3/4 animate-shimmer" />
        </div>
        
        {/* Price skeleton */}
        <div className="h-6 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded w-24 animate-shimmer" />
      </div>
    </div>
  );
};

export default ProductCardSkeleton;

