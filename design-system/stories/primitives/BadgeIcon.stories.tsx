import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Settings, Check, AlertTriangle, X, Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import IconBadge, { type IconBadgeVariant } from "@/components/ui/IconBadge";

// Title "BadgeIcon" so it sits right after "Badge" in the sidebar (Badge family).
// SEMANTIC icons per variant + icon size that scales with the box, same as the dashboard.
const ICONS: Record<IconBadgeVariant, LucideIcon> = {
  default: Settings,
  success: Check,
  warning: AlertTriangle,
  error: X,
  info: Info,
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

// Playground — the icon scales with size and changes with the variant (use the controls).
export const Default: Story = {
  render: (args) => (
    <IconBadge {...args}>
      {renderIcon(args.variant ?? "default", args.size ?? "md")}
    </IconBadge>
  ),
};

// All 5 variants (md size), each with its semantic icon.
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {VARIANTS.map((v) => (
        <IconBadge key={v} variant={v}>
          {renderIcon(v, "md")}
        </IconBadge>
      ))}
    </div>
  ),
};

// The 3 sizes (default variant), with box/icon px.
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-4">
      {SIZES.map(({ key, box }) => (
        <div key={key} className="flex flex-col items-center gap-1">
          <IconBadge size={key}>{renderIcon("default", key)}</IconBadge>
          <span className="text-caption text-content-tertiary font-mono">
            {key} · {box}px · {ICON_PX[key]}px{key === "md" ? " (default)" : ""}
          </span>
        </div>
      ))}
    </div>
  ),
};

// AllVariants — ALWAYS last: full size × variant matrix (semantic icon).
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      {SIZES.map(({ key, box }) => (
        <div key={key}>
          <p className="mb-2 text-caption text-content-tertiary font-mono">
            {key} · {box}px · {ICON_PX[key]}px{key === "md" ? " (default)" : ""}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {VARIANTS.map((v) => (
              <div key={v} className="flex flex-col items-center gap-1">
                <IconBadge variant={v} size={key}>
                  {renderIcon(v, key)}
                </IconBadge>
                <span className="text-caption text-content-tertiary">{cap(v)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};
