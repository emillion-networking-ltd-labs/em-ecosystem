import AuthLayout from "@/components/layout/AuthLayout";
import RegisterForm from "@/components/auth/RegisterForm";
import GuestRoute from "@/components/guards/GuestRoute";

export const metadata = {
  title: "Create Account — EM NexaCore",
};

export default function RegisterPage() {
  return (
    <GuestRoute>
      <AuthLayout>
        <RegisterForm />
      </AuthLayout>
    </GuestRoute>
  );
}
