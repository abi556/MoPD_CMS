import type { ButtonHTMLAttributes } from "react";

const baseClassName =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-none font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]";

const variants = {
  primary:
    "bg-primary text-on-primary shadow-sm hover:bg-primary/95 hover:shadow-md",
  brand: "bg-brand-deep text-white shadow-sm hover:bg-brand-deep/90 hover:shadow-md",
  secondary:
    "border border-border-standard bg-surface-container-lowest text-on-surface shadow-sm hover:bg-surface-container-low hover:shadow-md",
  ghost: "text-primary hover:bg-surface-container-low",
} as const;

const sizes = {
  sm: "min-h-9 px-3 py-1.5 text-xs",
  md: "min-h-11 px-4 py-2 text-sm",
  lg: "min-h-12 px-6 py-3 text-base",
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export interface ButtonStyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

export function buttonClassName({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
}: ButtonStyleProps = {}) {
  return [
    baseClassName,
    variants[variant],
    sizes[size],
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonStyleProps {}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      suppressHydrationWarning
      className={buttonClassName({ variant, size, fullWidth, className })}
      {...props}
    />
  );
}
