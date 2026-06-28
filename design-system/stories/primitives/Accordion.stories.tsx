import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Accordion, { SingleAccordion } from "@/components/ui/Accordion";

// Content is wrapped in `text-body text-content-tertiary` — how the component is used in production
// (same as the dashboard's ComponentShowcase); a bare string would inherit the size.
const faqItems = [
  {
    title: "How do I create a new project?",
    children: (
      <p className="text-body text-content-tertiary">
        Go to the Projects panel and click “New project”. Fill in the name and assign an owner.
      </p>
    ),
  },
  {
    title: "Can I invite my team?",
    children: (
      <p className="text-body text-content-tertiary">
        Yes. From the Team section you can send email invitations and assign roles to each member.
      </p>
    ),
  },
  {
    title: "How do I manage billing?",
    children: (
      <p className="text-body text-content-tertiary">
        Billing is managed in Settings → Billing, where you can see your plans and payment methods.
      </p>
    ),
  },
];

const meta = {
  title: "Primitives/Accordion",
  component: Accordion,
  tags: ["autodocs"],
  argTypes: {
    variant: { control: "inline-radio", options: ["default", "uppercase"] },
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

// SingleAccordion — standalone single-panel variant (boolean defaultOpen).
export const Single: Story = {
  render: () => (
    <SingleAccordion title="Click to expand">
      <p className="text-body text-content-tertiary">
        Expandable panel. Used for specs, FAQs and collapsible sections.
      </p>
    </SingleAccordion>
  ),
};

// variant=uppercase — identical to default (same type/weight/size); the only difference is UPPERCASE.
export const Uppercase: Story = {
  args: { variant: "uppercase", defaultOpen: undefined },
};

// borderless — no border but KEEPS the rounded-md (same radius as the others).
export const Borderless: Story = {
  args: { borderless: true, defaultOpen: undefined },
};

// defaultOpen — opens a specific panel on mount (index 1).
export const DefaultOpen: Story = {
  args: { defaultOpen: 1 },
};

// AllVariants — ALWAYS last: the two variants side by side.
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-caption text-content-tertiary">default</p>
        <Accordion items={faqItems} variant="default" />
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary">uppercase</p>
        <Accordion items={faqItems} variant="uppercase" />
      </div>
    </div>
  ),
};
