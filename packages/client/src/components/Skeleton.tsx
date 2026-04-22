import { cn } from '@/lib/cn';

interface SkeletonProps {
  className?: string;
  rounded?: boolean;
}

export function Skeleton({ className, rounded }: SkeletonProps) {
  return <div className={cn('skeleton-shimmer', rounded ? 'rounded-md' : '', className)} />;
}

export function SkeletonBookCard() {
  return (
    <div className="bg-white rounded-lg p-3 shadow-soft">
      <Skeleton className="aspect-[3/4] rounded-md" />
      <Skeleton className="h-4 mt-3 w-3/4 rounded" />
      <Skeleton className="h-3 mt-2 w-1/2 rounded" />
    </div>
  );
}
