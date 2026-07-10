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

// ── VARIANTES (eje `variant`) — una story por variante; las agrupa `AllVariants` al final ──
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

// ── ESTADOS — situación runtime (NO variantes) · overview agrupado, un card por estado ──
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

// ── CONTENIDO — qué lleva DENTRO (children); ortogonal a las variantes · overview agrupado ──
export const Content: Story = {
  render: () => (
    <Variants
      items={[
        {
          label: "icono + texto",
          node: (
            <Button variant="primary" fullWidth={false}>
              <Settings size={16} />
              Settings
            </Button>
          ),
        },
        {
          label: "link con icono",
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

// ── EJES DE FORMA / TAMAÑO — overviews de cada eje ortogonal al estilo; `AllSizes` penúltima ──
// Shape — el eje de FORMA (default vs circle), ortogonal al color y al tamaño (se compone con ellos). ECO-166.
// `circle` = redondo/pill auto-width (redondo para texto corto como "15", pill para largo). SOLO con texto:
// el botón circular con SOLO icono es IconButton (primitivo aparte). Antes era un hack de `className`.
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

// The 6 variants (default size), labelled by their story name.
const VARIANT_CARDS = [
  { v: "primary", label: "Primary", children: "Continue" },
  { v: "secondary", label: "Secondary", children: "Continue" },
  { v: "outline", label: "Outline", children: "Continue" },
  { v: "danger", label: "Danger", children: "Delete" },
  { v: "link", label: "Link", children: "See more" },
  { v: "link-underline", label: "LinkUnderline", children: "See more" },
] as const;

// ── OVERVIEW (siempre la ÚLTIMA) ──
// AllVariants — agrupa las VARIANTES (tamaño default). Cada otro cajón tiene su propio overview: `States`,
// `Content`, `Shape`, `AllSizes` — NO van aquí (no se mezclan ejes/cajones distintos).
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
