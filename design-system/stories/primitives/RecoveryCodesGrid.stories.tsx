import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import RecoveryCodesGrid from "@/components/ui/RecoveryCodesGrid";

const meta = {
  title: "Primitives/RecoveryCodesGrid",
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
  // 2-column grid of short codes; constrain so it doesn't stretch full-bleed.
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RecoveryCodesGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
