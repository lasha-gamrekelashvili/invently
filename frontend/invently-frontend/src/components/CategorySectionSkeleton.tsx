import ProductCardSkeleton from './ProductCardSkeleton';

const CategorySectionSkeleton = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Category header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-7 sm:h-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg w-48 animate-shimmer" />
        <div className="h-9 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded-lg w-24 animate-shimmer" />
      </div>
      
      {/* Products grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
};

export default CategorySectionSkeleton;

