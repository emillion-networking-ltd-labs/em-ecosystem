import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Bell, Trash2, Copy, Settings, ArrowLeft, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import IconButton, { type IconButtonVariant } from "@/components/ui/IconButton";

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
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const cap = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);

// ----- One story per variant (color axis) -----

// Default — boxed: filled surface (surface-tertiary). The default of the catalog, the most used. (variant="boxed")
export const Default: Story = {};

// Boxed-hover — transparent; gains a surface on hover. (variant="boxed-hover")
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

// ----- Shape (orthogonal to color) -----

// Circle — rounded-full instead of rounded-md. Combines with any variant (e.g. the testimonial arrows
// use boxed + circle). The form only reads on variants with a surface, so it's shown on `boxed`.
export const Circle: Story = {
  args: { shape: "circle", "aria-label": "Settings" },
};

// SpinOnHover — the icon rotates on hover (cw / ccw), e.g. carousel arrows. Hover each button.
export const SpinOnHover: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <IconButton variant="boxed" shape="circle" spinOnHover="cw" aria-label="Spin clockwise">
        <ArrowLeft size={16} />
      </IconButton>
      <IconButton variant="boxed" shape="circle" spinOnHover="ccw" aria-label="Spin counter-clockwise">
        <ArrowRight size={16} />
      </IconButton>
    </div>
  ),
};

// ----- States -----

// Loading — spinner replaces the icon; the button is disabled.
export const Loading: Story = { args: { loading: true } };

// Disabled — non-interactive (opacity-50).
export const Disabled: Story = { args: { disabled: true } };

// Pressed — boxed with aria-pressed → ring (active state, e.g. a collapsed SidebarNav toggle).
export const Pressed: Story = {
  args: { "aria-pressed": "true", "aria-label": "Active" },
};

// WithTooltip — tooltip on hover (uses aria-label when tooltip=true, or a custom string).
export const WithTooltip: Story = {
  args: { variant: "default", tooltip: "Copy", "aria-label": "Copy", children: <Copy size={16} /> },
};

// ----- Sizes -----

// The 2 sizes (largest → smallest), with px (icon 16 + padding). sm is the default.
const SIZES = [
  { key: "md", px: "40" },
  { key: "sm", px: "32" },
] as const;

export const Sizes: Story = {
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

// ----- All variants — ALWAYS last -----

const VARIANTS: { v: IconButtonVariant; icon: LucideIcon; name: string }[] = [
  { v: "boxed", icon: Settings, name: "boxed (default)" },
  { v: "boxed-hover", icon: Bell, name: "boxed-hover" },
  { v: "default", icon: Copy, name: "ghost" },
  { v: "danger", icon: Trash2, name: "danger" },
];

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-caption text-content-tertiary font-mono">{title}</p>
      <div className="flex flex-wrap items-end gap-4">{children}</div>
    </div>
  );
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1">
      {children}
      <span className="text-caption text-content-tertiary font-mono">{label}</span>
    </div>
  );
}

// AllVariants — full overview: variants · sizes · shape · spinOnHover · states · tooltip.
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Group title="variants">
        {VARIANTS.map(({ v, icon: Icon, name }) => (
          <Cell key={v} label={name}>
            <IconButton variant={v} aria-label={name}>
              <Icon size={16} />
            </IconButton>
          </Cell>
        ))}
      </Group>

      <Group title="sizes">
        {SIZES.map(({ key, px }) => (
          <Cell key={key} label={`${key} · ${px}px`}>
            <IconButton size={key} variant="boxed" aria-label={`Size ${key}`}>
              <Settings size={16} />
            </IconButton>
          </Cell>
        ))}
      </Group>

      <Group title="shape">
        <Cell label="square">
          <IconButton variant="boxed" shape="square" aria-label="Square">
            <Settings size={16} />
          </IconButton>
        </Cell>
        <Cell label="circle">
          <IconButton variant="boxed" shape="circle" aria-label="Circle">
            <Settings size={16} />
          </IconButton>
        </Cell>
      </Group>

      <Group title="spinOnHover (hover)">
        <Cell label="cw">
          <IconButton variant="boxed" shape="circle" spinOnHover="cw" aria-label="Spin cw">
            <ArrowLeft size={16} />
          </IconButton>
        </Cell>
        <Cell label="ccw">
          <IconButton variant="boxed" shape="circle" spinOnHover="ccw" aria-label="Spin ccw">
            <ArrowRight size={16} />
          </IconButton>
        </Cell>
      </Group>

      <Group title="states">
        <Cell label="normal">
          <IconButton variant="boxed" aria-label="Normal">
            <Settings size={16} />
          </IconButton>
        </Cell>
        <Cell label="loading">
          <IconButton variant="boxed" loading aria-label="Loading" />
        </Cell>
        <Cell label="disabled">
          <IconButton variant="boxed" disabled aria-label="Disabled">
            <Settings size={16} />
          </IconButton>
        </Cell>
        <Cell label="pressed">
          <IconButton variant="boxed" aria-pressed="true" aria-label="Active">
            <Settings size={16} />
          </IconButton>
        </Cell>
      </Group>

      <Group title="tooltip (hover)">
        <Cell label="default">
          <IconButton variant="default" tooltip="Copy" aria-label="Copy">
            <Copy size={16} />
          </IconButton>
        </Cell>
        <Cell label="danger">
          <IconButton variant="danger" tooltip="Delete" aria-label="Delete">
            <Trash2 size={16} />
          </IconButton>
        </Cell>
      </Group>
    </div>
  ),
};
