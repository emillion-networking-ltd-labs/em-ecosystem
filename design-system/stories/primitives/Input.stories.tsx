import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Search } from "lucide-react";
import Input from "@/components/ui/Input";

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
  // Constrain in the catalog so inputs don't stretch full-bleed (forms are ~320px wide).
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

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
    <div className="flex flex-col gap-4">
      {SIZES.map(({ size, px }) => (
        <div key={size} className="flex flex-col gap-1.5">
          <Input size={size} placeholder="name@company.com" />
          <span className="text-caption text-content-tertiary font-mono">
            {size} · {px}px{size === "md" ? " (default)" : ""}
          </span>
        </div>
      ))}
    </div>
  ),
};

// AllVariants — ALWAYS last: the key states (default, with icon, error, disabled, loading).
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">default</p>
        <Input placeholder="name@company.com" />
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">with icon</p>
        <Input placeholder="Search…" leftIcon={<Search size={16} />} />
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">filled</p>
        <Input variant="filled" placeholder="Type to search…" leftIcon={<Search size={16} />} />
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">error</p>
        <Input error="Enter a valid email address" placeholder="name@company.com" />
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">disabled</p>
        <Input placeholder="Can't edit" disabled />
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">loading</p>
        <Input loading placeholder="Loading…" />
      </div>
    </div>
  ),
};
