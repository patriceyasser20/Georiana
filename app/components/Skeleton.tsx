export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-3xl overflow-hidden border bg-white">
      <Skeleton className="w-full aspect-[4/5] rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    </div>
  );
}