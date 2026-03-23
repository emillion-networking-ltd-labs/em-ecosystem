import Link from "next/link";
import LanguageSelector from "@/components/ui/LanguageSelector";

export default function AuthFooter() {
  return (
    <div className="flex w-full flex-wrap items-center gap-x-6 gap-y-2 p-2">
      {/* Left — Language Selector (Figma: layoutGrow=1, trigger fills parent) */}
      <div className="flex flex-1 items-center">
        <LanguageSelector triggerClassName="animate-corner-bl" />
      </div>

      {/* Right — Nav Links (Figma: auto width, gap 24, px 16) */}
      <div className="flex items-center gap-6 px-4">
        <Link
          href="#"
          className="text-body font-normal leading-[21px] text-content-primary/75 transition-colors hover:text-content-primary"
        >
          Help
        </Link>
        <Link
          href="#"
          className="text-body font-normal leading-[21px] text-content-primary/75 transition-colors hover:text-content-primary"
        >
          Privacy
        </Link>
        <Link
          href="#"
          className="text-body font-normal leading-[21px] text-content-primary/75 transition-colors hover:text-content-primary"
        >
          Terms
        </Link>
      </div>
    </div>
  );
}
