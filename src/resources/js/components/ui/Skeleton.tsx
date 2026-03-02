function Bone({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

export function RestaurantCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden flex flex-col h-full">
      <Bone className="h-48 w-full rounded-none" />
      <div className="p-5 flex-grow flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between">
            <Bone className="h-6 w-3/5" />
            <Bone className="h-5 w-14 rounded-full ml-2" />
          </div>
          <Bone className="h-4 w-full mt-3" />
          <Bone className="h-4 w-4/5 mt-2" />
        </div>
        <div className="border-t pt-3 mt-4">
          <div className="flex items-center gap-3">
            <Bone className="h-4 w-24" />
            <Bone className="h-4 w-10" />
            <Bone className="h-4 w-10" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function OwnedRestaurantCardSkeleton() {
  return (
    <div className="border border-gray-200 rounded-lg p-4 flex items-start gap-4 bg-white">
      <Bone className="w-20 h-20 flex-shrink-0" />
      <div className="flex-grow min-w-0">
        <Bone className="h-5 w-2/3 mb-2" />
        <Bone className="h-3 w-1/3 mb-3" />
        <div className="flex gap-2 mt-3">
          <Bone className="h-7 w-12 rounded" />
          <Bone className="h-7 w-12 rounded" />
          <Bone className="h-7 w-16 rounded" />
          <Bone className="h-7 w-12 rounded" />
        </div>
      </div>
    </div>
  );
}

export function ReviewCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
      <div className="flex justify-between items-start mb-2">
        <Bone className="h-5 w-1/3" />
        <Bone className="h-4 w-20" />
      </div>
      <Bone className="h-4 w-24 mb-3" />
      <Bone className="h-20 w-full rounded mb-3" />
      <div className="flex justify-end">
        <Bone className="h-4 w-16" />
      </div>
    </div>
  );
}
