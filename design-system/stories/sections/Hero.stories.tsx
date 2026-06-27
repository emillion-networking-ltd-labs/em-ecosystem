import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Hero from "@/components/sections/Hero";

const meta = {
  title: "Sections/Hero",
  component: Hero,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: {
    eyebrow: "Estudio creativo",
    title: "Marcas que se recuerdan",
    subtitle: "Diseño, web y producto para equipos que quieren destacar.",
    ctaText: "Empezar",
    ctaHref: "#contacto",
    secondaryCtaText: "Ver trabajos",
    secondaryCtaHref: "#portfolio",
    variant: "gradient",
    align: "center",
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["gradient", "soft"] },
    align: { control: "inline-radio", options: ["left", "center"] },
  },
} satisfies Meta<typeof Hero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Soft: Story = { args: { variant: "soft", align: "left" } };
