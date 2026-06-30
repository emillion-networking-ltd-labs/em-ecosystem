import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Badge from "@/components/ui/Badge";
import { DemoCard, Variants, Sizes } from "../_kit";

const meta = {
  title: "Primitives/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: { children: "Label", variant: "default", size: "md" },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["default", "success", "warning", "error", "info", "kbd", "overlay"],
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
  render: (args) => (
    <DemoCard>
      <Badge {...args} />
    </DemoCard>
  ),
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

const VARIANTS = ["default", "success", "warning", "error", "info", "kbd", "overlay"] as const;
const SIZES = [
  { key: "lg", px: "16" },
  { key: "md", px: "14" },
  { key: "sm", px: "12" },
] as const;

const cap = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);
// kbd shows a key combo as its content; the rest show their name.
const content = (v: (typeof VARIANTS)[number]) => (v === "kbd" ? "⌘K" : cap(v));

// Default — playground: try variant and size from the controls.
export const Default: Story = {};

// One story per variant (the design axis), before AllVariants groups them.
export const Success: Story = { args: { variant: "success", children: "Success" } };
export const Warning: Story = { args: { variant: "warning", children: "Warning" } };
export const Error: Story = { args: { variant: "error", children: "Error" } };
export const Info: Story = { args: { variant: "info", children: "Info" } };
export const Kbd: Story = { args: { variant: "kbd", children: "⌘K" } };
export const Overlay: Story = { args: { variant: "overlay", children: "Overlay" } };

// AllSizes — the 3 sizes (default variant), with px.
export const AllSizes: Story = {
  render: () => (
    <Sizes
      items={SIZES.map(({ key, px }) => ({
        label: `${key} · ${px}px${key === "md" ? " (default)" : ""}`,
        node: (
          <Badge variant="default" size={key}>
            Default
          </Badge>
        ),
      }))}
    />
  ),
};

// AllVariants — ALWAYS last: every variant (default size), grouping the stories above.
export const AllVariants: Story = {
  render: () => (
    <Variants
      items={VARIANTS.map((v) => ({
        label: cap(v),
        node: <Badge variant={v}>{content(v)}</Badge>,
      }))}
    />
  ),
};
