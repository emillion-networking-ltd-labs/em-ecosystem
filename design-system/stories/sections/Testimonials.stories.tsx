import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Testimonials from "@/components/sections/Testimonials";

const meta = {
  title: "Sections/Testimonials",
  component: Testimonials,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: {
    eyebrow: "Opiniones",
    title: "Lo que dicen nuestros clientes",
    variant: "cards",
    items: [
      { name: "Ana García", quote: "Entendieron la marca a la primera.", result: "+40% de leads" },
      { name: "Luis Pérez", quote: "Rápidos, claros y con mucho oficio.", result: "Lanzamiento en 4 semanas" },
      { name: "María Ruiz", quote: "El mejor equipo con el que hemos trabajado." },
    ],
  },
  argTypes: { variant: { control: "inline-radio", options: ["cards", "list"] } },
} satisfies Meta<typeof Testimonials>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const List: Story = { args: { variant: "list" } };
