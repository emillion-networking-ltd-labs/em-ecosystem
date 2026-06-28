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
  // CopyField is full-width by nature; constrain it in the catalog so it doesn't stretch across
  // the full-bleed canvas.
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CopyField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// The 2 sizes (largest to smallest), with px.
const SIZES = [
  { key: "md", px: "48" },
  { key: "sm", px: "40" },
] as const;

export const Sizes: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-4">
      {SIZES.map(({ key, px }) => (
        <div key={key} className="flex flex-col gap-1.5">
          <CopyField value="ABCD-2F4A-9C1B" size={key} />
          <span className="text-caption text-content-tertiary font-mono">
            {key} · {px}px{key === "md" ? " (default)" : ""}
          </span>
        </div>
      ))}
    </div>
  ),
};
