import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import QrCodeCard from "@/components/ui/QrCodeCard";

const meta = {
  title: "Primitives/QrCodeCard",
  component: QrCodeCard,
  tags: ["autodocs"],
  args: { secret: "JBSWY3DPEHPK3PXP" },
} satisfies Meta<typeof QrCodeCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
