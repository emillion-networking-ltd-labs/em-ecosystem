import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Accordion, { SingleAccordion } from "@/components/ui/Accordion";
import { DemoCard, Variants } from "../_kit";

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
    surface: { control: "inline-radio", options: ["grouped", "separated"] },
    indicator: { control: "inline-radio", options: ["chevron", "plus"] },
    borderless: { control: "boolean" },
    defaultOpen: { control: "number" },
  },
  args: {
    defaultOpen: 0,
    items: faqItems,
  },
  render: (args) => (
    <DemoCard block>
      <Accordion {...args} />
    </DemoCard>
  ),
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default — grouped + chevron (the base look).
export const Default: Story = {};

// SingleAccordion — standalone single-panel variant (boolean defaultOpen).
export const Single: Story = {
  render: () => (
    <DemoCard block>
      <SingleAccordion title="Click to expand">
        <p className="text-body text-content-tertiary">
          Expandable panel. Used for specs, FAQs and collapsible sections.
        </p>
      </SingleAccordion>
    </DemoCard>
  ),
};

// variant=uppercase — identical to default (same type/weight/size); the only difference is UPPERCASE.
export const Uppercase: Story = { args: { variant: "uppercase", defaultOpen: undefined } };

// borderless — no border but KEEPS the rounded-md (same radius as the others).
export const Borderless: Story = { args: { borderless: true, defaultOpen: undefined } };

// defaultOpen — opens a specific panel on mount (index 1).
export const DefaultOpen: Story = { args: { defaultOpen: 1 } };

// surface=separated — each item in its own card, with separation between them; keeps the open animation.
export const Separated: Story = { args: { surface: "separated", defaultOpen: undefined } };

// indicator=plus — a `+` that rotates 45° into a `×` on open (the FAQ-style toggle), on the bordered layout.
export const PlusIndicator: Story = { args: { indicator: "plus", defaultOpen: undefined } };

// AllVariants — ALWAYS last: the distinct designs, grouping the stories above.
const VARIANT_CARDS = [
  { label: "Default", props: {} },
  { label: "Separated", props: { surface: "separated" as const } },
  { label: "PlusIndicator", props: { indicator: "plus" as const } },
  { label: "Borderless", props: { borderless: true } },
  { label: "Uppercase", props: { variant: "uppercase" as const } },
];

export const AllVariants: Story = {
  render: () => (
    <Variants
      items={VARIANT_CARDS.map(({ label, props }) => ({
        label,
        block: true,
        node: <Accordion items={faqItems} {...props} />,
      }))}
    />
  ),
};
