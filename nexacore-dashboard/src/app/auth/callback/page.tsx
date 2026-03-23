import { Suspense } from "react";
import OAuthCallbackHandler from "@/components/auth/OAuthCallbackHandler";

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-content-primary/50">Loading...</p>
        </div>
      }
    >
      <OAuthCallbackHandler />
    </Suspense>
  );
}
