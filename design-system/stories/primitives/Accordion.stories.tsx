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
  // Model B: CERTIFIED primitive (ECO-198) — passed every DoD step (contract / role / fidelity 35/35 / a11y /
  // organization / census) + the human [H], so it earned its place in Primitives/ (out of Migration/).
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

// ── VARIANTS (the `variant` axis) — one story per variant; grouped by `AllVariants` at the end ──
// Default — grouped + chevron (the base look).
export const Default: Story = {};
// variant=uppercase — identical to default (same type/weight/size); the only difference is UPPERCASE.
export const Uppercase: Story = { args: { variant: "uppercase" } };

// ── SURFACE (the `surface` axis) — overview; orthogonal to variant ──
// grouped = a single divided box; separated = each item in its own card. Both keep the open animation.
export const Surface: Story = {
  render: () => (
    <Variants
      items={[
        { label: "grouped (default)", block: true, node: <Accordion items={faqItems} /> },
        {
          label: "separated",
          block: true,
          node: <Accordion items={faqItems} surface="separated" />,
        },
      ]}
    />
  ),
};

// ── INDICATOR (the `indicator` axis) — overview (closed, the base state) ──
// chevron = ▾ (rotates 180° on open); plus = a `+` (rotates 45° into a `×` on open).
export const Indicator: Story = {
  render: () => (
    <Variants
      items={[
        { label: "chevron (default)", block: true, node: <Accordion items={faqItems} /> },
        {
          label: "plus → × on open",
          block: true,
          node: <Accordion items={faqItems} indicator="plus" />,
        },
      ]}
    />
  ),
};

// ── MODIFIERS / STATE ──
// borderless — no border but KEEPS the rounded-md (same radius as the others). grouped only.
export const Borderless: Story = { args: { borderless: true } };
// defaultOpen — opens a panel on mount (the first, index 0); the closed base is `Default`.
export const DefaultOpen: Story = { args: { defaultOpen: 0 } };

// ── COMPOSITION ──
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

// ── OVERVIEW (ALWAYS last) ──
// AllVariants — groups the VARIANTS (the `variant` axis only). Surface / Indicator have their OWN overview above;
// they do NOT belong here (never mix different axes/buckets).
export const AllVariants: Story = {
  render: () => (
    <Variants
      items={[
        { label: "Default", block: true, node: <Accordion items={faqItems} /> },
        {
          label: "Uppercase",
          block: true,
          node: <Accordion items={faqItems} variant="uppercase" />,
        },
      ]}
    />
  ),
};
