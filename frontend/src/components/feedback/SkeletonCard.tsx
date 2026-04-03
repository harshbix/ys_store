export function SkeletonCard() {
  return (
    <div className="animate-pulse bg-surface p-2">
      <div className="aspect-[4/5] w-full bg-surfaceElevated" />
      <div className="mt-3 h-2.5 w-24 bg-surfaceElevated" />
      <div className="mt-2 h-3.5 w-5/6 bg-surfaceElevated" />
      <div className="mt-2 h-3.5 w-3/5 bg-surfaceElevated" />
      <div className="mt-4 h-4 w-24 bg-surfaceElevated" />
    </div>
  );
}
