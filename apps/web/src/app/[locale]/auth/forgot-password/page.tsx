import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { AuthShell } from "@/components/layout/auth-shell";

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <Card>
        <EmptyState
          title="Forgot password"
          description="Password recovery flow is reserved in SDS and will be fully implemented in auth phase."
        />
      </Card>
    </AuthShell>
  );
}
