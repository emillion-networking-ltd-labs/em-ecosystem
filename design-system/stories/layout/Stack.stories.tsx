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

export const Default: Story = {
  render: (args) => (
    <Stack {...args}>
      <span className="text-caption uppercase tracking-wide text-content-tertiary">Eyebrow</span>
      <h2 className="text-display-3 font-display">Titular con ritmo</h2>
      <p className="text-content-secondary">Claim con la separación gobernada por el gap.</p>
      <span className="text-accent">Llamada a la acción →</span>
    </Stack>
  ),
};
