import { getTranslations } from "next-intl/server";
import { PublicShell } from "@/components/layout/public-shell";
import { ErrorScreen } from "@/components/public/error-screen";
import { ForbiddenArt } from "@/components/public/error-illustrations";

export default async function ForbiddenPage() {
  const t = await getTranslations("auth");
  const nav = await getTranslations("nav");

  return (
    <PublicShell>
      <ErrorScreen
        code="403"
        eyebrow={t("forbiddenEyebrow")}
        title={t("forbiddenTitle")}
        body={t("forbiddenBody")}
        illustration={<ForbiddenArt className="h-auto w-full" />}
        primaryAction={{ href: "/", label: nav("home") }}
        secondaryAction={{
          href: "/auth/login",
          label: nav("login"),
          variant: "secondary",
        }}
      />
    </PublicShell>
  );
}
