type SkeletonProps = {
    /** Tailwind size/layout classes, e.g. "h-4 w-3/4" or "h-40 w-full" */
    className?: string;
  };
  
  export function Skeleton({ className = '' }: SkeletonProps) {
    return (
      <div
        className={[
          'animate-pulse-soft rounded-md bg-(--color-ink)/10',
          className,
        ].join(' ')}
        aria-hidden="true"
      />
    );
  }