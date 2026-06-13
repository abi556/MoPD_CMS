import { redirect } from "@/i18n/navigation";
import { staffRoutes } from "@/lib/staff/routes";

export default async function ProfileMfaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: `${staffRoutes.profile}#security`, locale });
}
