import Link from "next/link";
import { House } from "lucide-react";

export default function GoBackSection() {
  return (
    <div
      className="auth-card-enter relative z-[1] flex w-full items-center justify-center py-6"
      style={{ animationDelay: "120ms" }}
    >
      <Link
        href="/"
        className="flex items-center gap-2 text-sm font-normal leading-[21px] text-content-primary/75 transition-colors hover:text-content-primary"
      >
        <House size={16} strokeWidth={2} />
        Go back to the Home Page
      </Link>
    </div>
  );
}
