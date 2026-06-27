import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Avatar from "@/components/ui/Avatar";

const meta = {
  title: "Primitives/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  args: { name: "Ada Lovelace", size: "md" },
  argTypes: { size: { control: "inline-radio", options: ["sm", "md", "lg"] } },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Initials: Story = {};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      {(["sm", "md", "lg"] as const).map((s) => (
        <Avatar key={s} name="Ada Lovelace" size={s} />
      ))}
    </div>
  ),
};

// Fallback chain: image (src) → initials (name) → User icon (no src/name)
export const Fallbacks: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-6">
      <div className="flex flex-col items-center gap-1.5">
        <Avatar
          size="lg"
          name="Ada Lovelace"
          src="https://i.pravatar.cc/64?u=1"
        />
        <span className="text-caption text-content-tertiary">Imagen</span>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <Avatar size="lg" name="Ada Lovelace" />
        <span className="text-caption text-content-tertiary">Iniciales</span>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <Avatar size="lg" />
        <span className="text-caption text-content-tertiary">Icono</span>
      </div>
    </div>
  ),
};
