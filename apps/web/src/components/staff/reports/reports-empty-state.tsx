import { EmptyState } from "@/components/ui/empty-state";

export function ReportsEmptyState({
  title = "No report data",
  description = "Try changing filters or expanding the date range.",
}: {
  title?: string;
  description?: string;
}) {
  return <EmptyState title={title} description={description} />;
}
