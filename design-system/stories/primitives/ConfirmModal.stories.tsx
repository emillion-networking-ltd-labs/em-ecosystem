import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

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

// AllVariants — ALWAYS last: the modal is a full-screen overlay (one shows at a time), so each
// variant is opened by its own labeled trigger, controlled via useState.
const MODAL_VARIANTS = [
  { key: "default", label: "default" },
  { key: "danger", label: "danger" },
  { key: "form", label: "with form (md)" },
  { key: "large", label: "large (lg)" },
  { key: "xl", label: "extra large (xl)" },
] as const;

export const AllVariants: Story = {
  render: () => {
    const [openKey, setOpenKey] = useState<string | null>(null);
    const close = () => setOpenKey(null);
    return (
      <div className="flex flex-col gap-3">
        <p className="text-caption text-content-tertiary font-mono">open each variant →</p>
        <div className="flex flex-wrap items-center gap-3">
          {MODAL_VARIANTS.map(({ key, label }) => (
            <Button
              key={key}
              variant="outline"
              size="md"
              fullWidth={false}
              onClick={() => setOpenKey(key)}
            >
              {label}
            </Button>
          ))}
        </div>

        <ConfirmModal
          open={openKey === "default"}
          onClose={close}
          onConfirm={close}
          variant="primary"
          title="Confirm action"
          description="Are you sure you want to continue? This action can be undone."
          confirmLabel="Confirm"
          cancelLabel="Cancel"
        />
        <ConfirmModal
          open={openKey === "danger"}
          onClose={close}
          onConfirm={close}
          variant="danger"
          size="sm"
          title="Delete item"
          description="This action can't be undone. All associated data will be removed."
          confirmLabel="Delete"
        />
        <ConfirmModal
          open={openKey === "form"}
          onClose={close}
          onConfirm={close}
          variant="primary"
          size="md"
          title="Edit profile"
          description="Update your information."
          confirmLabel="Save"
        >
          <div className="mt-4 space-y-4">
            <Input label="First name" name="demo-first" placeholder="John" />
            <Input label="Last name" name="demo-last" placeholder="Doe" />
          </div>
        </ConfirmModal>
        <ConfirmModal
          open={openKey === "large"}
          onClose={close}
          onConfirm={close}
          variant="primary"
          size="lg"
          title="Large dialog (lg)"
          description="max-w-[600px] — complex forms and multi-step dialogs."
          confirmLabel="OK"
        />
        <ConfirmModal
          open={openKey === "xl"}
          onClose={close}
          onConfirm={close}
          variant="primary"
          size="xl"
          title="Extra large dialog (xl)"
          description="max-w-[720px] — the widest container available."
          confirmLabel="OK"
        />
      </div>
    );
  },
};
