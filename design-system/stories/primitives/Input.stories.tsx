import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Search } from "lucide-react";
import Input from "@/components/ui/Input";
import Icon from "@/components/ui/Icon";
import { DemoCard, Variants, Sizes } from "../_kit";

const meta = {
  title: "Simple/Input",
  component: Input,
  tags: ["autodocs"],
  args: {
    label: "Email",
    placeholder: "name@company.com",
    size: "md",
    variant: "default",
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
    variant: { control: "inline-radio", options: ["default", "filled"] },
  },
  // Full-width card, the field centered at a form width (~320px) inside it.
  render: (args) => (
    <DemoCard>
      <div className="w-80">
        <Input {...args} />
      </div>
    </DemoCard>
  ),
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

const cap = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);
const Field = ({ children }: { children: React.ReactNode }) => (
  <div className="w-80">{children}</div>
);

// ── VARIANTS (the `variant` axis) — one story per variant; grouped by `AllVariants` at the end ──
// Default — playground: the default variant (outline); try size/variant from the controls.
export const Default: Story = {};
// Filled — bg-surface-primary, no outline. Search bars / dropdowns (e.g. LanguageSelector).
export const Filled: Story = {
  args: {
    label: "Search",
    variant: "filled",
    placeholder: "Type to search…",
  },
};

// ── STATES — runtime state (NOT variants) · grouped overview, one card per state (default size) ──
export const States: Story = {
  render: () => (
    <Variants
      items={[
        {
          label: "Error",
          node: (
            <Field>
              <Input label="Email" error="Enter a valid email address" />
            </Field>
          ),
        },
        {
          label: "Loading · uses SpinnerCircle",
          node: (
            <Field>
              <Input label="Search" loading placeholder="Loading…" />
            </Field>
          ),
        },
        {
          label: "Disabled",
          node: (
            <Field>
              <Input label="Read only" placeholder="Can't edit" disabled />
            </Field>
          ),
        },
      ]}
    />
  ),
};

// ── CONTENT — what goes INSIDE the field (icons/affordances) · grouped overview (default size) ──
export const Content: Story = {
  render: () => (
    <Variants
      items={[
        {
          label: "Password · uses eye toggle",
          node: (
            <Field>
              <Input
                label="Password"
                type="password"
                placeholder="Your password"
              />
            </Field>
          ),
        },
        {
          label: "Left icon · uses Search",
          node: (
            <Field>
              <Input
                label="Search"
                placeholder="Search…"
                leftIcon={<Icon icon={Search} size="md" />}
              />
            </Field>
          ),
        },
      ]}
    />
  ),
};

// ── OVERVIEWS (ALWAYS last) — `AllSizes` penultimate, `AllVariants` last ──
// Sizes (largest → smallest), with px (h-12 = 48, h-10 = 40). md is the default.
const SIZES = [
  { size: "md", px: "48" },
  { size: "sm", px: "40" },
] as const;

export const AllSizes: Story = {
  render: () => (
    <Sizes
      items={SIZES.map(({ size, px }) => ({
        label: `${size} · ${px}px${size === "md" ? " (default)" : ""}`,
        node: (
          <Field>
            <Input size={size} placeholder="name@company.com" />
          </Field>
        ),
      }))}
    />
  ),
};

// AllVariants — ALWAYS last: the two style variants (default / filled), same content so only style differs.
export const AllVariants: Story = {
  render: () => (
    <Variants
      items={(["default", "filled"] as const).map((variant) => ({
        label: cap(variant),
        node: (
          <Field>
            <Input variant={variant} placeholder="name@company.com" />
          </Field>
        ),
      }))}
    />
  ),
};
