import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Container } from "@/components/ui/Container";

const meta = {
  title: "Layout/Container",
  component: Container,
  tags: ["autodocs"],
  args: { size: "lg" },
  argTypes: { size: { control: "inline-radio", options: ["sm", "md", "lg", "xl", "full"] } },
} satisfies Meta<typeof Container>;

export default meta;
type Story = StoryObj<typeof meta>;

const Box = () => (
  <div className="rounded-lg border border-border-default bg-surface-secondary p-6 text-content-secondary">
    Contenido restringido a la medida y centrado. El padding horizontal es responsive.
  </div>
);

export const Default: Story = { render: (args) => <Container {...args}><Box /></Container> };

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      {(["sm", "md", "lg", "xl"] as const).map((s) => (
        <Container key={s} size={s}>
          <div className="rounded-lg border border-border-default bg-surface-secondary px-4 py-2 text-content-tertiary">
            size="{s}"
          </div>
        </Container>
      ))}
    </div>
  ),
};
