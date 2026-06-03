"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface OptionsLoadBannerProps {
  message: string;
  variant?: "error" | "warning";
  onRetry?: () => void;
  retrying?: boolean;
}

export function OptionsLoadBanner({
  message,
  variant = "error",
  onRetry,
  retrying = false,
}: OptionsLoadBannerProps) {
  const t = useTranslations("complaintSubmit");
  const styles =
    variant === "warning"
      ? "border-warning/40 bg-warning/10 text-on-surface"
      : "border-danger/40 bg-danger/10 text-danger";

  return (
    <div
      className={`mb-6 flex flex-col gap-3 rounded-md border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${styles}`}
      role="alert"
    >
      <p className="text-body-sm">{message}</p>
      {onRetry ? (
        <Button
          type="button"
          variant="secondary"
          onClick={onRetry}
          disabled={retrying}
          className="shrink-0"
        >
          {retrying ? t("loading") : t("actions.retryOptions")}
        </Button>
      ) : null}
    </div>
  );
}
