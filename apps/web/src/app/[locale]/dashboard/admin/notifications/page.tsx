import { redirect } from "@/i18n/navigation";
import { staffRoutes } from "@/lib/staff/routes";

export default async function AdminNotificationsRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: staffRoutes.notifications, locale });
}
