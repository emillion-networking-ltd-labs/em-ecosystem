import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Group, TokenMeta, useVar } from "./_helpers";

// Foundations/Spacing & Radius — SEMANTIC rhythm and corner scales (ECO-95). They don't change with the preset.
const meta = {
  title: "Foundations/Spacing & Radius",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const SPACING = ["0_5", "1", "1_5", "2", "2_5", "3", "4", "5", "6", "8", "9"];
const RADIUS = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl", "full", "circle"];

function SpacingRow({ key_ }: { key_: string }) {
  const token = `--spacing-${key_}`;
  const [ref, val] = useVar(token);
  return (
    <div ref={ref} className="flex items-center gap-4 py-2">
      <div
        className="h-4 rounded-sm bg-content-primary"
        style={{ width: `var(${token})` }}
      />
      <TokenMeta token={token} value={val} />
    </div>
  );
}

function RadiusCell({ key_ }: { key_: string }) {
  const token = `--radius-${key_}`;
  const [ref, val] = useVar(token);
  return (
    <div ref={ref} className="flex flex-col gap-2">
      <div
        className="h-16 w-full border border-line-strong bg-surface-tertiary"
        style={{ borderRadius: `var(${token})` }}
      />
      <TokenMeta token={token} value={val} />
    </div>
  );
}

export const SpacingRadius: Story = {
  name: "Spacing & Radius",
  render: () => (
    <div className="text-content-primary">
      <Group
        title="Spacing"
        description="Spacing scale (`--spacing-*`). The bar measures the real token."
      >
        <div className="flex flex-col">
          {SPACING.map((k) => (
            <SpacingRow key={k} key_={k} />
          ))}
        </div>
      </Group>

      <Group title="Radius" description="Corner radius scale (`--radius-*`).">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {RADIUS.map((k) => (
            <RadiusCell key={k} key_={k} />
          ))}
        </div>
      </Group>
    </div>
  ),
};
