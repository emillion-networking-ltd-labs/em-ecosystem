import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import Contact from "@/components/sections/Contact";

const METHODS = [
  { icon: <Mail size={18} />, label: "Email", value: "hello@studio.com", href: "mailto:hello@studio.com" },
  { icon: <MessageCircle size={18} />, label: "WhatsApp", value: "+1 555 123 4567", href: "https://wa.me/15551234567", external: true },
  { icon: <Phone size={18} />, label: "Phone", value: "+1 555 123 4567", href: "tel:+15551234567" },
  { icon: <MapPin size={18} />, label: "Location", value: "Remote · worldwide" },
];

const SUBJECTS = [
  { value: "project", label: "New project" },
  { value: "partnership", label: "Partnership" },
  { value: "support", label: "Support" },
  { value: "other", label: "Other" },
];

const meta = {
  title: "Sections/Contact",
  component: Contact,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: {
    eyebrow: "Contact",
    title: "Let's talk",
    subtitle: "Tell us about your project and we'll get back to you within 24 hours.",
    methods: METHODS,
    subjectOptions: SUBJECTS,
    privacyHref: "#privacy",
  },
} satisfies Meta<typeof Contact>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default — two columns: direct methods (always work, no backend) + a real form with validation, GDPR consent
// and a submitted state. Front-end: wire the backend via onSubmit. Submit the form to see the success state.
export const Default: Story = {};

// FormOnly — no methods: the form centered on its own.
export const FormOnly: Story = { args: { methods: undefined } };

// AllVariants — ALWAYS last: with contact methods (default) and form-only.
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col">
      <div className="px-6 pt-6 pb-2">
        <span className="text-caption text-content-tertiary font-mono">with methods · two columns</span>
      </div>
      <Contact
        eyebrow="Contact"
        title="Let's talk"
        subtitle="Tell us about your project and we'll get back to you within 24 hours."
        methods={METHODS}
        subjectOptions={SUBJECTS}
        privacyHref="#privacy"
      />
      <div className="px-6 pt-6 pb-2">
        <span className="text-caption text-content-tertiary font-mono">form only · centered</span>
      </div>
      <Contact
        eyebrow="Contact"
        title="Let's talk"
        subtitle="Tell us about your project and we'll get back to you within 24 hours."
        subjectOptions={SUBJECTS}
        privacyHref="#privacy"
      />
    </div>
  ),
};
