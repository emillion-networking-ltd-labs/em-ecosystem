import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ThemeToggle from "@/components/ui/ThemeToggle";

// App-coupled: uses useTheme → @/context/ThemeContext. In the catalog it's wired against a
// MOCK ThemeContext (see .storybook/mocks/context); the real app's dashboard provides it.
const meta = {
  title: "Primitives/ThemeToggle",
  component: ThemeToggle,
  tags: ["autodocs"],
  // In the catalog the toggle sits at the top-left, so show the tooltip on the right (it would clip
  // otherwise). The component defaults to "auto" in real layouts.
  args: { tooltipPosition: "right" },
  argTypes: {
    tooltipPosition: {
      control: "inline-radio",
      options: ["auto", "top", "bottom", "left", "right"],
    },
  },
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// AllVariants — ALWAYS last: the toggle (its icon follows the active theme — flip it with the
// catalog's theme toolbar; sits inline like in the dashboard top bar).
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">theme toggle</p>
        <ThemeToggle tooltipPosition="right" />
      </div>
    </div>
  ),
};
