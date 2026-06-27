import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import CTA from "@/components/sections/CTA";

const meta = {
  title: "Sections/CTA",
  component: CTA,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: {
    title: "¿Empezamos tu proyecto?",
    description: "Cuéntanos qué necesitas y te respondemos en 24 h.",
    primaryCtaText: "Hablar con el equipo",
    primaryCtaHref: "#contacto",
    secondaryCtaText: "Ver planes",
    secondaryCtaHref: "#planes",
    note: "Sin compromiso.",
    variant: "brand",
  },
  argTypes: { variant: { control: "inline-radio", options: ["brand", "surface"] } },
} satisfies Meta<typeof CTA>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Surface: Story = { args: { variant: "surface" } };
