"use client";

import { Suspense, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { resolveApiV1Prefix } from "../../../lib/api-origin";

function parseApiError(body: unknown, fallback: string): string {
  if (
    body &&
    typeof body === "object" &&
    "error" in body &&
    typeof (body as { error?: { message?: unknown } }).error?.message ===
      "string"
  ) {
    return (body as { error: { message: string } }).error.message;
  }
  return fallback;
}

function parseSuccessMessage(body: unknown, fallback: string): string {
  if (
    body &&
    typeof body === "object" &&
    "data" in body &&
    typeof (body as { data?: unknown }).data === "object" &&
    (body as { data: unknown }).data !== null &&
    "message" in (body as { data: Record<string, unknown> }).data &&
    typeof (body as { data: { message: unknown } }).data.message === "string"
  ) {
    return (body as { data: { message: string } }).data.message;
  }
  return fallback;
}

function ResetPasswordFormInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!token) {
        setStatus("error");
        setMessage("Reset link is missing the token.");
        return;
      }

      if (password !== confirm) {
        setStatus("error");
        setMessage("Passwords do not match.");
        return;
      }

      const api = resolveApiV1Prefix();
      setStatus("loading");
      setMessage("");

      try {
        const res = await fetch(`${api}/auth/reset-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token, newPassword: password }),
        });

        let body: unknown;
        try {
          body = await res.json();
        } catch {
          body = null;
        }

        if (!res.ok) {
          setStatus("error");
          setMessage(parseApiError(body, "Could not reset password."));
          return;
        }

        setStatus("success");
        setMessage(
          parseSuccessMessage(
            body,
            "Password has been reset. Sign in with your new password.",
          ),
        );
      } catch {
        setStatus("error");
        setMessage(
          "Unable to reach the API. Confirm the backend is running and NEXT_PUBLIC_API_BASE_URL / NEXT_PUBLIC_API_URL is correct.",
        );
      }
    },
    [token, password, confirm],
  );

  if (!token) {
    return (
      <section className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Reset link incomplete
        </h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Open the full reset link from your email — it includes a{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-900">
            token=
          </code>{" "}
          query parameter. If your dev server uses a different hostname or port than
          what was mailed, coordinate{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-900">
            APP_PUBLIC_URL
          </code>{" "}
          in the API with the URL you paste from the inbox.
        </p>
      </section>
    );
  }

  if (status === "success") {
    return (
      <section className="w-full max-w-md rounded-xl border border-emerald-200 bg-emerald-50 p-8 shadow-sm dark:border-emerald-900 dark:bg-emerald-950">
        <h1 className="text-xl font-semibold tracking-tight text-emerald-900 dark:text-emerald-50">
          Password updated
        </h1>
        <p className="mt-3 text-sm text-emerald-900/90 dark:text-emerald-200">
          {message}
        </p>
      </section>
    );
  }

  return (
    <section className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Set new password
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Choose a new password (minimum 8 characters).
      </p>

      <form className="mt-6 flex flex-col gap-4" onSubmit={onSubmit}>
        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-950/25 focus:border-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:ring-zinc-400/35"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="confirm-password"
            className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
          >
            Confirm password
          </label>
          <input
            id="confirm-password"
            name="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-950/25 focus:border-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:ring-zinc-400/35"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        {status === "error" && message ? (
          <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
        ) : null}

        <button
          type="submit"
          disabled={status === "loading"}
          className="mt-2 inline-flex h-10 items-center justify-center rounded-lg bg-zinc-950 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-900 disabled:pointer-events-none disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {status === "loading" ? "Saving…" : "Update password"}
        </button>
      </form>
    </section>
  );
}

export default function ResetPasswordForm() {
  return (
    <Suspense
      fallback={
        <section className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          Loading…
        </section>
      }
    >
      <ResetPasswordFormInner />
    </Suspense>
  );
}
