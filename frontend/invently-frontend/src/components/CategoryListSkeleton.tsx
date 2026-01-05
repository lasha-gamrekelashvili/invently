const CategoryListSkeleton = () => {
  return (
    <div className="space-y-2">
      {/* Category items with varying widths for natural look */}
      {[
        { width: 'w-40', indent: false },
        { width: 'w-36', indent: true },
        { width: 'w-32', indent: true },
        { width: 'w-44', indent: false },
        { width: 'w-28', indent: true },
        { width: 'w-38', indent: false },
        { width: 'w-42', indent: false },
        { width: 'w-30', indent: true },
      ].map((item, i) => (
        <div
          key={i}
          className={`flex items-center py-2 px-3 ${item.indent ? 'ml-4' : ''}`}
        >
          {/* Expand/collapse icon placeholder */}
          <div className="w-4 h-4 mr-2 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded animate-shimmer" />
          
          {/* Category name skeleton */}
          <div className={`h-4 ${item.width} bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded animate-shimmer`} />
        </div>
      ))}
    </div>
  );
};

export default CategoryListSkeleton;

