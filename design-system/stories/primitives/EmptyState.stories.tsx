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
