"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiGet, apiPost, refreshAccessToken } from "@/lib/api-client";
import {
  clearAccessToken,
  clearSessionHint,
  getAccessToken,
  hasSessionHint,
  setAccessToken,
  setSessionHint,
} from "@/lib/auth/token-store";
import type { LoginResponse, SessionUser } from "@/lib/auth/session-types";

interface AuthContextValue {
  user: SessionUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<SessionUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const me = await apiGet<SessionUser>("/auth/me");
      setUser(me);
      return me;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Skip all session-bootstrap requests for anonymous visitors. Without an
      // in-memory access token or a session hint cookie, there is no staff
      // session to restore, so we avoid the 401s on the public portal.
      if (!getAccessToken() && !hasSessionHint()) {
        setIsLoading(false);
        return;
      }

      if (!getAccessToken()) {
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          // The hint is stale (refresh cookie expired/revoked). Clear it so we
          // don't keep retrying on every load.
          clearSessionHint();
          if (!cancelled) {
            setUser(null);
            setIsLoading(false);
          }
          return;
        }
      }
      if (!cancelled) {
        await refreshSession();
        setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshSession]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiPost<LoginResponse>(
      "/auth/login",
      { email, password },
      { auth: false },
    );
    setAccessToken(data.accessToken);
    setSessionHint();
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiPost<{ message: string }>("/auth/logout", undefined, {
        skipRefresh: true,
      });
    } catch {
      /* clear local session even if API fails */
    } finally {
      clearAccessToken();
      clearSessionHint();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      refreshSession,
    }),
    [user, isLoading, login, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSession(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useSession must be used within AuthProvider");
  }
  return ctx;
}
