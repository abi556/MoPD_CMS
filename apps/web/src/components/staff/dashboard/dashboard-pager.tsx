"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const iconButtonClass =
  "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-staff-border/80 bg-staff-shell/40 text-staff-text-muted transition-colors hover:border-staff-nav-active/35 hover:bg-staff-nav-hover hover:text-staff-nav-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-staff-nav-active/40 focus-visible:ring-offset-2 focus-visible:ring-offset-staff-surface disabled:cursor-not-allowed disabled:border-staff-border/60 disabled:bg-transparent disabled:text-staff-text-muted/35 disabled:hover:bg-transparent disabled:hover:text-staff-text-muted/35";

export function StaffPagerIconButton({
  direction,
  disabled,
  label,
  onClick,
}: {
  direction: "previous" | "next";
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      className={iconButtonClass}
      disabled={disabled}
      aria-label={label}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
    </button>
  );
}

export function DashboardSidePager({
  onPrevious,
  onNext,
  previousDisabled,
  nextDisabled,
  previousLabel,
  nextLabel,
  children,
  align = "center",
}: {
  onPrevious: () => void;
  onNext: () => void;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
  previousLabel: string;
  nextLabel: string;
  children: ReactNode;
  /** Vertical alignment of side buttons relative to content. */
  align?: "center" | "end";
}) {
  return (
    <div
      className={`flex gap-1 ${align === "end" ? "items-end" : "items-center"}`}
    >
      <StaffPagerIconButton
        direction="previous"
        disabled={previousDisabled}
        label={previousLabel}
        onClick={onPrevious}
      />
      <div className="min-w-0 flex-1">{children}</div>
      <StaffPagerIconButton
        direction="next"
        disabled={nextDisabled}
        label={nextLabel}
        onClick={onNext}
      />
    </div>
  );
}

export function DashboardPager({
  onPrevious,
  onNext,
  previousDisabled,
  nextDisabled,
  previousLabel,
  nextLabel,
  center,
}: {
  onPrevious: () => void;
  onNext: () => void;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
  previousLabel: string;
  nextLabel: string;
  center?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      <StaffPagerIconButton
        direction="previous"
        disabled={previousDisabled}
        label={previousLabel}
        onClick={onPrevious}
      />

      {center ? (
        <div className="min-w-[4.5rem] text-center text-xs text-staff-text-muted">
          {center}
        </div>
      ) : null}

      <StaffPagerIconButton
        direction="next"
        disabled={nextDisabled}
        label={nextLabel}
        onClick={onNext}
      />
    </div>
  );
}

export function DashboardPagerDots({
  total,
  activeIndex,
}: {
  total: number;
  activeIndex: number;
}) {
  if (total <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-1.5" aria-hidden>
      {Array.from({ length: total }).map((_, index) => (
        <span
          key={index}
          className={`h-1.5 rounded-full transition-all ${
            index === activeIndex
              ? "w-4 bg-staff-nav-active"
              : "w-1.5 bg-staff-border"
          }`}
        />
      ))}
    </div>
  );
}
