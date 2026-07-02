import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import LanguageSelector from "@/components/ui/LanguageSelector";
import { DemoCard } from "../_kit";

const meta = {
  title: "Primitives/LanguageSelector",
  component: LanguageSelector,
  tags: ["autodocs"],
  args: {},
  render: () => (
    <DemoCard>
      <LanguageSelector />
    </DemoCard>
  ),
} satisfies Meta<typeof LanguageSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

// A single dropdown trigger (open it to switch language) — no variants/sizes, so no AllVariants.
export const Default: Story = {};
