import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import EmptyState from "@/components/ui/EmptyState";

const meta = {
  title: "Primitives/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  args: {
    variant: "default",
    title: "No hay proyectos todavía",
    description: "Crea tu primer proyecto para empezar a trabajar.",
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["default", "error"] },
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
