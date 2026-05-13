import { Suspense } from "react";
import OAuthCallbackHandler from "@/components/auth/OAuthCallbackHandler";
import Spinner from "@/components/ui/Spinner";

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <OAuthCallbackHandler />
    </Suspense>
  );
}
