import { getTranslations } from "next-intl/server";
import { PublicShell } from "@/components/layout/public-shell";
import { ErrorScreen } from "@/components/public/error-screen";
import { BrokenLinkArt } from "@/components/public/error-illustrations";

export default async function NotFound() {
  const t = await getTranslations("errors");
  const nav = await getTranslations("nav");

  return (
    <PublicShell>
      <ErrorScreen
        code="404"
        eyebrow={t("notFoundEyebrow")}
        title={t("notFoundTitle")}
        body={t("notFoundBody")}
        illustration={<BrokenLinkArt className="h-auto w-full" />}
        primaryAction={{ href: "/", label: nav("home") }}
        secondaryAction={{
          href: "/complaints/track",
          label: nav("trackStatus"),
          variant: "secondary",
        }}
      />
    </PublicShell>
  );
}
