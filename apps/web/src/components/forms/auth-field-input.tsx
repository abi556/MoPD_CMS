import type { ComponentProps } from "react";

/** Auth form input — suppressHydrationWarning avoids noise from password-manager extensions (e.g. fdprocessedid). */
export function AuthFieldInput(props: ComponentProps<"input">) {
  return <input suppressHydrationWarning {...props} />;
}
