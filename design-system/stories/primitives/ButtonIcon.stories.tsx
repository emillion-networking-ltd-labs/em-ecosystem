import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Bell, Trash2, Copy, Settings, ArrowLeft, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import IconButton, { type IconButtonVariant } from "@/components/ui/IconButton";
import { DemoCard, Variants, Sizes } from "../_kit";

// Title "ButtonIcon" so it sits right after "Button" in the sidebar (Button family).
// Icon-only → always pass aria-label. The playground defaults to `boxed`, the most used in the project.
const meta = {
  title: "Primitives/ButtonIcon",
  component: IconButton,
  tags: ["autodocs"],
  args: {
    variant: "boxed",
    size: "sm",
    "aria-label": "Settings",
    children: <Settings size={16} />,
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["default", "danger", "boxed", "boxed-hover"],
    },
    size: { control: "inline-radio", options: ["sm", "md"] },
    shape: { control: "inline-radio", options: ["square", "circle"] },
    spinOnHover: { control: "inline-radio", options: [undefined, "cw", "ccw"] },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  render: (args) => (
    <DemoCard>
      <IconButton {...args} />
    </DemoCard>
  ),
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── VARIANTS (the `variant` axis) — one story per variant; grouped by `AllVariants` at the end ──

// Default — boxed: filled surface (surface-tertiary). The default of the catalog, the most used. (variant="boxed")
export const Default: Story = {};

// BoxedHover — transparent; gains a surface on hover. (variant="boxed-hover")
export const BoxedHover: Story = {
  args: { variant: "boxed-hover", "aria-label": "Notifications", children: <Bell size={16} /> },
};

// Ghost — transparent, no surface, icon at 50% opacity → discreet inline actions. (variant="default")
export const Ghost: Story = {
  args: { variant: "default", "aria-label": "Copy", children: <Copy size={16} /> },
};

// Danger — error color; error background on hover. (variant="danger")
export const Danger: Story = {
  args: { variant: "danger", "aria-label": "Delete", children: <Trash2 size={16} /> },
};

// ── STATES — runtime state (NOT variants) · grouped overview, one card per state ──
export const States: Story = {
  render: () => (
    <Variants
      items={[
        {
          label: "Loading",
          node: (
            <IconButton variant="boxed" loading aria-label="Loading">
              <Settings size={16} />
            </IconButton>
          ),
        },
        {
          label: "Disabled",
          node: (
            <IconButton variant="boxed" disabled aria-label="Disabled">
              <Settings size={16} />
            </IconButton>
          ),
        },
        {
          label: "Pressed (aria-pressed)",
          node: (
            <IconButton variant="boxed" aria-pressed="true" aria-label="Pressed">
              <Settings size={16} />
            </IconButton>
          ),
        },
      ]}
    />
  ),
};

// ── CONTENT / BEHAVIOR — how the icon reacts on hover · interactive, so kept as dedicated stories ──

// SpinOnHover — the icon rotates on hover (cw / ccw), e.g. carousel arrows. Hover each button.
export const SpinOnHover: Story = {
  render: () => (
    <DemoCard>
      <div className="flex items-end gap-4">
        <IconButton variant="boxed" shape="circle" spinOnHover="cw" aria-label="Spin clockwise">
          <ArrowLeft size={16} />
        </IconButton>
        <IconButton variant="boxed" shape="circle" spinOnHover="ccw" aria-label="Spin counter-clockwise">
          <ArrowRight size={16} />
        </IconButton>
      </div>
    </DemoCard>
  ),
};

// WithTooltip — tooltip on hover (uses aria-label when tooltip=true, or a custom string).
export const WithTooltip: Story = {
  args: { variant: "default", tooltip: "Copy", "aria-label": "Copy", children: <Copy size={16} /> },
};

// ── SHAPE / SIZE AXES — an overview per axis orthogonal to style; `AllSizes` is penultimate ──

// Shape — the FORM axis (square vs circle), orthogonal to colour and size (composes with them).
// The form only reads on variants with a surface, so it's shown on `boxed`.
export const Shape: Story = {
  render: () => (
    <Variants
      items={[
        {
          label: "square (default)",
          node: (
            <IconButton variant="boxed" shape="square" aria-label="Square">
              <Settings size={16} />
            </IconButton>
          ),
        },
        {
          label: "circle",
          node: (
            <IconButton variant="boxed" shape="circle" aria-label="Circle">
              <Settings size={16} />
            </IconButton>
          ),
        },
      ]}
    />
  ),
};

// The 2 sizes (largest → smallest), with px (icon 16 + padding). sm is the default.
const SIZES = [
  { key: "md", px: "40" },
  { key: "sm", px: "32" },
] as const;

// AllSizes — the icon-button sizes, with px.
export const AllSizes: Story = {
  render: () => (
    <Sizes
      items={SIZES.map(({ key, px }) => ({
        label: `${key} · ${px}px${key === "sm" ? " (default)" : ""}`,
        node: (
          <IconButton size={key} variant="boxed" aria-label={`Size ${key}`}>
            <Settings size={16} />
          </IconButton>
        ),
      }))}
    />
  ),
};

// ── OVERVIEW (ALWAYS last) ──
// AllVariants — groups the VARIANTS (default size). Every other bucket has its own overview: `States`,
// `Shape`, `AllSizes` — they do NOT belong here (never mix different axes/buckets).
const VARIANT_CARDS: { v: IconButtonVariant; icon: LucideIcon; label: string }[] = [
  { v: "boxed", icon: Settings, label: "Default" },
  { v: "boxed-hover", icon: Bell, label: "BoxedHover" },
  { v: "default", icon: Copy, label: "Ghost" },
  { v: "danger", icon: Trash2, label: "Danger" },
];

// AllVariants — ALWAYS last: every variant (default size), grouping the variant stories above.
export const AllVariants: Story = {
  render: () => (
    <Variants
      items={VARIANT_CARDS.map(({ v, icon: Icon, label }) => ({
        label,
        node: (
          <IconButton variant={v} aria-label={label}>
            <Icon size={16} />
          </IconButton>
        ),
      }))}
    />
  ),
};
