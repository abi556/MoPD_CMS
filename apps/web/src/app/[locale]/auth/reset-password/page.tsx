import { Suspense } from "react";
import { StaffLoginScreen } from "@/components/auth/staff-login-screen";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <StaffLoginScreen>
      <Suspense fallback={<p className="text-sm text-text-secondary">…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </StaffLoginScreen>
  );
}
