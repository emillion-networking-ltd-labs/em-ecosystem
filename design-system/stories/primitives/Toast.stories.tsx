import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Toast from "@/components/ui/Toast";
import { DemoCard, Variants } from "../_kit";

// A single toast notification (the item). Its TYPES live here (error / success / warning / info).
// The fixed region that stacks several live toasts is a separate component: ToastContainer.
// A very long duration keeps it visible in the catalog (it auto-dismisses after `duration` ms).
const STAY = 10_000_000;

const meta = {
  title: "Migration/Toast",
  component: Toast,
  tags: ["autodocs"],
  args: {
    id: 1,
    variant: "success",
    title: "Changes saved",
    description: "Your profile has been updated.",
    duration: STAY,
    onClose: () => {},
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["error", "success", "warning", "info"],
    },
  },
  render: (args) => (
    <DemoCard>
      <Toast {...args} />
    </DemoCard>
  ),
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

// One story per variant (the design axis), before AllVariants groups them. None is marked "default" — a
// toast doesn't always show one particular type; success only seeds the playground.
export const Success: Story = {};
export const Error: Story = {
  args: { variant: "error", title: "Couldn't save", description: "Please try again." },
};
export const Warning: Story = {
  args: { variant: "warning", title: "Storage almost full", description: "Free up space to keep syncing." },
};
export const Info: Story = {
  args: { variant: "info", title: "Syncing…", description: "This will only take a moment." },
};

const VARIANTS = [
  { variant: "success", title: "Changes saved", description: "Your profile has been updated." },
  { variant: "error", title: "Couldn't save", description: "Please try again." },
  { variant: "warning", title: "Storage almost full", description: "Free up space to keep syncing." },
  { variant: "info", title: "Syncing…", description: "This will only take a moment." },
] as const;
const cap = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);

// AllVariants — ALWAYS last: every toast variant, grouping the stories above.
export const AllVariants: Story = {
  render: () => (
    <Variants
      items={VARIANTS.map((v, i) => ({
        label: cap(v.variant),
        node: (
          <Toast
            id={i + 1}
            variant={v.variant}
            title={v.title}
            description={v.description}
            duration={STAY}
            onClose={() => {}}
          />
        ),
      }))}
    />
  ),
};
