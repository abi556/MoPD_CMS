import { Suspense } from "react";
import { StaffLoginScreen } from "@/components/auth/staff-login-screen";
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <StaffLoginScreen>
      <Suspense fallback={<p className="text-sm text-text-secondary">…</p>}>
        <ForgotPasswordForm />
      </Suspense>
    </StaffLoginScreen>
  );
}
