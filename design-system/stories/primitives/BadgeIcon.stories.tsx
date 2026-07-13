import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Settings,
  Check,
  AlertTriangle,
  X,
  Info as InfoIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import IconBadge, { type IconBadgeVariant } from "@/components/ui/IconBadge";
import { DemoCard, Variants, Sizes } from "../_kit";

// Title "BadgeIcon" so it sits right after "Badge" in the sidebar (Badge family).
// SEMANTIC icons per variant + icon size that scales with the box, same as the dashboard.
const ICONS: Record<IconBadgeVariant, LucideIcon> = {
  default: Settings,
  success: Check,
  warning: AlertTriangle,
  error: X,
  info: InfoIcon,
};
// El contenedor impone el tamaño del icono desde la escala; box → icono: sm 32px→16 · md 40px→24 · lg 56px→32
// (lg = 32, xl, legítimo con la escala regular de ECO-184). ICON_PX se conserva solo para la etiqueta de AllSizes.
const ICON_PX = { sm: 16, md: 24, lg: 32 } as const;

const meta = {
  title: "Migration/BadgeIcon",
  component: IconBadge,
  tags: ["autodocs"],
  args: { variant: "default", size: "sm" },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["default", "success", "warning", "error", "info"],
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
  render: (args) => (
    <DemoCard>
      <IconBadge {...args} icon={ICONS[args.variant ?? "default"]} />
    </DemoCard>
  ),
} satisfies Meta<typeof IconBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

const VARIANTS = ["default", "success", "warning", "error", "info"] as const;
const SIZES = [
  { key: "lg", box: "56" },
  { key: "md", box: "40" },
  { key: "sm", box: "32" },
] as const;

const cap = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);

// Default — playground: the icon scales with size and changes with the variant (use the controls).
export const Default: Story = {};

// One story per variant (the design axis), before AllVariants groups them.
export const Success: Story = { args: { variant: "success" } };
export const Warning: Story = { args: { variant: "warning" } };
export const Error: Story = { args: { variant: "error" } };
export const Info: Story = { args: { variant: "info" } };

// AllSizes — the 3 sizes (default variant), with box/icon px.
export const AllSizes: Story = {
  render: () => (
    <Sizes
      items={SIZES.map(({ key, box }) => ({
        label: `${key} · ${box}px · ${ICON_PX[key]}px${key === "sm" ? " (default)" : ""}`,
        node: <IconBadge size={key} icon={ICONS.default} />,
      }))}
    />
  ),
};

// AllVariants — ALWAYS last: every variant (default size), each with its semantic icon.
export const AllVariants: Story = {
  render: () => (
    <Variants
      items={VARIANTS.map((v) => ({
        label: cap(v),
        node: <IconBadge variant={v} icon={ICONS[v]} />,
      }))}
    />
  ),
};
