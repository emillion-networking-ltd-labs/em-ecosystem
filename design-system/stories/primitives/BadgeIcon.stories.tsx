import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Settings, Check, AlertTriangle, X, Info as InfoIcon } from "lucide-react";
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
// box → icon: sm 32px→16 · md 40px→24 · lg 56px→32 (iconBadgeSpecs).
const ICON_PX = { sm: 16, md: 24, lg: 32 } as const;

const renderIcon = (variant: IconBadgeVariant, size: "sm" | "md" | "lg") => {
  const Icon = ICONS[variant];
  return <Icon size={ICON_PX[size]} />;
};

const meta = {
  title: "Primitives/BadgeIcon",
  component: IconBadge,
  tags: ["autodocs"],
  args: { variant: "default", size: "md" },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["default", "success", "warning", "error", "info"],
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
  render: (args) => (
    <DemoCard>
      <IconBadge {...args}>{renderIcon(args.variant ?? "default", args.size ?? "md")}</IconBadge>
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
        label: `${key} · ${box}px · ${ICON_PX[key]}px${key === "md" ? " (default)" : ""}`,
        node: <IconBadge size={key}>{renderIcon("default", key)}</IconBadge>,
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
        node: <IconBadge variant={v}>{renderIcon(v, "md")}</IconBadge>,
      }))}
    />
  ),
};
