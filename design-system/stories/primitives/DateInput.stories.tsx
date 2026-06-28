import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import DateInput from "@/components/ui/DateInput";

const meta = {
  title: "Primitives/DateInput",
  component: DateInput,
  tags: ["autodocs"],
  args: {
    label: "Date of birth",
    placeholder: "DD/MM/YYYY",
    size: "md",
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
  },
  // Constrain in the catalog so the field doesn't stretch across the full-bleed canvas.
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DateInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState("");
    return <DateInput {...args} value={value} onChange={setValue} />;
  },
};

export const WithValue: Story = {
  render: (args) => {
    const [value, setValue] = useState("2026-06-27");
    return <DateInput {...args} value={value} onChange={setValue} />;
  },
};

// On error the field outline AND the label turn red (general rule across inputs).
export const WithError: Story = {
  args: { error: "Pick a valid date" },
  render: (args) => {
    const [value, setValue] = useState("");
    return <DateInput {...args} value={value} onChange={setValue} />;
  },
};

export const Disabled: Story = {
  args: { label: "Not editable", disabled: true },
  render: (args) => {
    const [value, setValue] = useState("2026-06-27");
    return <DateInput {...args} value={value} onChange={setValue} />;
  },
};

// The 2 sizes (largest to smallest), with px.
const SIZES = [
  { key: "md", px: "48" },
  { key: "sm", px: "40" },
] as const;

export const Sizes: Story = {
  render: () => {
    const [value, setValue] = useState("2026-06-27");
    return (
      <div className="flex flex-col gap-4">
        {SIZES.map(({ key, px }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <DateInput size={key} label={`Size ${key}`} value={value} onChange={setValue} />
            <span className="text-caption text-content-tertiary font-mono">
              {key} · {px}px{key === "md" ? " (default)" : ""}
            </span>
          </div>
        ))}
      </div>
    );
  },
};

// AllVariants — ALWAYS last: the states (default, with value, error, disabled).
export const AllVariants: Story = {
  render: () => {
    const [a, setA] = useState("");
    const [b, setB] = useState("2026-06-27");
    return (
      <div className="flex flex-col gap-5">
        <div>
          <p className="mb-2 text-caption text-content-tertiary font-mono">default</p>
          <DateInput label="Date" value={a} onChange={setA} />
        </div>
        <div>
          <p className="mb-2 text-caption text-content-tertiary font-mono">with value</p>
          <DateInput label="Date" value={b} onChange={setB} />
        </div>
        {/* pb-6: the error message is absolutely positioned (out of flow), so reserve room for it
            below so the next state doesn't crowd it. */}
        <div className="pb-6">
          <p className="mb-2 text-caption text-content-tertiary font-mono">error</p>
          <DateInput label="Date" error="Pick a valid date" value="" onChange={() => {}} />
        </div>
        <div>
          <p className="mb-2 text-caption text-content-tertiary font-mono">disabled</p>
          <DateInput label="Date" disabled value="2026-06-27" onChange={() => {}} />
        </div>
      </div>
    );
  },
};
