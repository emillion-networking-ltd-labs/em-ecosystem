import Link from "next/link";
import { House } from "lucide-react";
import Button from "@/components/ui/Button";

export default function GoBackSection() {
  return (
    <div
      className="auth-card-enter relative z-[1] flex w-full items-center justify-center py-6"
      style={{ animationDelay: "120ms" }}
    >
      <Button as={Link} href="/" variant="link" size="md" fullWidth={false}>
        <House size={16} strokeWidth={2} />
        Go back to the Home Page
      </Button>
    </div>
  );
}
