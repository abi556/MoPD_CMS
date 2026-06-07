import { getTranslations, setRequestLocale } from "next-intl/server";
import { PublicShell } from "@/components/layout/public-shell";
import { PublicLegalHero } from "@/components/public/public-legal-hero";
import { FaqSection } from "@/components/public/faq-section";
import {
  FAQ_CATEGORIES,
  type FaqItemId,
} from "@/components/public/faq-categories";

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("faq");

  const categoryLabels = Object.fromEntries(
    FAQ_CATEGORIES.map((category) => [
      category.id,
      t(`categories.${category.id}`),
    ]),
  ) as Record<(typeof FAQ_CATEGORIES)[number]["id"], string>;

  const items = Object.fromEntries(
    FAQ_CATEGORIES.flatMap((category) =>
      category.items.map((id) => [
        id,
        {
          question: t(`items.${id}.question`),
          answer: t(`items.${id}.answer`),
        },
      ]),
    ),
  ) as Record<FaqItemId, { question: string; answer: string }>;

  return (
    <PublicShell>
      <PublicLegalHero title={t("title")} subtitle={t("subtitle")} />

      <FaqSection
        navLabel={t("categoriesHeading")}
        categoryLabels={categoryLabels}
        items={items}
        stillNeedHelp={t("stillNeedHelp")}
        stillNeedHelpBody={t("stillNeedHelpBody")}
        ctaContact={t("ctaContact")}
      />
    </PublicShell>
  );
}
