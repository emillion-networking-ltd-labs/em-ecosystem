"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import RingSpinner from "@/components/ui/RingSpinner";

export default function OAuthCallbackHandler() {
  const { handleOAuthCallback } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const urlError = searchParams.get("error");

    if (urlError) {
      const message = decodeURIComponent(urlError);
      const encoded = encodeURIComponent(
        message !== "true"
          ? message
          : "Authentication failed. Please try again.",
      );
      router.replace(`/login?oauth_error=${encoded}`);
      return;
    }

    handleOAuthCallback().then((action) => {
      if (action === "linked") {
        router.replace("/profile");
      } else if (action) {
        router.replace("/dashboard");
      } else {
        router.replace(
          "/login?oauth_error=" +
            encodeURIComponent("Authentication failed. Please try again."),
        );
      }
    });
  }, [searchParams, handleOAuthCallback, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <RingSpinner size="lg" />
        <p className="text-body text-content-secondary">
          Completing sign in...
        </p>
      </div>
    </div>
  );
}
