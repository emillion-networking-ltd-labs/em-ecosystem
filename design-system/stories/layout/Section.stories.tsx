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

// Spacing (tallest → shortest), with the padding-block value. lg is the default.
const SPACING = [
  { spacing: "xl", px: "112–176" },
  { spacing: "lg", px: "96–112" },
  { spacing: "md", px: "64–80" },
  { spacing: "sm", px: "48" },
  { spacing: "none", px: "0" },
] as const;

const SURFACES = ["primary", "secondary", "subtle", "inverse"] as const;

// Playground — a vertical band: padding-block from the scale, surface from a token.
export const Default: Story = {
  render: (args) => (
    <Section {...args}>
      <Container>
        <h2 className="text-display-3 font-display">A band with rhythm</h2>
        <p className="mt-3 text-content-secondary">
          Surface and padding-block come from tokens. Content enters through children.
        </p>
      </Container>
    </Section>
  ),
};

// Surfaces — which background a Section sits on (a parameter, not a design variant). Each band is one
// surface token; the label names it so the (deliberately subtle) differences read.
export const Surfaces: Story = {
  render: () => (
    <>
      {SURFACES.map((surface) => (
        <Section key={surface} spacing="sm" surface={surface}>
          <Container>
            <span className="text-caption font-mono text-content-secondary">surface=&quot;{surface}&quot;</span>
          </Container>
        </Section>
      ))}
    </>
  ),
};

// Spacing — the vertical rhythm (padding-block) scale, tallest → shortest. A parameter (a spacing measure),
// NOT the element's own size, so it is a named story — not AllSizes. The bordered band shows the padding-block.
export const Spacing: Story = {
  render: () => (
    <div className="space-y-4">
      {SPACING.map(({ spacing, px }) => (
        <div key={spacing}>
          <span className="text-caption text-content-tertiary font-mono">
            {spacing} · {px}px{spacing === "lg" ? " (default)" : ""}
          </span>
          <Section spacing={spacing} surface="secondary" className="mt-1.5 rounded-lg border border-border-default">
            <Container>
              <div className="rounded-md border border-border-default bg-surface-primary px-4 py-2 text-content-tertiary">
                content
              </div>
            </Container>
          </Section>
        </div>
      ))}
    </div>
  ),
};
