import Link from "next/link";
import LanguageSelector from "@/components/ui/LanguageSelector";
import Button from "@/components/ui/Button";

export default function AuthFooter() {
  return (
    <div className="flex w-full flex-wrap items-center gap-x-6 gap-y-2 p-2">
      {/* Left — Language Selector */}
      <div className="flex flex-1 items-center">
        <LanguageSelector triggerClassName="!rounded-bl-3xl" />
      </div>

      {/* Right — Nav Links */}
      <div className="flex items-center gap-6 px-4">
        <Button as={Link} href="#" variant="link" size="md" fullWidth={false}>
          Help
        </Button>
        <Button as={Link} href="#" variant="link" size="md" fullWidth={false}>
          Privacy
        </Button>
        <Button as={Link} href="#" variant="link" size="md" fullWidth={false}>
          Terms
        </Button>
      </div>
    </div>
  );
}
