import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReactNode } from "react";
import { DotPattern } from "@/components/ui/DotPattern";

const meta = {
  title: "Decoration/DotPattern",
  component: DotPattern,
  tags: ["autodocs"],
  args: { gap: 16, radius: 1 },
} satisfies Meta<typeof DotPattern>;

export default meta;
type Story = StoryObj<typeof meta>;

// Cell gaps (densest → sparsest), in px. 16 is the default.
const GAPS = [12, 16, 24, 32] as const;
// Dot radii (smallest → largest), in px. 1 is the default.
const RADII = [1, 1.5, 2, 3] as const;

const Canvas = ({ children }: { children: ReactNode }) => (
  <div className="relative isolate flex h-48 items-center justify-center overflow-hidden rounded-2xl border border-border-default bg-surface-primary">
    {children}
  </div>
);

// Playground — a dot texture; color inherits from a text token (currentColor).
export const Default: Story = {
  render: (args) => (
    <div className="relative isolate flex h-80 items-center justify-center overflow-hidden rounded-2xl border border-border-default bg-surface-primary">
      <DotPattern {...args} />
      <h2 className="text-display-3 font-display">Dot texture</h2>
    </div>
  ),
};

// Accent — themed by token via a text-accent class, never a hex.
export const Accent: Story = {
  render: (args) => (
    <div className="relative isolate flex h-80 items-center justify-center overflow-hidden rounded-2xl border border-border-default bg-surface-primary">
      <DotPattern {...args} className="text-accent opacity-40" />
      <h2 className="text-display-3 font-display">Themed by token</h2>
    </div>
  ),
};

// Cell gaps — densest → sparsest.
export const Gaps: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {GAPS.map((gap) => (
        <div key={gap} className="space-y-1.5">
          <Canvas>
            <DotPattern gap={gap} />
          </Canvas>
          <span className="text-caption text-content-tertiary font-mono">
            gap={gap}px{gap === 16 ? " (default)" : ""}
          </span>
        </div>
      ))}
    </div>
  ),
};

// Radii — dot size, smallest → largest.
export const Radii: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {RADII.map((radius) => (
        <div key={radius} className="space-y-1.5">
          <Canvas>
            <DotPattern gap={20} radius={radius} />
          </Canvas>
          <span className="text-caption text-content-tertiary font-mono">
            radius={radius}px{radius === 1 ? " (default)" : ""}
          </span>
        </div>
      ))}
    </div>
  ),
};

// AllVariants — ALWAYS last: every gap, plus the token-themed accent fill.
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-caption text-content-tertiary font-mono">color text-border-subtle (default)</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {GAPS.map((gap) => (
            <div key={gap} className="space-y-1.5">
              <Canvas>
                <DotPattern gap={gap} />
              </Canvas>
              <span className="text-caption text-content-tertiary font-mono">gap={gap}px</span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-caption text-content-tertiary font-mono">color text-accent</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {GAPS.map((gap) => (
            <div key={gap} className="space-y-1.5">
              <Canvas>
                <DotPattern gap={gap} className="text-accent opacity-40" />
              </Canvas>
              <span className="text-caption text-content-tertiary font-mono">gap={gap}px</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};
