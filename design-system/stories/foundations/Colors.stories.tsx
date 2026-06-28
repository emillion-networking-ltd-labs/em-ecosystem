import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ColorSwatch, Grid, Group, TokenMeta, useVar } from "./_helpers";

// Foundations/Colors — la paleta de tokens de color, VISIBLE (ECO-95). Conmuta el preset de marca en
// la toolbar: los tokens de MARCA (accent/-2 + gradientes) cambian; los SEMÁNTICOS no. Conmuta el tema
// (light/dark): los semánticos y de estado cambian. El default reproduce NexaCore.
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
        className="h-24 w-full rounded-lg border border-border-default"
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
        title="Marca"
        description="Tokens de MARCA: el punto de tematización. Cambian con el preset de la toolbar (NexaCore / Editorial / Cálido). El cliente trae su marca aquí; el verde por defecto es solo un placeholder."
      >
        <Grid>
          <ColorSwatch token="--color-accent" note="acento primario" />
          <ColorSwatch token="--color-accent-light" />
          <ColorSwatch token="--color-accent-dark" />
          <ColorSwatch token="--color-accent-2" note="2º acento (gradientes)" />
        </Grid>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <GradientBar token="--gradient-brand" />
          <GradientBar token="--gradient-brand-radial" />
        </div>
      </Group>

      <Group
        title="Superficies"
        description="Tokens SEMÁNTICOS de fondo. Neutros: NO cambian con el preset; sí con el tema (light/dark)."
      >
        <Grid>
          <ColorSwatch token="--color-surface-primary" />
          <ColorSwatch token="--color-surface-secondary" />
          <ColorSwatch token="--color-surface-tertiary" />
          <ColorSwatch token="--color-surface-subtle" />
          <ColorSwatch token="--color-surface-inverse" />
        </Grid>
      </Group>

      <Group title="Contenido" description="Tokens SEMÁNTICOS de texto/iconos (color como bloque).">
        <Grid>
          <ColorSwatch token="--color-content-primary" />
          <ColorSwatch token="--color-content-secondary" />
          <ColorSwatch token="--color-content-tertiary" />
          <ColorSwatch token="--color-content-disabled" />
          <ColorSwatch token="--color-content-placeholder" />
          <ColorSwatch token="--color-content-inverse" />
        </Grid>
      </Group>

      <Group title="Bordes" description="Tokens SEMÁNTICOS de borde/separador.">
        <Grid>
          <ColorSwatch token="--color-border-default" />
          <ColorSwatch token="--color-border-strong" />
          <ColorSwatch token="--color-border-components" />
          <ColorSwatch token="--color-border-subtle" />
        </Grid>
      </Group>

      <Group
        title="Estado"
        description="Tokens SEMÁNTICOS de feedback (error / warning / info / success) + su fondo."
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
