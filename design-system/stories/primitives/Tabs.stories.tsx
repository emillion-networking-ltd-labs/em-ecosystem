import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import Tabs from "@/components/ui/Tabs";

const meta = {
  title: "Primitives/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  args: {
    tabs: [
      { label: "General", value: "general" },
      { label: "Miembros", value: "miembros" },
      { label: "Facturación", value: "facturacion" },
    ],
    activeTab: "general",
    onChange: () => {},
  },
  render: (args) => {
    const [activeTab, setActiveTab] = useState(args.activeTab);
    return <Tabs {...args} activeTab={activeTab} onChange={setActiveTab} />;
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
