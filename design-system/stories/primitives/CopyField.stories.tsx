import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import CopyField from "@/components/ui/CopyField";

const meta = {
  title: "Primitives/CopyField",
  component: CopyField,
  tags: ["autodocs"],
  args: {
    value: "https://nexacore.app/invite/ab12cd34",
    size: "md",
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
  },
} satisfies Meta<typeof CopyField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// md → 48px (default) · sm → 40px
export const AllSizes: Story = {
  render: () => (
    <div className="grid w-full max-w-md grid-cols-1 gap-4">
      {(["md", "sm"] as const).map((s) => (
        <div key={s} className="flex flex-col gap-1.5">
          <CopyField value="JBSWY3DPEHPK3PXP" size={s} />
          <span className="text-caption text-content-tertiary">
            {s}
            {s === "md" ? " (por defecto)" : ""}
          </span>
        </div>
      ))}
    </div>
  ),
};
