import { StaffLoginScreen } from "@/components/auth/staff-login-screen";
import { AuthSessionGuard } from "@/components/staff/auth/auth-session-guard";
import { ChangePasswordForm } from "@/components/staff/auth/change-password-form";

export default function ChangePasswordPage() {
  return (
    <StaffLoginScreen>
      <AuthSessionGuard>
        <ChangePasswordForm />
      </AuthSessionGuard>
    </StaffLoginScreen>
  );
}
