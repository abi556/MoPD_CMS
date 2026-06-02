"use client";

import { useSession } from "@/components/providers/auth-provider";

export function useAuth() {
  return useSession();
}
