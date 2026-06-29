import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

const meta = {
  title: "Primitives/Breadcrumbs",
  component: Breadcrumbs,
  tags: ["autodocs"],
  args: {
    items: [
      { label: "Projects", href: "/dashboard/projects" },
      { label: "Corporate site", href: "/dashboard/projects/corporate-site" },
      { label: "Settings" },
    ],
  },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Only the root item (Birdhouse) + one active level, no intermediate links.
export const SingleLevel: Story = {
  args: {
    items: [{ label: "Home" }],
  },
};

// Two levels: one intermediate link + the active one (last, no href).
export const TwoLevels: Story = {
  args: {
    items: [
      { label: "Projects", href: "/dashboard/projects" },
      { label: "Detail" },
    ],
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
    <div className="flex flex-col gap-2">
      <span className="text-caption text-content-tertiary">
        On a narrow width (e.g. mobile) the path collapses to Home / … / Last.
        Click “…” to expand and navigate the hidden levels.
      </span>
      <div className="w-[300px] rounded-md border border-border-components bg-surface-primary p-3">
        <Breadcrumbs {...args} />
      </div>
    </div>
  ),
};

// AllVariants — ALWAYS last: an overview of the depth levels (Breadcrumbs' only axis).
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">single level</p>
        <Breadcrumbs items={[{ label: "Home" }]} />
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">two levels</p>
        <Breadcrumbs
          items={[{ label: "Projects", href: "/dashboard/projects" }, { label: "Detail" }]}
        />
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">full path</p>
        <Breadcrumbs
          items={[
            { label: "Projects", href: "/dashboard/projects" },
            { label: "Corporate site", href: "/dashboard/projects/corporate-site" },
            { label: "Settings" },
          ]}
        />
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">collapsed (narrow)</p>
        <div className="w-[300px] rounded-md border border-border-components bg-surface-primary p-3">
          <Breadcrumbs
            items={[
              { label: "Organization", href: "#" },
              { label: "Projects", href: "#" },
              { label: "Corporate site", href: "#" },
              { label: "Pages", href: "#" },
              { label: "Home" },
            ]}
          />
        </div>
      </div>
    </div>
  ),
};
