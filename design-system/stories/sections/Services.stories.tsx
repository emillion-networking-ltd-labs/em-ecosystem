import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Services from "@/components/sections/Services";

const meta = {
  title: "Sections/Services",
  component: Services,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: {
    eyebrow: "Qué hacemos",
    title: "Servicios",
    variant: "cards",
    services: [
      { title: "Diseño de marca", description: "Identidad visual completa y guía de uso." },
      { title: "Desarrollo web", description: "Sitios rápidos, accesibles y SEO-ready." },
      { title: "Producto digital", description: "Apps y dashboards a medida." },
    ],
  },
  argTypes: { variant: { control: "inline-radio", options: ["cards", "list"] } },
} satisfies Meta<typeof Services>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const List: Story = { args: { variant: "list" } };
