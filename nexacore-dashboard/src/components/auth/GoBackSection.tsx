import Link from 'next/link';
import { House } from 'lucide-react';

export default function GoBackSection() {
  return (
    <div className="relative z-[1] flex w-full items-center justify-center gap-2 py-6">
      <House size={16} className="text-content-primary/75" strokeWidth={2} />
      {/* Nav Link (ui-design-system: 75% → 100%) */}
      <Link href="/" className="text-sm font-medium leading-[21px] text-content-primary/75 transition-colors hover:text-content-primary">
        Go back to the Home Page
      </Link>
    </div>
  );
}
