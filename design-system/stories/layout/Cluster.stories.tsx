import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Cluster } from "@/components/ui/Cluster";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

const meta = {
  title: "Layout/Cluster",
  component: Cluster,
  tags: ["autodocs"],
  args: { gap: "sm", align: "center", justify: "start", wrap: true },
  argTypes: {
    gap: { control: "inline-radio", options: ["none", "xs", "sm", "md", "lg", "xl", "2xl"] },
    align: { control: "inline-radio", options: ["start", "center", "end", "baseline", "stretch"] },
    justify: { control: "inline-radio", options: ["start", "center", "between", "end"] },
    wrap: { control: "boolean" },
  },
} satisfies Meta<typeof Cluster>;

export default meta;
type Story = StoryObj<typeof meta>;

// Real registered elements as the demo content (Badge tags, Button group) — no ad-hoc chips.
const TAGS = ["Design", "Frontend", "Accessibility", "Tokens", "Motion", "Layout", "Testing", "Docs"];
const tags = () => TAGS.map((t) => <Badge key={t}>{t}</Badge>);

// Playground — a horizontal row of items that wraps when it runs out of room. Here: a row of tag Badges.
export const Default: Story = {
  render: (args) => (
    <Cluster {...args} className="max-w-md">
      {tags()}
    </Cluster>
  ),
};

// Wrap — when the row is narrower than its items, they flow onto new lines (the reason Cluster exists).
export const Wrap: Story = {
  render: () => (
    <div className="max-w-xs">
      <Cluster>{tags()}</Cluster>
    </div>
  ),
};

// Justify — distribution on the main axis, shown with a real button group (the classic Cluster use: a CTA row).
const JUSTIFIES = ["start", "center", "between", "end"] as const;

export const Justify: Story = {
  render: () => (
    <div className="space-y-6">
      {JUSTIFIES.map((justify) => (
        <div key={justify} className="space-y-1.5">
          <span className="text-caption text-content-secondary font-mono">
            justify=&quot;{justify}&quot;{justify === "start" ? " (default)" : ""}
          </span>
          <Cluster justify={justify} className="w-full rounded-lg border border-border-default p-3">
            <Button as="a" href="#" variant="primary" size="sm" fullWidth={false}>
              Get started
            </Button>
            <Button as="a" href="#" variant="outline" size="sm" fullWidth={false}>
              Learn more
            </Button>
          </Cluster>
        </div>
      ))}
    </div>
  ),
};
