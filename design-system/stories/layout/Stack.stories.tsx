import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Stack } from "@/components/ui/Stack";

const meta = {
  title: "Layout/Stack",
  component: Stack,
  tags: ["autodocs"],
  args: { gap: "md", align: "start" },
  argTypes: {
    gap: { control: "inline-radio", options: ["xs", "sm", "md", "lg", "xl"] },
    align: { control: "inline-radio", options: ["start", "center", "end"] },
  },
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

// Gaps (largest → smallest), with the spacing value. md is the default.
const GAPS = [
  { gap: "xl", px: "32" },
  { gap: "lg", px: "24" },
  { gap: "md", px: "16" },
  { gap: "sm", px: "12" },
  { gap: "xs", px: "8" },
] as const;

const ALIGNS = ["start", "center", "end"] as const;

const Sample = () => (
  <>
    <span className="text-caption uppercase tracking-wide text-content-tertiary">Eyebrow</span>
    <h2 className="text-display-3 font-display">Headline with rhythm</h2>
    <p className="text-content-secondary">A claim with its spacing governed by the gap.</p>
    <span className="text-content-primary">Call to action →</span>
  </>
);

const Cell = ({ label }: { label: string }) => (
  <span className="rounded-md border border-border-default bg-surface-secondary px-3 py-1.5 text-content-secondary">
    {label}
  </span>
);

// Playground — vertical flow grouping eyebrow + headline + claim + CTA.
export const Default: Story = {
  render: (args) => (
    <Stack {...args}>
      <Sample />
    </Stack>
  ),
};

// Gaps — largest → smallest, with placeholder rows so the spacing is visible.
export const Gaps: Story = {
  render: () => (
    <div className="flex flex-wrap gap-10">
      {GAPS.map(({ gap, px }) => (
        <div key={gap} className="flex flex-col items-center gap-2">
          <Stack gap={gap}>
            <Cell label="A" />
            <Cell label="B" />
            <Cell label="C" />
          </Stack>
          <span className="text-caption text-content-tertiary font-mono">
            {gap} · {px}px{gap === "md" ? " (default)" : ""}
          </span>
        </div>
      ))}
    </div>
  ),
};

// Aligns — cross-axis alignment (text follows: left / center / right).
export const Aligns: Story = {
  render: () => (
    <div className="space-y-8">
      {ALIGNS.map((align) => (
        <div key={align} className="space-y-1.5">
          <span className="text-caption text-content-tertiary font-mono">
            align=&quot;{align}&quot;{align === "start" ? " (default)" : ""}
          </span>
          <Stack align={align} className="w-full">
            <Sample />
          </Stack>
        </div>
      ))}
    </div>
  ),
};

// AllVariants — ALWAYS last: every gap at each alignment.
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-10">
      {ALIGNS.map((align) => (
        <div key={align} className="space-y-3">
          <p className="text-caption text-content-tertiary font-mono">align=&quot;{align}&quot;</p>
          <div className="flex flex-wrap gap-10">
            {GAPS.map(({ gap, px }) => (
              <div key={gap} className="flex flex-col gap-2">
                <Stack gap={gap} align={align} className="w-40">
                  <Cell label="A" />
                  <Cell label="B" />
                  <Cell label="C" />
                </Stack>
                <span className="text-caption text-content-tertiary font-mono">
                  {gap} · {px}px
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};
