import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReactNode } from "react";
import { GridPattern } from "@/components/ui/GridPattern";

const meta = {
  title: "Decoration/GridPattern",
  component: GridPattern,
  tags: ["autodocs"],
  args: { gap: 32, stroke: 1 },
} satisfies Meta<typeof GridPattern>;

export default meta;
type Story = StoryObj<typeof meta>;

// Cell gaps (densest → sparsest), in px. 32 is the default.
const GAPS = [16, 24, 32, 48] as const;
// Line strokes (thinnest → thickest), in px. 1 is the default.
const STROKES = [1, 1.5, 2, 3] as const;

const Canvas = ({ children }: { children: ReactNode }) => (
  <div className="relative isolate flex h-48 items-center justify-center overflow-hidden rounded-2xl border border-border-default bg-surface-primary">
    {children}
  </div>
);

// Playground — an editorial grid texture; color inherits from a text token (currentColor).
export const Default: Story = {
  render: (args) => (
    <div className="relative isolate flex h-80 items-center justify-center overflow-hidden rounded-2xl border border-border-default bg-surface-primary">
      <GridPattern {...args} />
      <h2 className="text-display-3 font-display">Editorial grid</h2>
    </div>
  ),
};

// Accent — themed by token via a text-accent class, never a hex.
export const Accent: Story = {
  render: (args) => (
    <div className="relative isolate flex h-80 items-center justify-center overflow-hidden rounded-2xl border border-border-default bg-surface-primary">
      <GridPattern {...args} className="text-accent opacity-40" />
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
            <GridPattern gap={gap} />
          </Canvas>
          <span className="text-caption text-content-tertiary font-mono">
            gap={gap}px{gap === 32 ? " (default)" : ""}
          </span>
        </div>
      ))}
    </div>
  ),
};

// Strokes — line weight, thinnest → thickest.
export const Strokes: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {STROKES.map((stroke) => (
        <div key={stroke} className="space-y-1.5">
          <Canvas>
            <GridPattern gap={28} stroke={stroke} />
          </Canvas>
          <span className="text-caption text-content-tertiary font-mono">
            stroke={stroke}px{stroke === 1 ? " (default)" : ""}
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
                <GridPattern gap={gap} />
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
                <GridPattern gap={gap} className="text-accent opacity-40" />
              </Canvas>
              <span className="text-caption text-content-tertiary font-mono">gap={gap}px</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};
