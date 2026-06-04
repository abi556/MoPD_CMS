import type { ButtonHTMLAttributes } from "react";

const variants = {
  primary:
    "bg-primary text-on-primary hover:opacity-90 focus-visible:ring-focus-ring",
  secondary:
    "border border-border-standard bg-surface-container-lowest text-on-surface hover:bg-surface-container-low focus-visible:ring-focus-ring",
  ghost: "text-primary hover:bg-surface-container-low focus-visible:ring-focus-ring",
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
}

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      suppressHydrationWarning
      className={`inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
