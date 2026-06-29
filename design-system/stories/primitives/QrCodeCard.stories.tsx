import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import QrCodeCard from "@/components/ui/QrCodeCard";

const meta = {
  title: "Primitives/QrCodeCard",
  component: QrCodeCard,
  tags: ["autodocs"],
  args: { secret: "JBSWY3DPEHPK3PXP" },
  // The QR is fixed at 192px; constrain so the card hugs it instead of stretching full-bleed.
  decorators: [
    (Story) => (
      <div className="max-w-[256px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof QrCodeCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// AllVariants — ALWAYS last: the QR card for a TOTP secret (fixed 192px QR + copyable secret).
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">default</p>
        <QrCodeCard secret="JBSWY3DPEHPK3PXP" />
      </div>
    </div>
  ),
};
