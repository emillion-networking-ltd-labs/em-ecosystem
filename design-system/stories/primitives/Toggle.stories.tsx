import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import Toggle from "@/components/ui/Toggle";

const meta = {
  title: "Primitives/Toggle",
  component: Toggle,
  tags: ["autodocs"],
  args: { label: "Notifications", size: "md" },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [on, setOn] = useState(true);
    return <Toggle {...args} checked={on} onChange={setOn} />;
  },
};

export const Disabled: Story = {
  args: { disabled: true, label: "Disabled" },
  render: (args) => <Toggle {...args} checked={false} />,
};

// Sizes (largest → smallest), with px (track width). md is the default.
const SIZES = [
  { size: "lg", px: "48" },
  { size: "md", px: "40" },
  { size: "sm", px: "32" },
] as const;

export const AllSizes: Story = {
  render: () => {
    const [vals, setVals] = useState({ sm: true, md: true, lg: true });
    return (
      <div className="flex items-end gap-6">
        {SIZES.map(({ size, px }) => (
          <div key={size} className="flex flex-col items-center gap-1.5">
            <Toggle
              size={size}
              checked={vals[size]}
              onChange={(v) => setVals((p) => ({ ...p, [size]: v }))}
            />
            <span className="text-caption text-content-tertiary font-mono">
              {size} · {px}px{size === "md" ? " (default)" : ""}
            </span>
          </div>
        ))}
      </div>
    );
  },
};

// AllVariants — ALWAYS last: every state (off / on / disabled off / disabled on).
export const AllVariants: Story = {
  render: () => {
    const [off, setOff] = useState(false);
    const [on, setOn] = useState(true);
    return (
      <div className="flex items-end gap-6">
        <div className="flex flex-col items-center gap-1.5">
          <Toggle checked={off} onChange={setOff} />
          <span className="text-caption text-content-tertiary font-mono">off</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Toggle checked={on} onChange={setOn} />
          <span className="text-caption text-content-tertiary font-mono">on</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Toggle checked={false} disabled />
          <span className="text-caption text-content-tertiary font-mono">disabled off</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Toggle checked={true} disabled />
          <span className="text-caption text-content-tertiary font-mono">disabled on</span>
        </div>
      </div>
    );
  },
};
