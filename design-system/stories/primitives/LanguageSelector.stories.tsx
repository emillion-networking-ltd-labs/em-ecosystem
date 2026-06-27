import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import LanguageSelector from "@/components/ui/LanguageSelector";

const meta = {
  title: "Primitives/LanguageSelector",
  component: LanguageSelector,
  tags: ["autodocs"],
  args: {},
} satisfies Meta<typeof LanguageSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
