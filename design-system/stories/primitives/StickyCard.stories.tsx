import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect, useRef, useState } from "react";
import StickyCard from "@/components/ui/StickyCard";
import { DemoCard } from "../_kit";

// NOTE: the real StickyCard sticks to the PAGE viewport via position:fixed + IntersectionObserver,
// so it can't be shown statically or inside a Storybook scroll container without hijacking the page.
// These sections illustrate the concept with CSS position:sticky inside a scrollable container — the
// same approach the dashboard showcase uses. Two positions: top / bottom. They also replicate the
// real behavior: when stuck, the corners touching the edge go square (top → rounded-b only;
// bottom → rounded-t only), detected with a sentinel + IntersectionObserver like the component.
const meta = {
  title: "Primitives/StickyCard",
  component: StickyCard,
  tags: ["autodocs"],
} satisfies Meta<typeof StickyCard>;

export default meta;
type Story = StoryObj<typeof meta>;

function ContentCard() {
  return (
    <div className="mx-4 mb-4 mt-3 space-y-3 rounded-xl border border-border-strong bg-surface-primary p-4 text-caption text-content-tertiary">
      {Array.from({ length: 8 }, (_, i) => (
        <p key={i}>
          Filler paragraph {i + 1} — scroll to see the card stick while the content scrolls
          behind it.
        </p>
      ))}
    </div>
  );
}

function StickyDemo({ position }: { position: "top" | "bottom" }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;
    const io = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), {
      root,
      threshold: 0,
    });
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  // When stuck, the edge corners go square — exactly like the real component
  // (top floats with rounded-b-xl, bottom floats with rounded-t-xl).
  const rounded = !stuck ? "rounded-xl" : position === "top" ? "rounded-b-xl" : "rounded-t-xl";
  const sentinel = <div ref={sentinelRef} className="h-px" />;
  const arrow = position === "top" ? "↓" : "↑";

  const card = (
    <div
      className={`sticky z-10 mx-4 border border-border-strong bg-surface-primary p-4 shadow-card ${
        position === "top" ? "top-0" : "bottom-0"
      } ${rounded}`}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-body font-semibold text-content-primary">StickyCard content</p>
        <span className="font-mono text-caption text-content-tertiary">
          position=&quot;{position}&quot;
        </span>
      </div>
    </div>
  );

  // Same clarifying line as top, but for "bottom" it sits BELOW the card (so the card is separated
  // from the bottom edge by default, mirroring how the intro separates the top card from the top).
  const intro = (
    <div className="px-4 py-3 text-center text-caption text-content-tertiary">
      {arrow} Scroll inside this container — the card sticks to the {position} {arrow}
    </div>
  );

  return (
    <div
      ref={rootRef}
      className="h-64 max-w-md overflow-y-auto rounded-xl border border-border-strong bg-surface-secondary"
    >
      {position === "top" ? (
        <>
          {intro}
          {sentinel}
          {card}
          <ContentCard />
        </>
      ) : (
        <>
          <ContentCard />
          {card}
          {sentinel}
          {intro}
        </>
      )}
    </div>
  );
}

// Sticks to the TOP of the scroll container; when stuck, the top corners go square.
export const StickyTop: Story = {
  render: () => (
    <DemoCard>
      <StickyDemo position="top" />
    </DemoCard>
  ),
};

// Sticks to the BOTTOM of the scroll container; when stuck, the bottom corners go square.
// position (top/bottom) is a placement, each its own story; no design-variant/size axis → no AllVariants.
export const StickyBottom: Story = {
  render: () => (
    <DemoCard>
      <StickyDemo position="bottom" />
    </DemoCard>
  ),
};
