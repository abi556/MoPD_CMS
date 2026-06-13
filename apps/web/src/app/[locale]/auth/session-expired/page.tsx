import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { StaffLoginScreen } from "@/components/auth/staff-login-screen";
import { Button } from "@/components/ui/button";
import { staffRoutes } from "@/lib/staff/routes";

export default async function SessionExpiredPage() {
  const t = await getTranslations("auth");

  return (
    <StaffLoginScreen>
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-on-surface">
          {t("sessionExpiredTitle")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          {t("sessionExpiredBody")}
        </p>

        <div className="mt-10">
          <Link href={staffRoutes.auth.login}>
            <Button type="button" variant="brand" size="lg" fullWidth>
              {t("signIn")}
            </Button>
          </Link>
        </div>

        <div className="mt-8">
          <Link
            href={staffRoutes.auth.login}
            className="text-sm font-semibold text-on-surface underline-offset-4 hover:underline"
          >
            {t("backToSignIn")}
          </Link>
        </div>
      </div>
    </StaffLoginScreen>
  );
}
