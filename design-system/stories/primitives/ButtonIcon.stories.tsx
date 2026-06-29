import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Bell, Trash2, Copy, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import IconButton, { type IconButtonVariant } from "@/components/ui/IconButton";

// Title "ButtonIcon" so it sits right after "Button" in the sidebar (Button family).
// Semantic icon per variant, same as the dashboard showcase. Icon-only → always pass aria-label.
const ICONS: Record<IconButtonVariant, LucideIcon> = {
  default: Copy,
  danger: Trash2,
  boxed: Settings,
  "boxed-hover": Bell,
};

const meta = {
  title: "Primitives/ButtonIcon",
  component: IconButton,
  tags: ["autodocs"],
  args: {
    variant: "default",
    size: "sm",
    "aria-label": "Copy",
    children: <Copy size={16} />,
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["default", "danger", "boxed", "boxed-hover"],
    },
    size: { control: "inline-radio", options: ["sm", "md"] },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const VARIANTS = ["default", "danger", "boxed", "boxed-hover"] as const;
const cap = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);

// Playground — use the controls (icon-only buttons always carry an aria-label).
export const Default: Story = {};

// The 4 variants, each with its semantic icon.
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {VARIANTS.map((v) => {
        const Icon = ICONS[v];
        return (
          <IconButton key={v} variant={v} aria-label={v}>
            <Icon size={16} />
          </IconButton>
        );
      })}
    </div>
  ),
};

// The 2 sizes (largest to smallest), with px (icon 16 + padding). sm is the component default.
const SIZES = [
  { key: "md", px: "40" },
  { key: "sm", px: "32" },
] as const;

// AllSizes — the icon-button sizes, with px.
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-4">
      {SIZES.map(({ key, px }) => (
        <div key={key} className="flex flex-col items-center gap-1">
          <IconButton size={key} variant="boxed" aria-label={`Size ${key}`}>
            <Settings size={16} />
          </IconButton>
          <span className="text-caption text-content-tertiary font-mono">
            {key} · {px}px{key === "sm" ? " (default)" : ""}
          </span>
        </div>
      ))}
    </div>
  ),
};

// States: normal, loading (spinner), disabled (opacity-50).
export const States: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <IconButton variant="boxed" aria-label="Normal">
        <Settings size={16} />
      </IconButton>
      <IconButton variant="boxed" loading aria-label="Loading" />
      <IconButton variant="boxed" disabled aria-label="Disabled">
        <Settings size={16} />
      </IconButton>
    </div>
  ),
};

// boxed with aria-pressed → ring (active state, e.g. collapsed SidebarNav toggle).
export const Pressed: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <IconButton variant="boxed" aria-label="Inactive">
        <Settings size={16} />
      </IconButton>
      <IconButton variant="boxed" aria-pressed="true" aria-label="Active">
        <Settings size={16} />
      </IconButton>
    </div>
  ),
};

// With tooltip (uses aria-label when tooltip=true, or a custom string).
export const WithTooltip: Story = {
  args: { variant: "default", tooltip: "Copy", "aria-label": "Copy", children: <Copy size={16} /> },
};

// AllVariants — ALWAYS last: variants + states + pressed.
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">variants</p>
        <div className="flex flex-wrap items-center gap-3">
          {VARIANTS.map((v) => {
            const Icon = ICONS[v];
            return (
              <div key={v} className="flex flex-col items-center gap-1">
                <IconButton variant={v} aria-label={v}>
                  <Icon size={16} />
                </IconButton>
                <span className="text-caption text-content-tertiary">{cap(v)}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">states</p>
        <div className="flex flex-wrap items-center gap-3">
          <IconButton variant="boxed" aria-label="Normal">
            <Settings size={16} />
          </IconButton>
          <IconButton variant="boxed" loading aria-label="Loading" />
          <IconButton variant="boxed" disabled aria-label="Disabled">
            <Settings size={16} />
          </IconButton>
          <IconButton variant="boxed" aria-pressed="true" aria-label="Active (pressed)">
            <Settings size={16} />
          </IconButton>
        </div>
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">tooltip (hover)</p>
        <div className="flex flex-wrap items-center gap-3">
          <IconButton variant="default" tooltip="Copy" aria-label="Copy">
            <Copy size={16} />
          </IconButton>
          <IconButton variant="danger" tooltip="Delete" aria-label="Delete">
            <Trash2 size={16} />
          </IconButton>
        </div>
      </div>
    </div>
  ),
};
