import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Accordion, { SingleAccordion } from "@/components/ui/Accordion";

const faqItems = [
  {
    title: "¿Cómo creo un nuevo proyecto?",
    children:
      "Ve al panel de Proyectos y pulsa el botón «Nuevo proyecto». Rellena el nombre y asigna un responsable.",
  },
  {
    title: "¿Puedo invitar a mi equipo?",
    children:
      "Sí. Desde la sección Equipo puedes enviar invitaciones por correo y asignar roles a cada miembro.",
  },
  {
    title: "¿Cómo gestiono la facturación?",
    children:
      "La facturación se administra en Ajustes → Facturación, donde puedes ver tus planes y métodos de pago.",
  },
];

const meta = {
  title: "Primitives/Accordion",
  component: Accordion,
  tags: ["autodocs"],
  argTypes: {
    variant: { control: "inline-radio", options: ["default", "section"] },
    borderless: { control: "boolean" },
    defaultOpen: { control: "number" },
  },
  args: {
    defaultOpen: 0,
    items: faqItems,
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// variant=default — trigger text-body, comportamiento exclusivo (un panel abierto).
export const VariantDefault: Story = {
  args: { variant: "default", defaultOpen: undefined },
};

// variant=section — trigger text-h3 semibold uppercase tracking-wider.
export const VariantSection: Story = {
  args: { variant: "section", defaultOpen: undefined },
};

// borderless — sin borde ni rounded en el contenedor (solo los divisores internos).
export const Borderless: Story = {
  args: { borderless: true, defaultOpen: undefined },
};

// defaultOpen — abre un panel concreto al montar (índice 1).
export const DefaultOpen: Story = {
  args: { defaultOpen: 1 },
};

// Las dos variantes lado a lado.
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-caption text-content-tertiary">default</p>
        <Accordion items={faqItems} variant="default" />
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary">section</p>
        <Accordion items={faqItems} variant="section" />
      </div>
    </div>
  ),
};

// SingleAccordion — variante de un solo panel (autónomo, defaultOpen booleano).
export const Single: Story = {
  render: () => (
    <SingleAccordion title="Pulsa para expandir">
      <p className="text-body text-content-tertiary">
        Panel expandible. Se usa para specs, FAQs y secciones colapsables.
      </p>
    </SingleAccordion>
  ),
};
