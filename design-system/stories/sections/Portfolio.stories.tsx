import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Portfolio from "@/components/sections/Portfolio";

const meta = {
  title: "Sections/Portfolio",
  component: Portfolio,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: {
    eyebrow: "Trabajos",
    title: "Proyectos recientes",
    variant: "grid",
    viewAllText: "Ver todos",
    viewAllHref: "#",
    items: [
      { title: "Rebrand Atlas", description: "Identidad y web para una fintech." },
      { title: "App Verde", description: "Producto móvil de movilidad." },
      { title: "Tienda Norte", description: "E-commerce a medida." },
    ],
  },
  argTypes: { variant: { control: "inline-radio", options: ["grid", "featured"] } },
} satisfies Meta<typeof Portfolio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Featured: Story = { args: { variant: "featured" } };
