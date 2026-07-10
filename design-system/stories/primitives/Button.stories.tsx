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

// One story per variant (the design axis), before AllVariants groups them.
export const Primary: Story = {};
export const Secondary: Story = { args: { variant: "secondary" } };
export const Outline: Story = { args: { variant: "outline" } };
export const Danger: Story = {
  args: { variant: "danger", children: "Delete" },
};
export const Link: Story = { args: { variant: "link", children: "See more" } };
export const LinkUnderline: Story = {
  args: { variant: "link-underline", children: "See more" },
};
// link-underline with a leading icon (e.g. a back link) — as in the dashboard.
export const LinkUnderlineWithIcon: Story = {
  args: {
    variant: "link-underline",
    children: (
      <>
        <ArrowLeft size={16} />
        Back
      </>
    ),
  },
};

// States.
export const Loading: Story = { args: { loading: true } };
export const Disabled: Story = { args: { disabled: true } };

// Icon + text (Button adds the gap automatically).
export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Settings size={16} />
        Settings
      </>
    ),
  },
};

// Shape — el eje de FORMA (default vs circle), ortogonal al color y al tamaño (se compone con ellos). ECO-166.
// `circle` = redondo/pill auto-width (redondo para texto corto como "15", pill para largo). SOLO con texto:
// el botón circular con SOLO icono es IconButton (primitivo aparte). Antes era un hack de `className`.
const CIRCLE_VARIANTS = ["primary", "secondary", "outline", "danger"] as const;

export const Shape: Story = {
  render: () => (
    <DemoCard>
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-end gap-8">
          <div className="flex flex-col items-center gap-2">
            <p className="text-caption text-content-secondary font-mono">
              default
            </p>
            <Button variant="primary" fullWidth={false}>
              Continue
            </Button>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-caption text-content-secondary font-mono">
              circle
            </p>
            <Button variant="primary" fullWidth={false} shape="circle">
              15
            </Button>
          </div>
        </div>
        <div>
          <p className="mb-2 text-caption text-content-secondary font-mono">
            circle · compone con cada variante de color
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {CIRCLE_VARIANTS.map((v) => (
              <Button key={v} variant={v} fullWidth={false} shape="circle">
                15
              </Button>
            ))}
          </div>
        </div>
      </div>
    </DemoCard>
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

// The 6 variants (default size), labelled by their story name.
const VARIANT_CARDS = [
  { v: "primary", label: "Primary", children: "Continue" },
  { v: "secondary", label: "Secondary", children: "Continue" },
  { v: "outline", label: "Outline", children: "Continue" },
  { v: "danger", label: "Danger", children: "Delete" },
  { v: "link", label: "Link", children: "See more" },
  { v: "link-underline", label: "LinkUnderline", children: "See more" },
] as const;

// AllVariants — ALWAYS last: every variant (default size), grouping the variant stories above. States
// (Loading/Disabled), icons and Circular each have their own story — they do not belong here.
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
