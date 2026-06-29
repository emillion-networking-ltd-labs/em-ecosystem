// Shared demo frame for the Marketing AllVariants overviews. NOT a story (the catalog glob only loads
// `*.stories.tsx`), so it is imported, never catalogued. Every config sits in the SAME bordered demo cell
// + mono caption — matching the framed look of AuroraBackground/Meteors/Spotlight — so the whole section
// reads uniformly instead of some components floating loose on the canvas (ECO-109).
import type { ReactNode } from "react";

// One demo cell: a bordered box + a mono caption beneath. The frame (rounded-2xl + border) is fixed so
// every cell matches; `className` tunes only the interior (height, padding, surface) per component need:
//   • text / buttons / stats → "min-h-[200px] bg-surface-secondary p-8" (the light "gray box")
//   • full-bleed effects      → "h-56 bg-surface-inverse" (dark, no padding so the effect fills)
export function DemoCell({
  caption,
  className = "min-h-[200px] bg-surface-secondary p-8",
  children,
}: {
  caption: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={`relative flex w-full items-center justify-center overflow-hidden rounded-2xl border border-border-default ${className}`}
      >
        {children}
      </div>
      <span className="text-caption text-content-tertiary font-mono">{caption}</span>
    </div>
  );
}

// The vertical stack the cells live in.
export function DemoStack({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-4">{children}</div>;
}
