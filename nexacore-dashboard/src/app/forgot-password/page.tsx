import { Suspense } from "react";
import AuthLayout from "@/components/layout/AuthLayout";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import GuestRoute from "@/components/guards/GuestRoute";

export const metadata = {
  title: "Password Recovery — EM NexaCore",
};

export default function ForgotPasswordPage() {
  return (
    <GuestRoute>
      <AuthLayout>
        <Suspense>
          <ForgotPasswordForm />
        </Suspense>
      </AuthLayout>
    </GuestRoute>
  );
}
