import type { Meta, StoryObj } from "@storybook/nextjs-vite";

// Foundations/Elevation — la sombra de card THEME-AWARE (ECO-204, dimensión SHADOW / ADR-033).
// En LIGHT la sombra suave separa bien. En DARK una sombra NEGRA sobre fondo oscuro casi no contrasta (física),
// así que se compara aquí, lado a lado, las DOS vías de elevación en dark:
//   1) SOLO SOMBRA — la card usa la misma superficie que el fondo; solo la sombra + borde la separan (techo bajo en dark).
//   2) SURFACE-LIFT — la card usa una superficie MÁS CLARA que el fondo (como Material/GitHub en dark) → se eleva de verdad.
// Cada panel está sobre `surface-primary` (la base más oscura en dark), para que se vea el contraste real. Registra nada.
const meta = {
  title: "Foundations/Elevation",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Panel({ theme }: { theme: "light" | "dark" }) {
  return (
    <div
      className={`${theme} bg-surface-primary flex min-h-screen flex-col gap-8 p-12`}
    >
      <div className="text-caption text-content-tertiary tracking-wider uppercase">
        {theme} · fondo = surface-primary
      </div>

      {/* 1) SOLO SOMBRA — misma superficie que el fondo */}
      <div className="bg-surface-primary border-border-default shadow-card rounded-xl border p-6">
        <div className="text-body text-content-primary font-semibold">
          1 · solo sombra (misma superficie que el fondo)
        </div>
        <div className="text-caption text-content-secondary mt-1">
          En dark separa solo por sombra + borde → techo bajo.
        </div>
      </div>

      {/* 2) SURFACE-LIFT — superficie más clara que el fondo */}
      <div className="bg-surface-elevated border-border-default shadow-card rounded-xl border p-6">
        <div className="text-body text-content-primary font-semibold">
          2 · surface-lift (superficie más clara)
        </div>
        <div className="text-caption text-content-secondary mt-1">
          En dark la card es más clara que el fondo → se eleva de verdad (patrón
          pro).
        </div>
      </div>

      {/* hover */}
      <div className="bg-surface-elevated border-border-default shadow-card-hover rounded-xl border p-6">
        <div className="text-body text-content-primary font-semibold">
          3 · surface-lift + shadow-card-hover
        </div>
        <div className="text-caption text-content-secondary mt-1">
          Elevación en hover (BentoGrid, cards interactivas).
        </div>
      </div>
    </div>
  );
}

export const LightVsDark: Story = {
  render: () => (
    <div className="grid grid-cols-1 sm:grid-cols-2">
      <Panel theme="light" />
      <Panel theme="dark" />
    </div>
  ),
};
