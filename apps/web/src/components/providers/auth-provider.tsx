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
import type {
  LoginResult,
  LoginSessionPayload,
  SessionUser,
} from "@/lib/auth/session-types";

interface RawLoginResponse {
  mfaRequired?: boolean;
  mfaToken?: string;
  accessToken?: string;
  user?: SessionUser;
  expiresIn?: number;
  mustChangePassword?: boolean;
}

function mapLoginResponse(data: RawLoginResponse): LoginResult {
  if (data.mfaRequired && data.mfaToken) {
    return {
      kind: "mfa",
      mfaToken: data.mfaToken,
      mustChangePassword: Boolean(data.mustChangePassword),
    };
  }
  if (!data.accessToken || !data.user) {
    throw new Error("Invalid login response");
  }
  return {
    kind: "session",
    accessToken: data.accessToken,
    expiresIn: data.expiresIn ?? 0,
    user: data.user,
    mustChangePassword: Boolean(data.mustChangePassword),
  };
}

function applySession(payload: LoginSessionPayload) {
  setAccessToken(payload.accessToken);
  setSessionHint();
}

interface AuthContextValue {
  user: SessionUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  verifyMfa: (
    mfaToken: string,
    body: { code?: string; backupCode?: string },
  ) => Promise<LoginSessionPayload>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<{ message: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<SessionUser | null>;
  setUserFromSession: (user: SessionUser) => void;
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
      if (!getAccessToken() && !hasSessionHint()) {
        setIsLoading(false);
        return;
      }

      if (!getAccessToken()) {
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
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

  const setUserFromSession = useCallback((next: SessionUser) => {
    setUser(next);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiPost<RawLoginResponse>(
      "/auth/login",
      { email, password },
      { auth: false },
    );
    const result = mapLoginResponse(data);
    if (result.kind === "session") {
      applySession(result);
      setUser(result.user);
    }
    return result;
  }, []);

  const verifyMfa = useCallback(
    async (
      mfaToken: string,
      body: { code?: string; backupCode?: string },
    ): Promise<LoginSessionPayload> => {
      const data = await apiPost<RawLoginResponse>("/auth/mfa/verify", body, {
        auth: true,
        bearerToken: mfaToken,
        skipRefresh: true,
      });
      if (!data.accessToken || !data.user) {
        throw new Error("Invalid MFA verify response");
      }
      const payload: LoginSessionPayload = {
        accessToken: data.accessToken,
        expiresIn: data.expiresIn ?? 0,
        user: data.user,
        mustChangePassword: Boolean(data.mustChangePassword),
      };
      applySession(payload);
      setUser(payload.user);
      return payload;
    },
    [],
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      return apiPost<{ message: string }>("/auth/change-password", {
        currentPassword,
        newPassword,
      });
    },
    [],
  );

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
      verifyMfa,
      changePassword,
      logout,
      refreshSession,
      setUserFromSession,
    }),
    [
      user,
      isLoading,
      login,
      verifyMfa,
      changePassword,
      logout,
      refreshSession,
      setUserFromSession,
    ],
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
