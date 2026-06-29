import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Settings, ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";

const meta = {
  title: "Primitives/Button",
  component: Button,
  tags: ["autodocs"],
  // fullWidth:false in the catalog so buttons render at their own size (the component defaults to
  // true, intended for forms — toggleable via the control).
  args: { children: "Continue", variant: "primary", size: "md", fullWidth: false },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "outline", "danger", "link", "link-underline"],
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    fullWidth: { control: "boolean" },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: "secondary" } };
export const Outline: Story = { args: { variant: "outline" } };
export const Danger: Story = { args: { variant: "danger", children: "Delete" } };
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

// Round button: override rounded-full + 36px square + no padding (same as the dashboard).
const CIRCLE = "h-9! w-9! min-w-0! rounded-full! px-0!";
const VARIANTS = ["primary", "secondary", "outline", "danger"] as const;

// Circular — two forms: with text and with icon.
export const Circular: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">with text</p>
        <div className="flex flex-wrap items-center gap-3">
          {VARIANTS.map((v) => (
            <Button key={v} variant={v} fullWidth={false} className={CIRCLE}>
              15
            </Button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">with icon</p>
        <div className="flex flex-wrap items-center gap-3">
          {VARIANTS.map((v) => (
            <Button
              key={v}
              variant={v}
              fullWidth={false}
              aria-label="Settings"
              className={CIRCLE}
            >
              <Settings size={16} />
            </Button>
          ))}
        </div>
      </div>
    </div>
  ),
};

// The 3 sizes (primary variant), with their height in px.
const SIZES = [
  { key: "lg", px: "48" },
  { key: "md", px: "40" },
  { key: "sm", px: "32" },
] as const;

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-4">
      {SIZES.map(({ key, px }) => (
        <div key={key} className="flex flex-col items-center gap-1">
          <Button variant="primary" size={key} fullWidth={false}>
            Continue
          </Button>
          <span className="text-caption text-content-tertiary font-mono">
            {key} · {px}px{key === "md" ? " (default)" : ""}
          </span>
        </div>
      ))}
    </div>
  ),
};

// AllVariants — ALWAYS last: full overview (variants + links + states + circular).
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">variants</p>
        <div className="flex flex-wrap items-center gap-3">
          {(["primary", "secondary", "outline", "danger"] as const).map((v) => (
            <Button key={v} variant={v} fullWidth={false}>
              {v}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">links</p>
        <div className="flex flex-wrap items-center gap-4">
          {(["link", "link-underline"] as const).map((v) => (
            <Button key={v} variant={v} fullWidth={false}>
              {v}
            </Button>
          ))}
          <Button variant="link-underline" fullWidth={false}>
            <ArrowLeft size={16} />
            underline + icon
          </Button>
        </div>
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">states</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" fullWidth={false}>
            <Settings size={16} />
            With icon
          </Button>
          <Button variant="primary" fullWidth={false} loading>
            Loading
          </Button>
          <Button variant="primary" fullWidth={false} disabled>
            Disabled
          </Button>
        </div>
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">circular</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" fullWidth={false} className={CIRCLE}>
            15
          </Button>
          <Button
            variant="primary"
            fullWidth={false}
            aria-label="Settings"
            className={CIRCLE}
          >
            <Settings size={16} />
          </Button>
        </div>
      </div>
    </div>
  ),
};
