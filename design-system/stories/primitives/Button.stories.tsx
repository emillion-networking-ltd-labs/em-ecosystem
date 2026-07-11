import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Settings, ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import { DemoCard, Variants, Sizes } from "../_kit";

const meta = {
  title: "Primitives/Button",
  component: Button,
  tags: ["autodocs"],
  // fullWidth:false in the catalog so buttons render at their own size (the component defaults to
  // true, intended for forms — toggleable via the control).
  args: {
    children: "Continue",
    variant: "primary",
    size: "md",
    shape: "default",
    fullWidth: false,
  },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "primary",
        "secondary",
        "outline",
        "danger",
        "ghost",
        "link",
        "link-underline",
      ],
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    shape: { control: "inline-radio", options: ["default", "circle"] },
    fullWidth: { control: "boolean" },
  },
  render: (args) => (
    <DemoCard>
      <Button {...args} />
    </DemoCard>
  ),
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── VARIANTS (the `variant` axis) — one story per variant; grouped by `AllVariants` at the end ──
export const Primary: Story = {};
export const Secondary: Story = { args: { variant: "secondary" } };
export const Outline: Story = { args: { variant: "outline" } };
export const Danger: Story = {
  args: { variant: "danger", children: "Delete" },
};
// Ghost — control surface WITHOUT fill or visible border; quiet text that gains a background on hover.
// For toolbars, a segmented control's inactive segment, or the "ghost" look IconButton does by hand.
export const Ghost: Story = { args: { variant: "ghost", children: "Ghost" } };
export const Link: Story = { args: { variant: "link", children: "See more" } };
export const LinkUnderline: Story = {
  args: { variant: "link-underline", children: "See more" },
};

// ── STATES — runtime state (NOT variants) · grouped overview, one card per state ──
export const States: Story = {
  render: () => (
    <Variants
      items={[
        {
          label: "loading",
          node: (
            <Button variant="primary" fullWidth={false} loading>
              Continue
            </Button>
          ),
        },
        {
          label: "disabled",
          node: (
            <Button variant="primary" fullWidth={false} disabled>
              Continue
            </Button>
          ),
        },
      ]}
    />
  ),
};

// ── CONTENT — what goes INSIDE (children); orthogonal to variants · grouped overview ──
export const Content: Story = {
  render: () => (
    <Variants
      items={[
        {
          label: "icon + text",
          node: (
            <Button variant="primary" fullWidth={false}>
              <Settings size={16} />
              Settings
            </Button>
          ),
        },
        {
          label: "link with icon",
          node: (
            <Button variant="link-underline" fullWidth={false}>
              <ArrowLeft size={16} />
              Back
            </Button>
          ),
        },
      ]}
    />
  ),
};

// ── SHAPE / SIZE AXES — an overview per axis orthogonal to style; `AllSizes` is penultimate ──
// Shape — the FORM axis (default vs circle), orthogonal to colour and size (composes with them). ECO-166.
// `circle` = round/pill auto-width (round for short text like "15", pill for long). TEXT only:
// the icon-only circular button is IconButton (a separate primitive). Was a `className` hack before.
const CIRCLE_VARIANTS = ["primary", "secondary", "outline", "danger"] as const;

export const Shape: Story = {
  render: () => (
    <Variants
      items={[
        {
          label: "default",
          node: (
            <Button variant="primary" fullWidth={false}>
              Continue
            </Button>
          ),
        },
        ...CIRCLE_VARIANTS.map((v) => ({
          label: `circle · ${v}`,
          node: (
            <Button variant={v} fullWidth={false} shape="circle">
              15
            </Button>
          ),
        })),
      ]}
    />
  ),
};

// The 3 sizes (primary variant), with their height in px.
const SIZES = [
  { key: "lg", px: "48" },
  { key: "md", px: "40" },
  { key: "sm", px: "32" },
] as const;

// AllSizes — the button sizes, with px.
export const AllSizes: Story = {
  render: () => (
    <Sizes
      items={SIZES.map(({ key, px }) => ({
        label: `${key} · ${px}px${key === "md" ? " (default)" : ""}`,
        node: (
          <Button variant="primary" size={key} fullWidth={false}>
            Continue
          </Button>
        ),
      }))}
    />
  ),
};

// The 7 variants (default size), labelled by their story name.
const VARIANT_CARDS = [
  { v: "primary", label: "Primary", children: "Continue" },
  { v: "secondary", label: "Secondary", children: "Continue" },
  { v: "outline", label: "Outline", children: "Continue" },
  { v: "danger", label: "Danger", children: "Delete" },
  { v: "ghost", label: "Ghost", children: "Ghost" },
  { v: "link", label: "Link", children: "See more" },
  { v: "link-underline", label: "LinkUnderline", children: "See more" },
] as const;

// ── OVERVIEW (ALWAYS last) ──
// AllVariants — groups the VARIANTS (default size). Every other bucket has its own overview: `States`,
// `Content`, `Shape`, `AllSizes` — they do NOT belong here (never mix different axes/buckets).
export const AllVariants: Story = {
  render: () => (
    <Variants
      items={VARIANT_CARDS.map(({ v, label, children }) => ({
        label,
        node: (
          <Button variant={v} fullWidth={false}>
            {children}
          </Button>
        ),
      }))}
    />
  ),
};
