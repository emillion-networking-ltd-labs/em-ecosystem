"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CircleCheck, CircleX, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import Button from "@/components/ui/Button";

export default function VerifyEmailStatus() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "invalid">(
    token ? "loading" : "invalid",
  );

  useEffect(() => {
    if (!token) return;

    apiClient
      .post<{ status: "success" | "invalid" }>("/auth/verify-email", { token })
      .then((res) => setStatus(res.status))
      .catch(() => setStatus("invalid"));
  }, [token]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center gap-2">
        <Loader2 size={48} className="animate-spin text-content-secondary" />
        <p className="text-body text-content-secondary">
          Verifying your email...
        </p>
      </div>
    );
  }

  const isSuccess = status === "success";

  return (
    <div className="flex flex-col items-center gap-2">
      {isSuccess ? (
        <CircleCheck
          size={48}
          className="icon-success text-[#166534]"
          strokeWidth={1.5}
        />
      ) : (
        <CircleX
          size={48}
          className="icon-error text-[#8a1111]"
          strokeWidth={1.5}
        />
      )}

      {isSuccess ? (
        <p className="text-body text-content-secondary">Email verified!</p>
      ) : (
        <p className="text-center text-body text-content-secondary">
          Verification failed!
          <br />
          The verification link is invalid or has expired.
        </p>
      )}

      <Button
        as={Link}
        href={isSuccess ? "/dashboard" : "/login"}
        variant="outline"
      >
        {isSuccess ? "Go to Dashboard" : "Go to Sign In"}
      </Button>
    </div>
  );
}
