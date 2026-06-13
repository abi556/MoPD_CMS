import { Suspense } from "react";
import { RequirePermission } from "@/components/auth/require-permission";
import { ComplaintDetailShell } from "@/components/staff/complaints/complaint-detail-shell";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export default async function ComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <RequirePermission anyOf={["complaint:read", "complaint:read:own"]}>
      <Suspense
        fallback={
          <div className="space-y-4 p-2">
            <LoadingSkeleton className="h-10 w-64" />
            <LoadingSkeleton className="h-48 w-full" />
          </div>
        }
      >
        <ComplaintDetailShell complaintId={id} />
      </Suspense>
    </RequirePermission>
  );
}
