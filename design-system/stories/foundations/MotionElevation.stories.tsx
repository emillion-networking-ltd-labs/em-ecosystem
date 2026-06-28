import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Group, TokenMeta, useVar } from "./_helpers";

// Foundations/Motion & Elevation — tokens SEMÁNTICOS de movimiento y profundidad (ECO-95).
const meta = {
  title: "Foundations/Motion & Elevation",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const DURATIONS = ["fast", "base", "slow"];

function MotionRow({ key_ }: { key_: string }) {
  const token = `--duration-${key_}`;
  const [ref, val] = useVar(token);
  return (
    <div ref={ref} className="group flex cursor-pointer items-center gap-4 py-3">
      <div className="relative h-10 flex-1 overflow-hidden rounded-md border border-border-subtle bg-surface-tertiary">
        <div
          className="absolute left-1 top-1 h-8 w-8 rounded bg-accent transition-transform group-hover:translate-x-[300px]"
          style={{ transitionDuration: `var(${token})`, transitionTimingFunction: "var(--ease-out-expo)" }}
        />
      </div>
      <TokenMeta token={token} value={val} />
    </div>
  );
}

function ShadowCell({ token, label }: { token: string; label: string }) {
  const [ref, val] = useVar(token);
  return (
    <div ref={ref} className="flex flex-col gap-3">
      <div
        className="h-20 w-full rounded-xl border border-border-subtle bg-surface-primary"
        style={{ boxShadow: `var(${token})` }}
      />
      <TokenMeta token={token} value={val ? label : "—"} />
    </div>
  );
}

export const MotionElevation: Story = {
  name: "Motion & Elevation",
  render: () => (
    <div className="text-content-primary">
      <Group
        title="Motion"
        description="Duraciones (`--duration-*`) + curva `--ease-out-expo`. Pasa el cursor sobre cada fila para ver el ritmo."
      >
        <div className="flex flex-col">
          {DURATIONS.map((k) => (
            <MotionRow key={k} key_={k} />
          ))}
        </div>
        <p className="mt-2 text-caption font-mono text-content-tertiary">--ease-out-expo</p>
      </Group>

      <Group title="Elevación" description="Sombras (`--shadow-*`) sobre superficie primaria.">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <ShadowCell token="--shadow-card" label="elevación de tarjeta" />
          <ShadowCell token="--shadow-avatar" label="elevación de avatar" />
        </div>
      </Group>
    </div>
  ),
};
