import { setRequestLocale } from "next-intl/server";
import { ComplaintSubmitWizard } from "@/components/complaints/submit/ComplaintSubmitWizard";
import { PublicShell } from "@/components/layout/public-shell";

export default async function ComplaintNewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const resolvedLocale = locale === "am" ? "am" : "en";

  return (
    <PublicShell>
      <div className="mx-auto w-full max-w-max-width px-gutter py-12">
        <ComplaintSubmitWizard locale={resolvedLocale} />
      </div>
    </PublicShell>
  );
}
