import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Pricing from "@/components/sections/Pricing";

const meta = {
  title: "Sections/Pricing",
  component: Pricing,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: {
    eyebrow: "Planes",
    title: "Precios claros",
    subtitle: "Sin sorpresas. Cancela cuando quieras.",
    plans: [
      { name: "Básico", price: "30€", period: "/mes", description: "Para empezar.", features: ["1 proyecto", "Soporte por email"], cta: "Elegir" },
      { name: "Pro", price: "60€", period: "/mes", description: "Para equipos.", features: ["Proyectos ilimitados", "Soporte prioritario", "Analítica"], highlighted: true, cta: "Elegir" },
      { name: "Empresa", price: "A medida", description: "Para grandes cuentas.", features: ["SLA", "Onboarding dedicado"], cta: "Hablar" },
    ],
  },
} satisfies Meta<typeof Pricing>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
