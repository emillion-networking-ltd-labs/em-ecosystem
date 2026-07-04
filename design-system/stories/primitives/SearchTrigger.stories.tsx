import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import SearchTrigger from "@/components/ui/SearchTrigger";
import Badge from "@/components/ui/Badge";
import { DemoCard } from "../_kit";

const meta = {
  title: "Primitives/SearchTrigger",
  component: SearchTrigger,
  tags: ["autodocs"],
  args: {
    onClick: () => {},
  },
  render: (args) => (
    <DemoCard>
      <SearchTrigger {...args} />
    </DemoCard>
  ),
} satisfies Meta<typeof SearchTrigger>;

export default meta;
type Story = StoryObj<typeof meta>;

// No variants/sizes: an outline sm trigger (Search icon + "Search…" + a kbd Badge with the ⌘K/Ctrl+K
// shortcut per platform). So there is no AllVariants — just the trigger, its context and the shortcut.

// Default — the standalone trigger.
export const Default: Story = {};

// In context, inside a top bar.
export const InTopBar: Story = {
  render: (args) => (
    <DemoCard>
      <div className="flex w-[420px] items-center justify-between rounded-md border border-border-default bg-surface-primary px-4 py-2">
        <span className="text-body font-semibold text-content-primary">NexaCore</span>
        <SearchTrigger {...args} />
      </div>
    </DemoCard>
  ),
};

// Keyboard shortcut — opens the command palette. The trigger shows the one for the current OS;
// documented here for both (kbd Badge): ⌘K on Mac, Ctrl+K on Windows / Linux.
export const KeyboardShortcut: Story = {
  render: () => (
    <DemoCard>
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="kbd" size="sm">
          ⌘K
        </Badge>
        <span className="text-caption text-content-secondary">Mac</span>
        <Badge variant="kbd" size="sm">
          Ctrl+K
        </Badge>
        <span className="text-caption text-content-secondary">Windows / Linux</span>
      </div>
    </DemoCard>
  ),
};
