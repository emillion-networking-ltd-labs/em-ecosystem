import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import SearchTrigger from "@/components/ui/SearchTrigger";
import Badge from "@/components/ui/Badge";

const meta = {
  title: "Primitives/SearchTrigger",
  component: SearchTrigger,
  tags: ["autodocs"],
  args: {
    onClick: () => {},
  },
} satisfies Meta<typeof SearchTrigger>;

export default meta;
type Story = StoryObj<typeof meta>;

// Single trigger: outline sm button (Search icon 16px + "Search..." + a kbd Badge with the shortcut
// ⌘K/Ctrl+K resolved per platform via navigator.platform). No variants or sizes.
export const Default: Story = {};

// In context, inside a top bar.
export const InTopBar: Story = {
  render: (args) => (
    <div className="flex w-[420px] items-center justify-between rounded-md border border-border-components bg-surface-primary px-4 py-2">
      <span className="text-body font-semibold text-content-primary">NexaCore</span>
      <SearchTrigger {...args} />
    </div>
  ),
};

// Keyboard shortcut — opens the command palette. The trigger shows the one for the current OS;
// documented here for both (kbd Badge): ⌘K on Mac, Ctrl+K on Windows / Linux.
export const KeyboardShortcut: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="kbd" size="sm">
        ⌘K
      </Badge>
      <span className="text-caption text-content-tertiary">Mac</span>
      <Badge variant="kbd" size="sm">
        Ctrl+K
      </Badge>
      <span className="text-caption text-content-tertiary">Windows / Linux</span>
    </div>
  ),
};
