"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buildAdminNav } from "@/lib/navigation/build-admin-nav";
import { useSession } from "@/components/providers/auth-provider";
import { Card } from "@/components/ui/card";

export default function DashboardAdminPage() {
  const t = useTranslations("nav-staff");
  const { user } = useSession();
  const adminLinks = user ? buildAdminNav(user) : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-on-surface">{t("admin")}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {adminLinks.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="transition-colors hover:border-primary">
              <h2 className="font-semibold text-on-surface">
                {t(item.labelKey as "adminUsers")}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {item.href}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
