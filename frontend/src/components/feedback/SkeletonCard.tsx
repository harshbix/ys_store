import { Skeleton } from '../ui/Skeleton';

export function SkeletonCard() {
  return (
    <div className="bg-surface p-2">
      <Skeleton className="aspect-[4/5] w-full" />
      <Skeleton className="mt-3 h-2.5 w-24" />
      <Skeleton className="mt-2 h-3.5 w-5/6" />
      <Skeleton className="mt-2 h-3.5 w-3/5" />
      <Skeleton className="mt-4 h-4 w-24" />
    </div>
  );
}
