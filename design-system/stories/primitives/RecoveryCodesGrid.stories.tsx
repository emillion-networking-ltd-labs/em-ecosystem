import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import RecoveryCodesGrid from "@/components/ui/RecoveryCodesGrid";
import { DemoCard } from "../_kit";

const meta = {
  title: "Migration/RecoveryCodesGrid",
  component: RecoveryCodesGrid,
  tags: ["autodocs"],
  args: {
    codes: [
      "A1B2-C3D4",
      "E5F6-G7H8",
      "I9J0-K1L2",
      "M3N4-O5P6",
      "Q7R8-S9T0",
      "U1V2-W3X4",
      "Y5Z6-A7B8",
      "C9D0-E1F2",
    ],
  },
  render: (args) => (
    <DemoCard>
      <div className="w-full max-w-xs">
        <RecoveryCodesGrid {...args} />
      </div>
    </DemoCard>
  ),
} satisfies Meta<typeof RecoveryCodesGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

// A single 2-column grid of recovery codes (copy-all action) — no variants/sizes, so no AllVariants.
export const Default: Story = {};
