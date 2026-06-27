import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Badge from "@/components/ui/Badge";

const meta = {
  title: "Primitives/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: { children: "Activo", variant: "success", size: "md" },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {(
        [
          "default",
          "success",
          "warning",
          "error",
          "info",
          "kbd",
          "overlay",
        ] as const
      ).map((v) => (
        <Badge key={v} variant={v}>
          {v === "kbd" ? "⌘K" : v}
        </Badge>
      ))}
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {(["sm", "md", "lg"] as const).map((s) => (
        <Badge key={s} variant="success" size={s}>
          {s}
        </Badge>
      ))}
    </div>
  ),
};
