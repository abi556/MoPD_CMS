import { notFound } from "next/navigation";
import { StaffGuideView } from "@/components/staff/help/staff-guide-view";
import { isStaffGuideSlug } from "@/lib/staff/help/guide-catalog";

export default async function StaffGuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!isStaffGuideSlug(slug)) {
    notFound();
  }

  return <StaffGuideView slug={slug} />;
}
