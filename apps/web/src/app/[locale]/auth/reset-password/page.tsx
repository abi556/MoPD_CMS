import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import { AuthShell } from "@/components/layout/auth-shell";

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <ResetPasswordForm />
    </AuthShell>
  );
}
