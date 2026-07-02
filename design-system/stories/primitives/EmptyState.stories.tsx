import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import { DemoCard, Variants } from "../_kit";

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
  // EmptyState always lives inside a container (an empty area of a card/table/panel) — the DemoCard is
  // that container.
  render: (args) => (
    <DemoCard block>
      <EmptyState {...args} />
    </DemoCard>
  ),
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

const Action = ({ label }: { label: string }) => (
  <Button variant="primary" size="sm" fullWidth={false}>
    {label}
  </Button>
);

// Default — playground (the default variant, no action). The icon is a prop (default Inbox), variable via
// the control — no dedicated "custom icon" story needed.
export const Default: Story = {};

// With an action (a CTA below the copy).
export const WithAction: Story = {
  args: { action: <Action label="Create project" /> },
};

// The error variant (design axis).
export const ErrorVariant: Story = {
  args: {
    variant: "error",
    title: "Couldn't load users",
    description: "Network error — please try again.",
    action: <Action label="Retry" />,
  },
};

// AllVariants — ALWAYS last: the meaningful cases (default · with action · error), grouping the stories above.
export const AllVariants: Story = {
  render: () => (
    <Variants
      items={[
        {
          label: "Default",
          block: true,
          node: (
            <EmptyState
              title="No projects yet"
              description="Create your first project to get started."
            />
          ),
        },
        {
          label: "With action",
          block: true,
          node: (
            <EmptyState
              title="No projects yet"
              description="Create your first project to get started."
              action={<Action label="Create project" />}
            />
          ),
        },
        {
          label: "Error",
          block: true,
          node: (
            <EmptyState
              variant="error"
              title="Couldn't load users"
              description="Network error — please try again."
              action={<Action label="Retry" />}
            />
          ),
        },
      ]}
    />
  ),
};
