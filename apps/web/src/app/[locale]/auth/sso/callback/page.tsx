import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { staffRoutes } from "@/lib/staff/routes";

export default async function SsoCallbackPage() {
  const t = await getTranslations("auth");

  return (
    <AuthShell>
      <Card>
        <h1 className="text-xl font-semibold text-on-surface">{t("ssoTitle")}</h1>
        <p className="mt-3 text-sm text-text-secondary">{t("ssoBody")}</p>
        <div className="mt-6">
          <Link href={staffRoutes.auth.login}>
            <Button type="button" variant="brand">
              {t("backToSignIn")}
            </Button>
          </Link>
        </div>
      </Card>
    </AuthShell>
  );
}
