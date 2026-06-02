"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/lib/api-client";
import { resolvePostLoginPath } from "@/lib/auth/post-login-redirect";
import { useSession } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export function LoginForm() {
  const t = useTranslations("auth");
  const { login } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(undefined);
    try {
      const result = await login(email, password);
      router.replace(resolvePostLoginPath(result.user));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to sign in. Check your credentials and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h1 className="text-xl font-semibold text-on-surface">{t("loginTitle")}</h1>
      <p className="mt-2 text-sm text-text-secondary">{t("loginSubtitle")}</p>
      <form className="mt-6 flex flex-col gap-4" onSubmit={onSubmit}>
        <Input
          label={t("email")}
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label={t("password")}
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error}
        />
        <Button type="submit" disabled={loading}>
          {loading ? "…" : t("signIn")}
        </Button>
      </form>
    </Card>
  );
}
