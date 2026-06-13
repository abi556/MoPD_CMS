import { EmptyState } from "@/components/ui/empty-state";

export function ReportsStubPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return <EmptyState title={title} description={description} />;
}
