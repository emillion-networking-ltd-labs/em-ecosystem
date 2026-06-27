import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import SearchTrigger from "@/components/ui/SearchTrigger";

const meta = {
  title: "Primitives/SearchTrigger",
  component: SearchTrigger,
  tags: ["autodocs"],
  args: {
    onClick: () => {},
  },
} satisfies Meta<typeof SearchTrigger>;

export default meta;
type Story = StoryObj<typeof meta>;

// Disparador único: botón outline sm (icono Search 16px + "Search..." + Badge
// kbd con el atajo ⌘K/Ctrl+K según plataforma). No tiene variantes ni tamaños.
export const Default: Story = {};

// En contexto, dentro de una barra superior.
export const InTopBar: Story = {
  render: (args) => (
    <div className="flex w-[420px] items-center justify-between rounded-md border border-border-components bg-surface-primary px-4 py-2">
      <span className="text-body font-semibold text-content-primary">
        NexaCore
      </span>
      <SearchTrigger {...args} />
    </div>
  ),
};
