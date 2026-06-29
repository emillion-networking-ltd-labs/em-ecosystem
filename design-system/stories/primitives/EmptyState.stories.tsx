import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Search } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";

const meta = {
  title: "Primitives/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  args: {
    variant: "default",
    title: "No projects yet",
    description: "Create your first project to get started.",
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["default", "error"] },
  },
  // EmptyState always lives inside a container (an empty area of a card/table/panel) — show it in a
  // card so the catalog reflects real usage (same as the dashboard showcase).
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-md rounded-xl border border-border-components bg-surface-primary">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAction: Story = {
  args: {
    title: "No projects yet",
    description: "Create your first project to get started.",
    action: (
      <Button variant="primary" size="sm" fullWidth={false}>
        Create project
      </Button>
    ),
  },
};

export const CustomIcon: Story = {
  args: {
    icon: <Search size={48} />,
    title: "No results",
    description: "No items match your search.",
  },
};

export const ErrorVariant: Story = {
  args: {
    variant: "error",
    title: "Couldn't load users",
    description: "Network error — please try again.",
    action: (
      <Button variant="primary" size="sm" fullWidth={false}>
        Retry
      </Button>
    ),
  },
};

// AllVariants — ALWAYS last: an overview of the variants (default/error), icon and action axes.
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">default</p>
        <div className="max-w-md rounded-xl border border-border-components bg-surface-primary">
          <EmptyState
            title="No projects yet"
            description="Create your first project to get started."
          />
        </div>
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">with action</p>
        <div className="max-w-md rounded-xl border border-border-components bg-surface-primary">
          <EmptyState
            title="No projects yet"
            description="Create your first project to get started."
            action={
              <Button variant="primary" size="sm" fullWidth={false}>
                Create project
              </Button>
            }
          />
        </div>
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">custom icon</p>
        <div className="max-w-md rounded-xl border border-border-components bg-surface-primary">
          <EmptyState
            icon={<Search size={48} />}
            title="No results"
            description="No items match your search."
          />
        </div>
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">error variant</p>
        <div className="max-w-md rounded-xl border border-border-components bg-surface-primary">
          <EmptyState
            variant="error"
            title="Couldn't load users"
            description="Network error — please try again."
            action={
              <Button variant="primary" size="sm" fullWidth={false}>
                Retry
              </Button>
            }
          />
        </div>
      </div>
    </div>
  ),
};
