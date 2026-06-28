import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Card from "@/components/ui/Card";

const sample = (
  <>
    <h3 className="text-h3 font-semibold text-content-primary">Card title</h3>
    <p className="mt-2 text-body text-content-secondary">
      Base surface for grouping content: background, border, radius and padding from tokens.
    </p>
  </>
);

const meta = {
  title: "Primitives/Card",
  component: Card,
  tags: ["autodocs"],
  args: { elevated: false, size: "md", children: sample },
  argTypes: {
    elevated: { control: "boolean" },
    size: { control: "inline-radio", options: ["md", "lg"] },
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

// card-flat — flat (no shadow), radius 12. The default; shadow is reserved for specific cases.
export const Default: Story = {};

// card — elevated (shadow), radius 12. For specific cases / floating surfaces.
export const Elevated: Story = { args: { elevated: true } };

// card-container-flat — flat, radius 24 (outer container).
export const Container: Story = { args: { size: "lg" } };

// card-container — elevated, radius 24.
export const ContainerElevated: Story = { args: { elevated: true, size: "lg" } };

// AllVariants — ALWAYS last: the 4 surfaces (elevation × radius).
const TYPES = [
  { label: "card-flat · 12 (default)", elevated: false, size: "md" },
  { label: "card · elevated · 12", elevated: true, size: "md" },
  { label: "card-container-flat · 24", elevated: false, size: "lg" },
  { label: "card-container · elevated · 24", elevated: true, size: "lg" },
] as const;

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {TYPES.map(({ label, elevated, size }) => (
        <div key={label}>
          <p className="mb-2 text-caption text-content-tertiary font-mono">{label}</p>
          <Card elevated={elevated} size={size}>
            {sample}
          </Card>
        </div>
      ))}
    </div>
  ),
};
