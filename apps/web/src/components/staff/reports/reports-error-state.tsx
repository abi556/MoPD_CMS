import { EmptyState } from "@/components/ui/empty-state";

export function ReportsErrorState({ message }: { message: string }) {
  return (
    <EmptyState
      title="Unable to load report"
      description={message}
    />
  );
}
