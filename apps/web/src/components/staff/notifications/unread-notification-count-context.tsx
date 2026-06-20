"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "@/i18n/navigation";
import { useSession } from "@/components/providers/auth-provider";
import { getUnreadNotificationCount } from "@/lib/staff/in-app-notifications-api";

const POLL_INTERVAL_MS = 30_000;

type UnreadNotificationCountContextValue = {
  count: number;
  loading: boolean;
  refresh: () => Promise<void>;
};

const UnreadNotificationCountContext =
  createContext<UnreadNotificationCountContextValue | null>(null);

export function UnreadNotificationCountProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading: authLoading } = useSession();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      if (mountedRef.current) {
        setCount(0);
        setLoading(false);
      }
      return;
    }

    try {
      const next = await getUnreadNotificationCount();
      if (mountedRef.current) {
        setCount(next);
      }
    } catch {
      if (mountedRef.current) {
        setCount(0);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    mountedRef.current = true;

    if (authLoading) {
      return () => {
        mountedRef.current = false;
      };
    }

    void refresh();

    const onRefresh = () => {
      void refresh();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };

    window.addEventListener("focus", onRefresh);
    document.addEventListener("visibilitychange", onVisibility);

    let timer: ReturnType<typeof setInterval> | undefined;
    const startPolling = () => {
      if (timer) return;
      timer = setInterval(() => {
        if (document.visibilityState === "visible") {
          void refresh();
        }
      }, POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (timer) {
        clearInterval(timer);
        timer = undefined;
      }
    };

    if (document.visibilityState === "visible") {
      startPolling();
    }

    const onVisPoll = () => {
      if (document.visibilityState === "visible") {
        startPolling();
        void refresh();
      } else {
        stopPolling();
      }
    };
    document.addEventListener("visibilitychange", onVisPoll);

    return () => {
      mountedRef.current = false;
      window.removeEventListener("focus", onRefresh);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("visibilitychange", onVisPoll);
      stopPolling();
    };
  }, [authLoading, refresh]);

  // Re-sync after staff navigation (inbox visit, assignment flows, etc.).
  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return;
    }
    void refresh();
  }, [authLoading, isAuthenticated, pathname, refresh]);

  return (
    <UnreadNotificationCountContext.Provider value={{ count, loading, refresh }}>
      {children}
    </UnreadNotificationCountContext.Provider>
  );
}

export function useUnreadNotificationCount(): UnreadNotificationCountContextValue {
  const ctx = useContext(UnreadNotificationCountContext);
  if (!ctx) {
    throw new Error(
      "useUnreadNotificationCount must be used within UnreadNotificationCountProvider",
    );
  }
  return ctx;
}
