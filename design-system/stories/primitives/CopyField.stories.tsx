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

export const AllSizes: Story = {
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

// AllVariants — ALWAYS last: an overview walking every axis (sizes · long value).
// CopyField has no persistent visual states beyond sizes — the copied state (icon toggle) is
// transient (resets after 2s) and is exercised in the Default story via interaction.
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-5 max-w-md">
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">sizes</p>
        <div className="flex flex-col gap-3">
          {([["md", "48"], ["sm", "40"]] as const).map(([size, px]) => (
            <div key={size} className="flex flex-col gap-1.5">
              <CopyField value="ABCD-2F4A-9C1B" size={size} />
              <span className="text-caption text-content-tertiary font-mono">
                {size} · {px}px{size === "md" ? " (default)" : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">long value (truncates)</p>
        <CopyField value="sk-live-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3IifQ" />
      </div>
    </div>
  ),
};
