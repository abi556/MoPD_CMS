import type { InputHTMLAttributes, ReactNode } from "react";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  error?: string;
}

export function Checkbox({
  label,
  error,
  id,
  className = "",
  ...props
}: CheckboxProps) {
  const inputId = id ?? props.name;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className="flex cursor-pointer items-center gap-2.5 text-sm text-on-surface"
      >
        <input
          id={inputId}
          type="checkbox"
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className={`h-4 w-4 rounded border-border-standard text-primary focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 ${className}`}
          {...props}
        />
        {label}
      </label>
      {error ? (
        <p id={errorId} className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
