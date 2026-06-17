import type { ReactNode } from "react";

type StaffAlertVariant = "error" | "success" | "info";

const VARIANT_CLASS: Record<StaffAlertVariant, string> = {
  error: "border-danger/30 bg-danger/10 text-danger",
  success: "border-success/30 bg-success/10 text-success",
  info: "border-staff-nav-active/30 bg-staff-nav-active-bg/20 text-staff-nav-active",
};

export function StaffAlert({
  variant = "error",
  children,
}: {
  variant?: StaffAlertVariant;
  children: ReactNode;
}) {
  return (
    <p
      className={`rounded-xl border px-3 py-2 text-sm ${VARIANT_CLASS[variant]}`}
      role={variant === "error" ? "alert" : "status"}
    >
      {children}
    </p>
  );
}
