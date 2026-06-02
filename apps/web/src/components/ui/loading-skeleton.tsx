export function LoadingSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-surface-container-highest ${className}`}
      aria-hidden="true"
    />
  );
}
