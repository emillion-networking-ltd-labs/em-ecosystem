import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import FAQ from "@/components/sections/FAQ";

const meta = {
  title: "Sections/FAQ",
  component: FAQ,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: {
    eyebrow: "Dudas",
    title: "Preguntas frecuentes",
    variant: "list",
    items: [
      { question: "¿Cuánto tarda un proyecto?", answer: "Entre 3 y 6 semanas según el alcance." },
      { question: "¿Trabajáis en remoto?", answer: "Sí, con equipos de toda Europa." },
      { question: "¿Ofrecéis mantenimiento?", answer: "Sí, planes mensuales opcionales." },
    ],
  },
  argTypes: { variant: { control: "inline-radio", options: ["list", "boxed"] } },
} satisfies Meta<typeof FAQ>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Boxed: Story = { args: { variant: "boxed" } };
