import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Tooltip from "@/components/ui/Tooltip";

const meta = {
  title: "Primitives/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  args: {
    content: "Pasa el cursor para ver más detalles.",
    position: "top",
    children: (
      <button
        type="button"
        className="rounded-lg border border-border-components bg-surface-primary px-4 py-2 text-body text-content-primary"
      >
        Pásame el cursor
      </button>
    ),
  },
  argTypes: {
    position: {
      control: "select",
      options: ["top", "bottom", "left", "right", "auto"],
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
