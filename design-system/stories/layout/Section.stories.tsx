import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";

const meta = {
  title: "Layout/Section",
  component: Section,
  tags: ["autodocs"],
  args: { spacing: "lg", surface: "secondary" },
  argTypes: {
    spacing: { control: "inline-radio", options: ["none", "sm", "md", "lg", "xl"] },
    surface: { control: "inline-radio", options: ["none", "primary", "secondary", "subtle", "inverse"] },
  },
} satisfies Meta<typeof Section>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Section {...args}>
      <Container>
        <h2 className="text-display-3 font-display">Una banda con ritmo</h2>
        <p className="mt-3 text-content-secondary">
          La superficie y el padding-block vienen de tokens. El contenido entra por children.
        </p>
      </Container>
    </Section>
  ),
};

export const Surfaces: Story = {
  render: () => (
    <>
      {(["primary", "secondary", "subtle", "inverse"] as const).map((s) => (
        <Section key={s} spacing="sm" surface={s}>
          <Container>surface="{s}"</Container>
        </Section>
      ))}
    </>
  ),
};
