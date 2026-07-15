import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Server, Clock, ShieldCheck } from "lucide-react";
import SettingRow from "@/components/ui/SettingRow";
import Badge from "@/components/ui/Badge";
import Toggle from "@/components/ui/Toggle";
import { DemoCard } from "../_kit";

const meta = {
  title: "Migration/SettingRow",
  component: SettingRow,
  tags: ["autodocs"],
  args: {
    icon: Server,
    label: "System Information",
    description: "Application version and environment",
    children: (
      <div className="flex items-center gap-2">
        <span className="text-caption text-content-primary">v1.0.0</span>
        <Badge variant="info" size="sm">
          Production
        </Badge>
      </div>
    ),
  },
  render: (args) => (
    <DemoCard>
      <div className="w-96 divide-y divide-border-default">
        <SettingRow {...args} />
      </div>
    </DemoCard>
  ),
} satisfies Meta<typeof SettingRow>;

export default meta;
type Story = StoryObj<typeof meta>;

// No design-variant or size axis — the row is a fixed layout parameterised only by content
// (icon + label + description + action slot). So there is no AllVariants / AllSizes.

// Default — an info row whose action is a value + badge.
export const Default: Story = {};

// WithToggle — the most common action: a boolean switch on the right.
export const WithToggle: Story = {
  args: {
    icon: ShieldCheck,
    label: "Enforce MFA",
    description: "Require multi-factor authentication for all users",
    children: <Toggle checked onChange={() => {}} size="md" />,
  },
};

// WithValue — a read-only value as the action.
export const WithValue: Story = {
  args: {
    icon: Clock,
    label: "Session Timeout",
    description: "Default session duration for all users",
    children: (
      <span className="text-caption text-content-primary">24 hours</span>
    ),
  },
};

// Stacked — several rows in a divided list, as they appear on the settings screens.
export const Stacked: Story = {
  render: () => (
    <DemoCard>
      <div className="w-96 divide-y divide-border-default">
        <SettingRow
          icon={Server}
          label="System Information"
          description="Application version and environment"
        >
          <span className="text-caption text-content-primary">v1.0.0</span>
        </SettingRow>
        <SettingRow
          icon={Clock}
          label="Session Timeout"
          description="Default session duration for all users"
        >
          <span className="text-caption text-content-primary">24 hours</span>
        </SettingRow>
        <SettingRow
          icon={ShieldCheck}
          label="Enforce MFA"
          description="Require multi-factor authentication for all users"
        >
          <Toggle checked onChange={() => {}} size="md" />
        </SettingRow>
      </div>
    </DemoCard>
  ),
};
