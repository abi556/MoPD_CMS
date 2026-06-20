"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStaffThemeOptional } from "@/components/staff/theme/staff-theme-provider";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Staff console styling — required for modals portaled outside `.staff-shell`. */
  tone?: "default" | "staff";
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  tone = "default",
}: DialogProps) {
  const { resolvedTheme } = useStaffThemeOptional();
  const isStaff = tone === "staff";
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;

    previousFocus.current = document.activeElement as HTMLElement;
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previousFocus.current?.focus();
    };
  }, [open, handleKeyDown]);

  if (!open) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isStaff ? "staff-dialog" : ""}`}
      data-theme={isStaff ? resolvedTheme : undefined}
    >
      <button
        type="button"
        className={
          isStaff
            ? "absolute inset-0 bg-black/50 transition-opacity"
            : "absolute inset-0 bg-inverse-surface/40 transition-opacity"
        }
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={
          isStaff
            ? "relative z-10 w-full max-w-lg rounded-xl border border-staff-border/50 bg-staff-surface text-staff-text shadow-staff-card"
            : "relative z-10 w-full max-w-lg border border-border-standard bg-surface-container-lowest shadow-lg"
        }
      >
        <div
          className={
            isStaff
              ? "flex items-start justify-between border-b border-staff-border/40 px-6 py-4"
              : "flex items-start justify-between border-b border-border-standard px-6 py-4"
          }
        >
          <div>
            <h2
              id={titleId}
              className={
                isStaff
                  ? "text-lg font-semibold text-staff-text"
                  : "font-h3 text-h3 text-on-surface"
              }
            >
              {title}
            </h2>
            {description ? (
              <p
                id={descId}
                className={
                  isStaff
                    ? "mt-1 text-sm text-staff-text-muted"
                    : "mt-1 text-sm text-text-secondary"
                }
              >
                {description}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            variant={isStaff ? "staffGhost" : "ghost"}
            size="sm"
            onClick={onClose}
            aria-label="Close"
            className="ml-4 shrink-0"
          >
            <X size={18} aria-hidden />
          </Button>
        </div>
        <div className="px-6 py-4">{children}</div>
        {footer ? (
          <div
            className={
              isStaff
                ? "flex justify-end gap-2 border-t border-staff-border/40 px-6 py-4"
                : "flex justify-end gap-2 border-t border-border-standard px-6 py-4"
            }
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
