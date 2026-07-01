import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Card from "@/components/ui/Card";
import { DemoCard, Variants } from "../_kit";

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
  render: (args) => (
    <DemoCard block>
      <Card {...args} />
    </DemoCard>
  ),
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

// The 4 surfaces (elevation × radius), each with its own story.
const TYPES = [
  { label: "Default", elevated: false, size: "md" as const },
  { label: "Elevated", elevated: true, size: "md" as const },
  { label: "Container", elevated: false, size: "lg" as const },
  { label: "ContainerElevated", elevated: true, size: "lg" as const },
];

// AllVariants — ALWAYS last: the 4 card surfaces, grouping the stories above.
export const AllVariants: Story = {
  render: () => (
    <Variants
      items={TYPES.map(({ label, elevated, size }) => ({
        label,
        block: true,
        node: (
          <Card elevated={elevated} size={size}>
            {sample}
          </Card>
        ),
      }))}
    />
  ),
};
