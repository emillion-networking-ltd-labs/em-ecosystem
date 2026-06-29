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

// AllVariants — ALWAYS last: the language selector (a single dropdown trigger; open it to switch).
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">selector</p>
        <LanguageSelector />
      </div>
    </div>
  ),
};
