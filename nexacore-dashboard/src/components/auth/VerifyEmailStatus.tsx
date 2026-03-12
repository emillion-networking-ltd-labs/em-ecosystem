"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CircleCheck, CircleX } from "lucide-react";

export default function VerifyEmailStatus() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const isSuccess = status === "success";

  return (
    <div className="flex flex-col items-center gap-2">
      {isSuccess ? (
        <CircleCheck size={48} className="text-[#166534]" strokeWidth={1.5} />
      ) : (
        <CircleX size={48} className="text-[#8a1111]" strokeWidth={1.5} />
      )}

      {isSuccess ? (
        <p className="text-sm leading-[21px] text-content-primary/50">
          Email verified!
        </p>
      ) : (
        <p className="text-center text-sm leading-[21px] text-content-primary/50">
          Verification failed!
          <br />
          The verification link is invalid or has expired.
        </p>
      )}

      <Link
        href={isSuccess ? "/dashboard" : "/login"}
        className="flex h-10 w-full items-center justify-center rounded-md border border-border-default bg-transparent px-6 py-2.5 text-base font-medium text-content-primary transition-colors hover:bg-surface-subtle"
      >
        {isSuccess ? "Go to Dashboard" : "Go to Sign In"}
      </Link>
    </div>
  );
}
