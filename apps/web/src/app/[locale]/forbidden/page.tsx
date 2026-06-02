import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function ForbiddenPage() {
  const t = await getTranslations("auth");
  const common = await getTranslations("common");

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-on-surface">
          {t("forbiddenTitle")}
        </h1>
        <p className="mt-3 text-sm text-text-secondary">{t("forbiddenBody")}</p>
        <div className="mt-6">
          <Link href="/">
            <Button type="button">{common("back")}</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
