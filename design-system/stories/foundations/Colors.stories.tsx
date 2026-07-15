import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ColorSwatch, Grid, Group, TokenMeta, useVar } from "./_helpers";

// Foundations/Colors — the color token palette, VISIBLE (ECO-95). Switch the brand preset in the
// toolbar: the BRAND tokens (accent/-2 + gradients) change; the SEMANTIC ones don't. Switch the theme
// (light/dark): the semantic and state tokens change. The default reproduces the EMILLION brand.
const meta = {
  title: "Foundations/Colors",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function GradientBar({ token }: { token: string }) {
  const [ref, val] = useVar(token);
  return (
    <div ref={ref} className="flex flex-col gap-2">
      <div
        className="h-24 w-full rounded-xl border border-line-strong"
        style={{ backgroundImage: `var(${token})` }}
      />
      <TokenMeta token={token} value={val} />
    </div>
  );
}

export const Colors: Story = {
  render: () => (
    <div className="text-content-primary">
      <Group
        title="Brand"
        description="BRAND tokens: the theming point. They change with the toolbar preset (EMILLION / contrast demo). The client brings their own brand here; the default is just the EMILLION brand."
      >
        <Grid>
          <ColorSwatch token="--color-accent" />
          <ColorSwatch token="--color-accent-light" />
          <ColorSwatch token="--color-accent-dark" />
          <ColorSwatch token="--color-accent-2" />
        </Grid>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <GradientBar token="--gradient-brand" />
          <GradientBar token="--gradient-brand-radial" />
        </div>
      </Group>

      <Group
        title="Surfaces"
        description="SEMANTIC background tokens. Neutral: they do NOT change with the preset; they do with the theme (light/dark)."
      >
        <Grid>
          <ColorSwatch token="--color-surface-primary" />
          <ColorSwatch token="--color-surface-secondary" />
          <ColorSwatch token="--color-surface-tertiary" />
          <ColorSwatch token="--color-surface-subtle" />
          <ColorSwatch token="--color-surface-inverse" />
        </Grid>
      </Group>

      <Group
        title="Content"
        description="SEMANTIC text/icon tokens (color shown as a block)."
      >
        <Grid>
          <ColorSwatch token="--color-content-primary" />
          <ColorSwatch token="--color-content-secondary" />
          <ColorSwatch token="--color-content-tertiary" />
          <ColorSwatch token="--color-content-disabled" />
          <ColorSwatch token="--color-content-placeholder" />
          <ColorSwatch token="--color-content-inverse" />
        </Grid>
      </Group>

      <Group title="Borders" description="SEMANTIC border/separator tokens.">
        <Grid>
          <ColorSwatch token="--color-line-default" />
          <ColorSwatch token="--color-line-strong" />
          <ColorSwatch token="--color-line-control" />
          <ColorSwatch token="--color-line-subtle" />
        </Grid>
      </Group>

      <Group
        title="State"
        description="SEMANTIC feedback tokens (error / warning / info / success) + their background."
      >
        <Grid>
          <ColorSwatch token="--color-error" />
          <ColorSwatch token="--color-error-bg" />
          <ColorSwatch token="--color-warning" />
          <ColorSwatch token="--color-warning-bg" />
          <ColorSwatch token="--color-info" />
          <ColorSwatch token="--color-info-bg" />
          <ColorSwatch token="--color-success" />
          <ColorSwatch token="--color-success-bg" />
        </Grid>
      </Group>
    </div>
  ),
};
