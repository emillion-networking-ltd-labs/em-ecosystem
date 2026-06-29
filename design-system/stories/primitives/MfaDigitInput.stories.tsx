import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import type { ReactNode } from "react";
import MfaDigitInput from "@/components/ui/MfaDigitInput";
import InlineError from "@/components/ui/InlineError";

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
        className={`text-body font-semibold leading-[22px] ${
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

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState<string[]>(["", "", "", "", "", ""]);
    return (
      <Field label="Verification code">
        <MfaDigitInput {...args} value={value} onChange={setValue} idPrefix="default" />
      </Field>
    );
  },
};

export const Filled: Story = {
  render: (args) => {
    const [value, setValue] = useState<string[]>(["1", "2", "3", "4", "5", "6"]);
    return (
      <Field label="Verification code">
        <MfaDigitInput {...args} value={value} onChange={setValue} idPrefix="filled" />
      </Field>
    );
  },
};

// Error state — pairs with an InlineError message below (as in the dashboard).
export const WithError: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>(["1", "2", "3", "", "", ""]);
    return (
      <Field label="Verification code" error>
        <MfaDigitInput value={value} onChange={setValue} error idPrefix="error" />
        <InlineError message="Enter all 6 digits" />
      </Field>
    );
  },
};

// length sets the number of cells (there is no size prop — see Sizes).
export const FourDigits: Story = {
  args: { length: 4 },
  render: (args) => {
    const [value, setValue] = useState<string[]>(["1", "2", "3", "4"]);
    return (
      <Field label="PIN">
        <MfaDigitInput {...args} value={value} onChange={setValue} idPrefix="four" />
      </Field>
    );
  },
};

// AllSizes — responsive behavior, not a prop. Cells are always square (aspect-square) and the SAME
// component auto-switches their size by container width (ResizeObserver): ≥ 348px → md (48×48,
// gap-3), < 348px → sm (40×40, gap-2). Resize the container, not a size option.
export const AllSizes: Story = {
  render: () => {
    const filled = ["1", "2", "3", "4", "5", "6"];
    return (
      <div className="flex flex-col gap-6">
        <p className="text-caption text-content-tertiary">
          Square cells; the same component resizes responsively by container width.
        </p>
        <div className="w-[360px]">
          <Field label="Verification code">
            <MfaDigitInput value={filled} onChange={() => {}} idPrefix="size-md" />
            <span className="text-caption text-content-tertiary font-mono">
              md · 48×48px gap-3 (default — container ≥ 348px)
            </span>
          </Field>
        </div>
        <div className="w-[280px]">
          <Field label="Verification code">
            <MfaDigitInput value={filled} onChange={() => {}} idPrefix="size-sm" />
            <span className="text-caption text-content-tertiary font-mono">
              sm · 40×40px gap-2 (auto — container &lt; 348px)
            </span>
          </Field>
        </div>
      </div>
    );
  },
};

// AllVariants — ALWAYS last: an overview walking every axis (states · digit counts · sizes).
export const AllVariants: Story = {
  render: () => {
    const [emptyVal, setEmptyVal] = useState<string[]>(["", "", "", "", "", ""]);
    const [filledVal, setFilledVal] = useState<string[]>(["1", "2", "3", "4", "5", "6"]);
    const [errorVal, setErrorVal] = useState<string[]>(["1", "2", "3", "", "", ""]);
    const [fourVal, setFourVal] = useState<string[]>(["1", "2", "3", "4"]);
    return (
      <div className="flex flex-col gap-6">
        <div>
          <p className="mb-2 text-caption text-content-tertiary font-mono">states</p>
          <div className="flex flex-col gap-4">
            <Field label="Verification code">
              <MfaDigitInput value={emptyVal} onChange={setEmptyVal} idPrefix="av-empty" />
            </Field>
            <Field label="Verification code (filled)">
              <MfaDigitInput value={filledVal} onChange={setFilledVal} idPrefix="av-filled" />
            </Field>
            <Field label="Verification code" error>
              <MfaDigitInput value={errorVal} onChange={setErrorVal} error idPrefix="av-error" />
              <InlineError message="Enter all 6 digits" />
            </Field>
          </div>
        </div>
        <div>
          <p className="mb-2 text-caption text-content-tertiary font-mono">digit counts</p>
          <div className="flex flex-col gap-4">
            <Field label="6 digits (default)">
              <MfaDigitInput length={6} value={filledVal} onChange={setFilledVal} idPrefix="av-6" />
            </Field>
            <Field label="4 digits (PIN)">
              <MfaDigitInput length={4} value={fourVal} onChange={setFourVal} idPrefix="av-4" />
            </Field>
          </div>
        </div>
        <div>
          <p className="mb-2 text-caption text-content-tertiary font-mono">sizes (responsive — fixed container widths)</p>
          <div className="flex flex-col gap-4">
            <div className="w-[360px]">
              <Field label="md · 48×48px (container ≥ 348px)">
                <MfaDigitInput value={filledVal} onChange={setFilledVal} idPrefix="av-size-md" />
              </Field>
            </div>
            <div className="w-[280px]">
              <Field label="sm · 40×40px (container &lt; 348px)">
                <MfaDigitInput value={filledVal} onChange={setFilledVal} idPrefix="av-size-sm" />
              </Field>
            </div>
          </div>
        </div>
      </div>
    );
  },
};
