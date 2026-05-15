import type { Metadata } from "next";
import ResetPasswordForm from "./reset-password-form";

export const metadata: Metadata = {
  title: "Reset password · MoPD CMS",
  description: "Set a new password using your emailed reset token.",
};

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-zinc-950">
      <ResetPasswordForm />
    </div>
  );
}
