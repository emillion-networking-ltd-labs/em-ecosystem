import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { DemoCard } from "../_kit";

// App-coupled: uses useTheme → @/context/ThemeContext. In the catalog it's wired against a MOCK
// ThemeContext (see .storybook/mocks/context). The icon follows the active theme (flip it with the
// catalog's theme toolbar). Making the click itself toggle+apply the theme is tracked in ECO-119.
const meta = {
  title: "Migration/ThemeToggle",
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
  render: (args) => (
    <DemoCard>
      <ThemeToggle {...args} />
    </DemoCard>
  ),
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

// A single toggle (no variants/sizes) — so no AllVariants.
export const Default: Story = {};
