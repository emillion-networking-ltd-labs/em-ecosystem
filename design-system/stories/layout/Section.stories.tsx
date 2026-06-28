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

// Surfaces — every background token, on a compact band.
export const Surfaces: Story = {
  render: () => (
    <>
      {SURFACES.map((s) => (
        <Section key={s} spacing="sm" surface={s}>
          <Container>
            <span className="text-caption font-mono">surface=&quot;{s}&quot;</span>
          </Container>
        </Section>
      ))}
    </>
  ),
};

// Spacing — vertical rhythm, tallest → shortest. The colored band shows the padding-block.
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

// AllVariants — ALWAYS last: every surface at each spacing.
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-2">
      {SPACING.filter((s) => s.spacing !== "none").map(({ spacing, px }) =>
        SURFACES.map((surface) => (
          <Section
            key={`${spacing}-${surface}`}
            spacing={spacing}
            surface={surface}
            className="rounded-lg border border-border-default"
          >
            <Container>
              <span className="text-caption font-mono">
                {spacing} · {px}px / surface=&quot;{surface}&quot;
              </span>
            </Container>
          </Section>
        )),
      )}
    </div>
  ),
};
