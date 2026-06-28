import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Contact from "@/components/sections/Contact";

const meta = {
  title: "Sections/Contact",
  component: Contact,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: {
    title: "Let's talk",
    description: "We're just one message away.",
    email: "hello@studio.com",
    phone: "+1 555 123 4567",
    address: "1 Main Street, New York",
    ctaText: "Send a message",
    ctaHref: "#form",
    variant: "card",
  },
  argTypes: { variant: { control: "inline-radio", options: ["card", "split"] } },
} satisfies Meta<typeof Contact>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// split = two-column layout (intro on the left, contact details on the right).
export const Split: Story = { args: { variant: "split" } };

// AllVariants — ALWAYS last: every layout variant, stacked full-width.
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col">
      {(["card", "split"] as const).map((variant) => (
        <div key={variant}>
          <div className="bg-surface-primary px-6 py-2">
            <span className="text-caption text-content-tertiary font-mono">{variant}</span>
          </div>
          <Contact
            variant={variant}
            title="Let's talk"
            description="We're just one message away."
            email="hello@studio.com"
            phone="+1 555 123 4567"
            address="1 Main Street, New York"
            ctaText="Send a message"
            ctaHref="#form"
          />
        </div>
      ))}
    </div>
  ),
};
