import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Bell,
  Trash2,
  Copy,
  Settings,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import IconButton, { type IconButtonVariant } from "@/components/ui/IconButton";
import { DemoCard, Variants, Sizes } from "../_kit";

// Title "ButtonIcon" so it sits right after "Button" in the sidebar (Button family).
// Icon-only → always pass aria-label. The playground defaults to `boxed`, the most used in the project.
// El glyph se pasa con el prop `icon` (el contenedor le impone el tamaño desde la escala: 16px); nunca a mano.
const meta = {
  title: "Migration/ButtonIcon",
  component: IconButton,
  tags: ["autodocs"],
  args: {
    variant: "boxed",
    size: "sm",
    "aria-label": "Settings",
    icon: Settings,
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
  args: {
    variant: "boxed-hover",
    "aria-label": "Notifications",
    icon: Bell,
  },
};

// Ghost — transparent, no surface, icon at 50% opacity → discreet inline actions. (variant="default")
export const Ghost: Story = {
  args: {
    variant: "default",
    "aria-label": "Copy",
    icon: Copy,
  },
};

// Danger — error color; error background on hover. (variant="danger")
export const Danger: Story = {
  args: {
    variant: "danger",
    "aria-label": "Delete",
    icon: Trash2,
  },
};

// ── STATES — runtime state (NOT variants) · grouped overview, one card per state ──
export const States: Story = {
  render: () => (
    <Variants
      items={[
        {
          label: "Loading",
          node: (
            <IconButton
              variant="boxed"
              loading
              icon={Settings}
              aria-label="Loading"
            />
          ),
        },
        {
          label: "Disabled",
          node: (
            <IconButton
              variant="boxed"
              disabled
              icon={Settings}
              aria-label="Disabled"
            />
          ),
        },
        {
          label: "Pressed (aria-pressed)",
          node: (
            <IconButton
              variant="boxed"
              aria-pressed="true"
              icon={Settings}
              aria-label="Pressed"
            />
          ),
        },
      ]}
    />
  ),
};

// ── SHAPE — the FORM axis (square vs circle), orthogonal to colour and size · grouped overview ──
// The form only reads on variants with a surface, so it's shown on `boxed`.
export const Shape: Story = {
  render: () => (
    <Variants
      items={[
        {
          label: "square (default)",
          node: (
            <IconButton
              variant="boxed"
              shape="square"
              icon={Settings}
              aria-label="Square"
            />
          ),
        },
        {
          label: "circle",
          node: (
            <IconButton
              variant="boxed"
              shape="circle"
              icon={Settings}
              aria-label="Circle"
            />
          ),
        },
      ]}
    />
  ),
};

// ── BEHAVIOR — affordances triggered by interaction (hover), NOT style/state · grouped overview ──
// Hover each card: the icon spins (spinOnHover cw/ccw), or a tooltip appears (tooltip). Opt-in props
// orthogonal to variant/size/shape — a component gets this bucket only if it has hover affordances.
export const Behavior: Story = {
  render: () => (
    <Variants
      items={[
        {
          label: "spinOnHover cw (hover)",
          node: (
            <IconButton
              variant="boxed"
              shape="circle"
              spinOnHover="cw"
              icon={ArrowLeft}
              aria-label="Spin clockwise"
            />
          ),
        },
        {
          label: "spinOnHover ccw (hover)",
          node: (
            <IconButton
              variant="boxed"
              shape="circle"
              spinOnHover="ccw"
              icon={ArrowRight}
              aria-label="Spin counter-clockwise"
            />
          ),
        },
        {
          label: "tooltip (hover)",
          node: (
            <IconButton
              variant="default"
              tooltip="Copy"
              icon={Copy}
              aria-label="Copy"
            />
          ),
        },
      ]}
    />
  ),
};

// ── OVERVIEWS (ALWAYS last) — `AllSizes` penultimate, `AllVariants` last. Every other bucket has its own
//    grouped overview ABOVE (States, Shape, Behavior); never mix axes in these two. ──

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
          <IconButton
            size={key}
            variant="boxed"
            icon={Settings}
            aria-label={`Size ${key}`}
          />
        ),
      }))}
    />
  ),
};

// AllVariants — ALWAYS last: groups the VARIANTS (default size). The other buckets each have their own
// grouped overview above (States, Shape, Behavior, AllSizes); never mix different axes/buckets here.
const VARIANT_CARDS: {
  v: IconButtonVariant;
  icon: LucideIcon;
  label: string;
}[] = [
  { v: "boxed", icon: Settings, label: "Default" },
  { v: "boxed-hover", icon: Bell, label: "BoxedHover" },
  { v: "default", icon: Copy, label: "Ghost" },
  { v: "danger", icon: Trash2, label: "Danger" },
];

// AllVariants — ALWAYS last: every variant (default size), grouping the variant stories above.
export const AllVariants: Story = {
  render: () => (
    <Variants
      items={VARIANT_CARDS.map(({ v, icon, label }) => ({
        label,
        node: <IconButton variant={v} icon={icon} aria-label={label} />,
      }))}
    />
  ),
};
