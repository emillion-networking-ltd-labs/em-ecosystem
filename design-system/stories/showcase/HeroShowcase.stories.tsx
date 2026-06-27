import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HeroShowcase } from "@/components/sections/HeroShowcase";

// La pieza-estrella: compone primitivas + decoración + marketing. `preset` = sector multi-eje.
const meta = {
  title: "Showcase/HeroShowcase",
  component: HeroShowcase,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: {
    preset: "bold",
    eyebrow: "Entrenamiento personal",
    title: "Tu mejor versión",
    titleAccent: "empieza hoy",
    subtitle: "Planes a medida, seguimiento real y una comunidad que te empuja a más.",
    ctaText: "Reservar clase",
    ctaHref: "#reservar",
    secondaryCtaText: "Ver planes",
    secondaryCtaHref: "#planes",
  },
  argTypes: {
    preset: { control: "inline-radio", options: ["bold", "elegant", "editorial"] },
  },
} satisfies Meta<typeof HeroShowcase>;

export default meta;
type Story = StoryObj<typeof meta>;

const Media = () => (
  <div className="aspect-[4/3] w-full rounded-2xl border border-border-default [background-image:var(--gradient-brand)] opacity-90" />
);

// Preset BOLD (gym/tech): sans potente + halos de marca.
export const Bold: Story = { args: { media: <Media /> } };

// Preset ELEGANT (restaurante/lujo): serif + atmósfera sutil.
export const Elegant: Story = {
  args: {
    preset: "elegant",
    eyebrow: "Cocina de temporada",
    title: "Sabores que se recuerdan",
    titleAccent: "",
    subtitle: "Producto local, recetas de autor y una sala pensada para perder la noción del tiempo.",
    ctaText: "Reservar mesa",
    ctaHref: "#reservar",
    secondaryCtaText: "Ver carta",
    secondaryCtaHref: "#carta",
    media: <Media />,
  },
};

// Preset EDITORIAL (agencia/portfolio): rejilla técnica + tipografía fuerte.
export const Editorial: Story = {
  args: {
    preset: "editorial",
    eyebrow: "Estudio de diseño",
    title: "Ideas con oficio",
    titleAccent: "y resultados",
    subtitle: "Marca, producto y web para equipos que quieren destacar de verdad.",
    ctaText: "Hablemos",
    ctaHref: "#contacto",
    media: <Media />,
  },
};

// Omit-if-absent: sin media → hero a una columna, centrado (nunca un placeholder inventado).
export const SinMedia: Story = { args: { media: undefined } };
