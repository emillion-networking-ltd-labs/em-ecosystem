"use client";

import { Suspense } from "react";
import AuthLayout from "@/components/layout/AuthLayout";
import ResendVerificationForm from "@/components/auth/ResendVerificationForm";

export default function ResendVerificationPage() {
  return (
    <AuthLayout narrow>
      <Suspense>
        <ResendVerificationForm />
      </Suspense>
    </AuthLayout>
  );
}
