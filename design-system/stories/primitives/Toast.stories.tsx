import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Toast from "@/components/ui/Toast";

// A single toast notification (the item). Its TYPES live here (error / success / warning / info).
// The fixed region that stacks several live toasts is a separate component: ToastContainer.
// A very long duration keeps it visible in the catalog (it auto-dismisses after `duration` ms).
const STAY = 10_000_000;

const meta = {
  title: "Primitives/Toast",
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
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// AllVariants — ALWAYS last: the 4 types.
const VARIANTS = [
  { variant: "success", title: "Changes saved", description: "Your profile has been updated." },
  { variant: "info", title: "Syncing…", description: "This will only take a moment." },
  { variant: "warning", title: "Storage almost full", description: "Free up space to keep syncing." },
  { variant: "error", title: "Couldn't save", description: "Please try again." },
] as const;

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {VARIANTS.map((v, i) => (
        <div key={v.variant} className="flex flex-col gap-1.5">
          <span className="text-caption text-content-tertiary font-mono">{v.variant}</span>
          <Toast
            id={i + 1}
            variant={v.variant}
            title={v.title}
            description={v.description}
            duration={STAY}
            onClose={() => {}}
          />
        </div>
      ))}
    </div>
  ),
};
