import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Search } from "lucide-react";
import Icon, { ICON_SIZES, type IconSize } from "@/components/ui/Icon";
import { DemoCard, Sizes } from "../_kit";

// Icon — aplica la escala REGISTRADA de tamaño (Foundations › Icons) por nombre semántico, en vez del `size={16}`
// mágico. El color se hereda (currentColor → tokens text-*). Cambiar la escala propaga a todos los <Icon>.
const meta = {
  title: "Simple/Icon",
  component: Icon,
  tags: ["autodocs"],
  args: { icon: Search, size: "md" },
  argTypes: {
    icon: { control: false },
    size: { control: "inline-radio", options: Object.keys(ICON_SIZES) },
  },
  render: (args) => (
    <DemoCard>
      <Icon {...args} />
    </DemoCard>
  ),
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default — playground: pick a size from the registered scale (color inherits from the container).
export const Default: Story = {};

// ── OVERVIEW (ALWAYS last) — no design-variant axis; only the size scale ──
// AllSizes — the REGISTERED scale (from ICON_SIZES), the single source. md is the default.
export const AllSizes: Story = {
  render: () => (
    <Sizes
      items={(Object.entries(ICON_SIZES) as [IconSize, number][]).map(
        ([name, px]) => ({
          label: `${name} · ${px}px${name === "md" ? " (default)" : ""}`,
          node: <Icon icon={Search} size={name} />,
        }),
      )}
    />
  ),
};
