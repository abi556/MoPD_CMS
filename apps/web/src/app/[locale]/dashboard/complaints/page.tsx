import { Suspense } from "react";
import { RequirePermission } from "@/components/auth/require-permission";
import { ComplaintsQueuePanel } from "@/components/staff/complaints/complaints-queue-panel";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export default function DashboardComplaintsPage() {
  return (
    <RequirePermission anyOf={["complaint:read", "complaint:read:own"]}>
      <Suspense
        fallback={
          <div className="space-y-4 p-2">
            <LoadingSkeleton className="h-10 w-48" />
            <LoadingSkeleton className="h-64 w-full" />
          </div>
        }
      >
        <ComplaintsQueuePanel />
      </Suspense>
    </RequirePermission>
  );
}
