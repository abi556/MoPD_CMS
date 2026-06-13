import { StaffLoginScreen } from "@/components/auth/staff-login-screen";
import { MfaVerifyForm } from "@/components/staff/auth/mfa-verify-form";

export default function MfaVerifyPage() {
  return (
    <StaffLoginScreen>
      <MfaVerifyForm />
    </StaffLoginScreen>
  );
}
