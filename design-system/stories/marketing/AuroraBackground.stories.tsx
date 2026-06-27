import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AuroraBackground } from "@/components/ui/AuroraBackground";

// Aceternity UI (MIT), adoptado verbatim en ECO-88.
const meta = {
  title: "Marketing/AuroraBackground",
  component: AuroraBackground,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof AuroraBackground>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <AuroraBackground {...args}>
      <div className="relative z-10 flex flex-col items-center gap-4 px-4 text-center">
        <h2 className="text-display-2 font-display">Aurora</h2>
        <p className="max-w-xl text-content-secondary">
          Fondo animado de luces, adoptado verbatim de Aceternity (MIT).
        </p>
      </div>
    </AuroraBackground>
  ),
};
