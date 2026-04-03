export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-surface p-3">
      <div className="aspect-[4/3] w-full rounded-xl bg-surfaceElevated" />
      <div className="mt-3 h-3 w-20 rounded bg-surfaceElevated" />
      <div className="mt-2 h-4 w-5/6 rounded bg-surfaceElevated" />
      <div className="mt-2 h-4 w-3/5 rounded bg-surfaceElevated" />
      <div className="mt-4 h-5 w-28 rounded bg-surfaceElevated" />
    </div>
  );
}
