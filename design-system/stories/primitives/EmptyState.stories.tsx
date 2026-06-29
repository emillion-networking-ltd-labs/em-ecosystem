import type { Meta, StoryObj, Decorator } from "@storybook/nextjs-vite";
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
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

// EmptyState always lives inside a container (an empty area of a card/table/panel) — frame the
// single-state stories in a card so they reflect real usage (same as the dashboard showcase).
const inCard: Decorator = (Story) => (
  <div className="mx-auto max-w-md rounded-xl border border-border-components bg-surface-primary">
    <Story />
  </div>
);

export const Default: Story = { decorators: [inCard] };

export const WithAction: Story = {
  decorators: [inCard],
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
  decorators: [inCard],
  args: {
    icon: <Search size={48} />,
    title: "No results",
    description: "No items match your search.",
  },
};

export const ErrorVariant: Story = {
  decorators: [inCard],
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
// Shown plainly (no card framing) so the four read cleanly side by side without nested boxes.
export const AllVariants: Story = {
  render: () => (
    <div className="grid gap-8 sm:grid-cols-2">
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">default</p>
        <EmptyState
          title="No projects yet"
          description="Create your first project to get started."
        />
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">with action</p>
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
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">custom icon</p>
        <EmptyState
          icon={<Search size={48} />}
          title="No results"
          description="No items match your search."
        />
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">error variant</p>
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
  ),
};
