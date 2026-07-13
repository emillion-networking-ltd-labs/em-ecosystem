import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { DemoCard } from "../_kit";

const meta = {
  title: "Migration/Breadcrumbs",
  component: Breadcrumbs,
  tags: ["autodocs"],
  args: {
    items: [
      { label: "Projects", href: "/dashboard/projects" },
      { label: "Corporate site", href: "/dashboard/projects/corporate-site" },
      { label: "Settings" },
    ],
  },
  render: (args) => (
    <DemoCard block>
      <Breadcrumbs {...args} />
    </DemoCard>
  ),
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

// Breadcrumbs has no design-variant/size axis — its only axis is depth (how many levels), which are
// content states, each its own story. So there is no AllVariants.

// Default — the full path (root → intermediate links → active).
export const Default: Story = {};

// Only the root item + one active level, no intermediate links.
export const SingleLevel: Story = {
  args: { items: [{ label: "Home" }] },
};

// Two levels: one intermediate link + the active one (last, no href).
export const TwoLevels: Story = {
  args: {
    items: [{ label: "Projects", href: "/dashboard/projects" }, { label: "Detail" }],
  },
};

// Auto-collapse via ResizeObserver: when the full chain doesn't fit it shows Home / … / Last.
// A fixed narrow container (e.g. mobile) triggers it; the … is a button that reveals the hidden levels.
export const Collapsed: Story = {
  args: {
    items: [
      { label: "Organization", href: "#" },
      { label: "Projects", href: "#" },
      { label: "Corporate site", href: "#" },
      { label: "Pages", href: "#" },
      { label: "Home" },
    ],
  },
  render: (args) => (
    <div className="flex flex-col gap-3">
      <p className="text-caption text-content-secondary font-mono">
        On a narrow width (e.g. mobile) the path collapses to Home / … / Last. Click “…” to expand and
        navigate the hidden levels.
      </p>
      <DemoCard block>
        <div className="w-[300px] rounded-md border border-border-default bg-surface-primary p-3">
          <Breadcrumbs {...args} />
        </div>
      </DemoCard>
    </div>
  ),
};
