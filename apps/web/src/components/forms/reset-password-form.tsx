"use client";

import { Suspense, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiPost, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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

      setStatus("loading");
      setMessage("");

      try {
        const data = await apiPost<{ message: string }>(
          "/auth/reset-password",
          { token, newPassword: password },
          { auth: false },
        );
        setStatus("success");
        setMessage(
          data.message ?? "Password has been reset. Sign in with your new password.",
        );
      } catch (err) {
        setStatus("error");
        setMessage(
          err instanceof ApiError
            ? err.message
            : "Unable to reach the API. Confirm the backend is running.",
        );
      }
    },
    [token, password, confirm],
  );

  if (!token) {
    return (
      <Card>
        <h1 className="text-xl font-semibold text-on-surface">
          Reset link incomplete
        </h1>
        <p className="mt-3 text-sm text-text-secondary">
          Open the full reset link from your email — it includes a{" "}
          <code className="rounded bg-surface-container-low px-1 text-xs">
            token=
          </code>{" "}
          query parameter.
        </p>
      </Card>
    );
  }

  if (status === "success") {
    return (
      <Card className="border border-success/35 bg-success/10">
        <h1 className="text-xl font-semibold text-success">Password updated</h1>
        <p className="mt-3 text-sm text-text-secondary">{message}</p>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="text-xl font-semibold text-on-surface">Set new password</h1>
      <p className="mt-2 text-sm text-text-secondary">
        Choose a new password (minimum 8 characters).
      </p>
      <form className="mt-6 flex flex-col gap-4" onSubmit={onSubmit}>
        <Input
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          label="Confirm password"
          name="confirm-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={status === "error" ? message : undefined}
        />
        <Button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Saving…" : "Update password"}
        </Button>
      </form>
    </Card>
  );
}

export function ResetPasswordForm() {
  return (
    <Suspense
      fallback={
        <Card>
          <p className="text-sm text-text-secondary">Loading…</p>
        </Card>
      }
    >
      <ResetPasswordFormInner />
    </Suspense>
  );
}
