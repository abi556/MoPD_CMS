"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/components/providers/auth-provider";

/** App-wide providers that must survive locale segment changes. */
export function RootProviders({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
