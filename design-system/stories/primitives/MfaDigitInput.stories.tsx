import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import type { ReactNode } from "react";
import MfaDigitInput from "@/components/ui/MfaDigitInput";
import InlineError from "@/components/ui/InlineError";
import { DemoCard } from "../_kit";

// Visual group label for each digit input (the component renders only the cells).
// On error the label turns red (general rule across inputs).
function Field({
  label,
  error = false,
  children,
}: {
  label: string;
  error?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span
        className={`text-body font-semibold ${
          error ? "text-error" : "text-content-primary"
        }`}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

const meta = {
  title: "Primitives/MfaDigitInput",
  component: MfaDigitInput,
  tags: ["autodocs"],
  args: {
    length: 6,
  },
} satisfies Meta<typeof MfaDigitInput>;

export default meta;
type Story = StoryObj<typeof meta>;

// MfaDigitInput has no design-variant axis. It has two cell sizes (md/sm) — auto-selected responsively by
// container width, not a prop (see AllSizes) — plus states (empty / filled / error) and digit count, each
// its own story. So there is no AllVariants.

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState<string[]>(["", "", "", "", "", ""]);
    return (
      <DemoCard>
        <Field label="Verification code">
          <MfaDigitInput {...args} value={value} onChange={setValue} idPrefix="default" />
        </Field>
      </DemoCard>
    );
  },
};

export const Filled: Story = {
  render: (args) => {
    const [value, setValue] = useState<string[]>(["1", "2", "3", "4", "5", "6"]);
    return (
      <DemoCard>
        <Field label="Verification code">
          <MfaDigitInput {...args} value={value} onChange={setValue} idPrefix="filled" />
        </Field>
      </DemoCard>
    );
  },
};

// Error state — pairs with an InlineError message below (as in the dashboard).
export const WithError: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>(["1", "2", "3", "", "", ""]);
    return (
      <DemoCard>
        <Field label="Verification code" error>
          <MfaDigitInput value={value} onChange={setValue} error idPrefix="error" />
          <InlineError message="Enter all 6 digits" />
        </Field>
      </DemoCard>
    );
  },
};

// length sets the number of cells (there is no size prop — see AllSizes).
export const FourDigits: Story = {
  args: { length: 4 },
  render: (args) => {
    const [value, setValue] = useState<string[]>(["1", "2", "3", "4"]);
    return (
      <DemoCard>
        <Field label="PIN">
          <MfaDigitInput {...args} value={value} onChange={setValue} idPrefix="four" />
        </Field>
      </DemoCard>
    );
  },
};

// AllSizes — the two cell sizes (md 48×48 gap-3 / sm 40×40 gap-2). There is no size prop: the component
// auto-switches between them by container width (ResizeObserver, ≥ 348px → md, < 348px → sm), shown here at
// fixed container widths so both read at once.
export const AllSizes: Story = {
  render: () => {
    const filled = ["1", "2", "3", "4", "5", "6"];
    return (
      <DemoCard block>
        <div className="flex flex-col gap-6">
          <div className="w-[360px]">
            <Field label="Verification code">
              <MfaDigitInput value={filled} onChange={() => {}} idPrefix="size-md" />
              <span className="text-caption text-content-secondary font-mono">
                md · 48×48px gap-3 (default — container ≥ 348px)
              </span>
            </Field>
          </div>
          <div className="w-[280px]">
            <Field label="Verification code">
              <MfaDigitInput value={filled} onChange={() => {}} idPrefix="size-sm" />
              <span className="text-caption text-content-secondary font-mono">
                sm · 40×40px gap-2 (auto — container &lt; 348px)
              </span>
            </Field>
          </div>
        </div>
      </DemoCard>
    );
  },
};
