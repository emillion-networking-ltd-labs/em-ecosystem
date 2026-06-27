import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Contact from "@/components/sections/Contact";

const meta = {
  title: "Sections/Contact",
  component: Contact,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: {
    title: "Hablemos",
    description: "Estamos a un mensaje de distancia.",
    email: "hola@estudio.com",
    phone: "+34 600 123 456",
    address: "Calle Mayor 1, Madrid",
    ctaText: "Enviar mensaje",
    ctaHref: "#form",
    variant: "card",
  },
  argTypes: { variant: { control: "inline-radio", options: ["card", "split"] } },
} satisfies Meta<typeof Contact>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Split: Story = { args: { variant: "split" } };
