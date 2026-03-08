function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-beige-papier/60 ${className}`}
    />
  );
}

export function FilmCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded bg-creme-ecran shadow">
      {/* Poster shimmer */}
      <Shimmer className="aspect-[2/3] w-full rounded-none" />
      {/* Info shimmer */}
      <div className="p-3">
        <Shimmer className="mb-2 h-5 w-3/4" />
        <Shimmer className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export function ShowtimeChipSkeleton() {
  return <Shimmer className="inline-block h-8 w-20 rounded-lg" />;
}

interface FilmGridSkeletonProps {
  count?: number;
}

export function FilmGridSkeleton({ count = 8 }: FilmGridSkeletonProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
      {Array.from({ length: count }, (_, i) => (
        <FilmCardSkeleton key={i} />
      ))}
    </div>
  );
}
