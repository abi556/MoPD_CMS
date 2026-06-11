import type { ReactNode } from "react";

/** Auth routes supply their own shell (login split layout, AuthShell on other pages). */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return children;
}
