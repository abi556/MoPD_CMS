import { StaffLoginScreen } from "@/components/auth/staff-login-screen";
import { AuthSessionGuard } from "@/components/staff/auth/auth-session-guard";
import { MfaEnrollForm } from "@/components/staff/auth/mfa-enroll-form";

export default function MfaEnrollPage() {
  return (
    <StaffLoginScreen>
      <AuthSessionGuard>
        <MfaEnrollForm />
      </AuthSessionGuard>
    </StaffLoginScreen>
  );
}
