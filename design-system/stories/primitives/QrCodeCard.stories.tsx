import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import QrCodeCard from "@/components/ui/QrCodeCard";
import { DemoCard } from "../_kit";

const meta = {
  title: "Migration/QrCodeCard",
  component: QrCodeCard,
  tags: ["autodocs"],
  args: { secret: "JBSWY3DPEHPK3PXP" },
  render: (args) => (
    <DemoCard>
      <QrCodeCard {...args} />
    </DemoCard>
  ),
} satisfies Meta<typeof QrCodeCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// A single card (fixed 192px QR + copyable secret for a TOTP secret) — no variants/sizes, so no AllVariants.
export const Default: Story = {};
