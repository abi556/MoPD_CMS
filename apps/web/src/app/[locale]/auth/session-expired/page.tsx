import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AuthShell } from "@/components/layout/auth-shell";

export default async function SessionExpiredPage() {
  const t = await getTranslations("auth");

  return (
    <AuthShell>
    <Card>
      <h1 className="text-xl font-semibold text-on-surface">
        {t("sessionExpiredTitle")}
      </h1>
      <p className="mt-3 text-sm text-text-secondary">
        {t("sessionExpiredBody")}
      </p>
      <div className="mt-6">
        <Link href="/auth/login">
          <Button type="button">{t("signIn")}</Button>
        </Link>
      </div>
    </Card>
    </AuthShell>
  );
}
