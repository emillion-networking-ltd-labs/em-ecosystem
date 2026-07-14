import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Group, TokenMeta, useVar } from "./_helpers";

// Foundations/Motion & Elevation — SEMANTIC motion and depth tokens (ECO-95).
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
    <div
      ref={ref}
      className="group flex cursor-pointer items-center gap-4 py-3"
    >
      <div className="relative h-10 flex-1 overflow-hidden rounded-md border border-line-strong bg-surface-tertiary">
        <div
          className="absolute left-1 top-1 h-8 w-8 rounded bg-content-primary transition-transform group-hover:translate-x-[300px]"
          style={{
            transitionDuration: `var(${token})`,
            transitionTimingFunction: "var(--ease-out-expo)",
          }}
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
        className="h-20 w-full rounded-xl border border-line-default bg-surface-primary"
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
        description="Durations (`--duration-*`) + the `--ease-out-expo` curve. Hover each row to see the timing."
      >
        <div className="flex flex-col">
          {DURATIONS.map((k) => (
            <MotionRow key={k} key_={k} />
          ))}
        </div>
        <p className="mt-2 text-caption font-mono text-content-secondary">
          --ease-out-expo
        </p>
      </Group>

      <Group
        title="Elevation"
        description="Card shadow (`--shadow-card`), the only shadow with real usage."
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <ShadowCell token="--shadow-card" label="card elevation" />
        </div>
      </Group>
    </div>
  ),
};
