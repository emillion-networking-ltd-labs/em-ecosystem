import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Input from "@/components/ui/Input";

const meta = {
  title: "Primitives/ConfirmModal",
  component: ConfirmModal,
  tags: ["autodocs"],
  // Default = primary (the component's default variant) — a standard confirmation.
  args: {
    open: true,
    onClose: () => {},
    onConfirm: () => {},
    title: "Confirm action",
    description: "Are you sure you want to continue? This action can be undone.",
    confirmLabel: "Confirm",
    cancelLabel: "Cancel",
    variant: "primary",
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "danger"] },
    size: { control: "select", options: ["sm", "md", "lg", "xl"] },
  },
} satisfies Meta<typeof ConfirmModal>;

export default meta;
type Story = StoryObj<typeof meta>;

// A full-screen overlay: only one shows at a time, so each variant/size is its own story (they can't sit
// side by side in an AllVariants). variant = primary/danger; size = sm/md/lg/xl.

// Default — the primary confirmation.
export const Default: Story = {};

// variant "danger" — destructive action (red button, autofocus on Cancel).
export const Danger: Story = {
  args: {
    variant: "danger",
    size: "sm",
    title: "Delete item",
    description: "This action can't be undone. All associated data will be removed.",
    confirmLabel: "Delete",
  },
};

// With children (form fields) → size=md, like the "Edit Profile" dialog in ComponentShowcase.
// The first input gets autofocus.
export const Form: Story = {
  args: {
    variant: "primary",
    size: "md",
    title: "Edit profile",
    description: "Update your information.",
    confirmLabel: "Save",
  },
  render: (args) => (
    <ConfirmModal {...args}>
      <div className="mt-4 space-y-4">
        <Input label="First name" name="demo-first" placeholder="John" />
        <Input label="Last name" name="demo-last" placeholder="Doe" />
      </div>
    </ConfirmModal>
  ),
};

// Component sizes: sm/md/lg/xl (max-w 390/480/600/720px). Only one shows at a time (the modal is
// full-screen); change the `size` control to compare. lg is the one ImageCropper uses.
export const Large: Story = {
  args: {
    size: "lg",
    variant: "primary",
    title: "Large dialog (lg)",
    description: "max-w-[600px] — complex forms and multi-step dialogs.",
    confirmLabel: "OK",
  },
};

export const ExtraLarge: Story = {
  args: {
    size: "xl",
    variant: "primary",
    title: "Extra large dialog (xl)",
    description: "max-w-[720px] — the widest container available.",
    confirmLabel: "OK",
  },
};
