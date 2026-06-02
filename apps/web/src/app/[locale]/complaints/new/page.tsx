import { getTranslations } from "next-intl/server";
import { PublicShell } from "@/components/layout/public-shell";
import { ComplaintSubmissionForm } from "@/components/forms/complaint-submission-form";

export default async function ComplaintNewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("public");

  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-max-width px-gutter py-12">
        <div className="mb-8 max-w-2xl">
          <h1 className="text-3xl font-semibold text-on-surface">{t("ctaSubmit")}</h1>
        </div>
        <ComplaintSubmissionForm locale={locale === "am" ? "am" : "en"} />
      </div>
    </PublicShell>
  );
}
