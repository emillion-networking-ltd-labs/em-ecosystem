import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Search } from "lucide-react";
import Input from "@/components/ui/Input";
import { DemoCard, Variants, Sizes } from "../_kit";

const meta = {
  title: "Primitives/Input",
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

// Default — playground: the default variant; try size/variant from the controls.
export const Default: Story = {};

export const Password: Story = {
  args: { label: "Password", type: "password", placeholder: "Your password" },
};

export const WithLeftIcon: Story = {
  args: { label: "Search", placeholder: "Search…", leftIcon: <Search size={16} /> },
};

export const WithError: Story = {
  args: { label: "Email", error: "Enter a valid email address" },
};

export const Loading: Story = {
  args: { label: "Search", loading: true, placeholder: "Loading…" },
};

export const Disabled: Story = {
  args: { label: "Read only", placeholder: "Can't edit", disabled: true },
};

// filled — bg-surface-primary, no outline. Used in search bars / dropdowns (e.g. LanguageSelector).
export const Filled: Story = {
  args: {
    label: "Search",
    variant: "filled",
    placeholder: "Type to search…",
    leftIcon: <Search size={16} />,
  },
};

// Sizes (largest → smallest), with px (h-12 = 48, h-10 = 40). md is the default.
const SIZES = [
  { size: "md", px: "48" },
  { size: "sm", px: "40" },
] as const;

// AllSizes — the input sizes (sm/md), with px.
export const AllSizes: Story = {
  render: () => (
    <Sizes
      items={SIZES.map(({ size, px }) => ({
        label: `${size} · ${px}px${size === "md" ? " (default)" : ""}`,
        node: (
          <div className="w-80">
            <Input size={size} placeholder="name@company.com" />
          </div>
        ),
      }))}
    />
  ),
};

// AllVariants — ALWAYS last: the two style variants (default / filled), same content so only the style differs.
export const AllVariants: Story = {
  render: () => (
    <Variants
      items={(["default", "filled"] as const).map((variant) => ({
        label: variant.charAt(0).toUpperCase() + variant.slice(1),
        node: (
          <div className="w-80">
            <Input variant={variant} placeholder="name@company.com" />
          </div>
        ),
      }))}
    />
  ),
};
