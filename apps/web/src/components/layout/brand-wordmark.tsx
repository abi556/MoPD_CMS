import type { ReactNode } from "react";

interface BrandWordmarkProps {
  /** e.g. " CMS" — shown after MoPD */
  suffix?: ReactNode;
  className?: string;
}

/** Ministry wordmark: MoPD (lowercase o, same size as M/P/D). */
export function BrandWordmark({ suffix, className = "" }: BrandWordmarkProps) {
  const label =
    typeof suffix === "string"
      ? `MoPD${suffix}`
      : suffix
        ? "MoPD"
        : "MoPD";

  return (
    <span className={`normal-case ${className}`.trim()} aria-label={label}>
      MoPD
      {suffix}
    </span>
  );
}
