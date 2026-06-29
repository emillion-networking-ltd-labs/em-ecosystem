import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ToastContainer from "@/components/ui/ToastContainer";

// App-coupled: consumes useToast → @/context/ToastContext (mock in the catalog with sample
// toasts; the real app's dashboard provides it). Renders the fixed toasts (top, fixed).
const meta = {
  title: "Primitives/ToastContainer",
  component: ToastContainer,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof ToastContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// AllVariants — ALWAYS last: the container rendering the (mock) stacked toasts, fixed at the top.
export const AllVariants: Story = {
  render: () => (
    <div className="min-h-[220px]">
      <p className="text-caption text-content-tertiary font-mono">
        stacked toasts — fixed at the top, from the mock toast context
      </p>
      <ToastContainer />
    </div>
  ),
};
