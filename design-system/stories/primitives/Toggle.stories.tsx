import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import Toggle from "@/components/ui/Toggle";

const meta = {
  title: "Primitives/Toggle",
  component: Toggle,
  tags: ["autodocs"],
  args: { label: "Notificaciones", size: "md" },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [on, setOn] = useState(true);
    return <Toggle {...args} checked={on} onChange={setOn} />;
  },
};

export const Disabled: Story = {
  args: { disabled: true, label: "No editable" },
  render: (args) => <Toggle {...args} checked={false} />,
};

export const AllSizes: Story = {
  render: () => {
    const [vals, setVals] = useState({ sm: false, md: true, lg: true });
    return (
      <div className="flex items-end gap-6">
        {(["sm", "md", "lg"] as const).map((s) => (
          <div key={s} className="flex flex-col items-center gap-1.5">
            <Toggle
              size={s}
              checked={vals[s]}
              onChange={(v) => setVals((p) => ({ ...p, [s]: v }))}
            />
            <span className="text-caption text-content-tertiary">{s}</span>
          </div>
        ))}
      </div>
    );
  },
};

export const States: Story = {
  render: () => {
    const [off, setOff] = useState(false);
    const [on, setOn] = useState(true);
    return (
      <div className="flex items-end gap-6">
        <div className="flex flex-col items-center gap-1.5">
          <Toggle checked={off} onChange={setOff} />
          <span className="text-caption text-content-tertiary">Off</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Toggle checked={on} onChange={setOn} />
          <span className="text-caption text-content-tertiary">On</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Toggle checked={false} disabled />
          <span className="text-caption text-content-tertiary">
            Deshabilitado off
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Toggle checked={true} disabled />
          <span className="text-caption text-content-tertiary">
            Deshabilitado on
          </span>
        </div>
      </div>
    );
  },
};
