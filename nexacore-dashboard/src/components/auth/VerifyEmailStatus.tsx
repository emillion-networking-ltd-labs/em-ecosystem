"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CircleCheck, CircleX, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api";

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
        <p className="text-body leading-[21px] text-content-primary/50">
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
        <p className="text-body leading-[21px] text-content-primary/50">
          Email verified!
        </p>
      ) : (
        <p className="text-center text-body leading-[21px] text-content-primary/50">
          Verification failed!
          <br />
          The verification link is invalid or has expired.
        </p>
      )}

      <Link
        href={isSuccess ? "/dashboard" : "/login"}
        className="flex h-10 w-full items-center justify-center rounded-md border border-border-strong bg-transparent px-6 py-2.5 text-subtitle font-normal text-content-primary transition-colors hover:bg-surface-subtle"
      >
        {isSuccess ? "Go to Dashboard" : "Go to Sign In"}
      </Link>
    </div>
  );
}
