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

export const Auto: Story = {
  args: {
    position: "auto",
    content: "Posición automática según el borde del viewport.",
  },
};

const triggerClass =
  "rounded-lg border border-border-components bg-surface-primary px-4 py-2 text-body text-content-primary";

export const AllPositions: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3 py-8">
      {(["top", "bottom", "left", "right"] as const).map((pos) => (
        <Tooltip key={pos} content={`Tooltip ${pos}`} position={pos}>
          <button type="button" className={triggerClass}>
            {pos.charAt(0).toUpperCase() + pos.slice(1)}
          </button>
        </Tooltip>
      ))}
    </div>
  ),
};
