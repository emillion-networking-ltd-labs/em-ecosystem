import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Badge from "@/components/ui/Badge";

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
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

const VARIANTS = ["default", "success", "warning", "error", "info", "kbd", "overlay"] as const;
const SIZES = [
  { key: "lg", px: "16" },
  { key: "md", px: "14" },
  { key: "sm", px: "12" },
] as const;

const label = (v: (typeof VARIANTS)[number]) =>
  v === "kbd" ? "⌘K" : v.charAt(0).toUpperCase() + v.slice(1);

// Playground — use the controls to try variant and size.
export const Default: Story = {};

// All 7 variants (md size).
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {VARIANTS.map((v) => (
        <Badge key={v} variant={v}>
          {label(v)}
        </Badge>
      ))}
    </div>
  ),
};

// AllSizes — the 3 sizes (default variant), with px.
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-4">
      {SIZES.map(({ key, px }) => (
        <div key={key} className="flex flex-col items-center gap-1">
          <Badge variant="default" size={key}>
            Default
          </Badge>
          <span className="text-caption text-content-tertiary font-mono">
            {key} · {px}px{key === "md" ? " (default)" : ""}
          </span>
        </div>
      ))}
    </div>
  ),
};

// AllVariants — ALWAYS last: full size × variant matrix (dashboard layout).
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      {SIZES.map(({ key, px }) => (
        <div key={key}>
          <p className="mb-2 text-caption text-content-tertiary font-mono">
            {key} · {px}px{key === "md" ? " (default)" : ""}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {VARIANTS.map((v) => (
              <Badge key={v} variant={v} size={key}>
                {label(v)}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};
