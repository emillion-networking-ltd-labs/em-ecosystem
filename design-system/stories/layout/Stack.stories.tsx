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

const ALIGNS = ["start", "center", "end"] as const;

const Sample = () => (
  <>
    <span className="text-caption uppercase tracking-wide text-content-tertiary">Eyebrow</span>
    <h2 className="text-display-3 font-display">Headline with rhythm</h2>
    <p className="text-content-secondary">A claim with its spacing governed by the gap.</p>
    <span className="text-content-primary">Call to action →</span>
  </>
);

// Playground — vertical flow grouping eyebrow + headline + claim + CTA.
export const Default: Story = {
  render: (args) => (
    <Stack {...args}>
      <Sample />
    </Stack>
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
