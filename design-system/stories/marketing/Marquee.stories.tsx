import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Marquee } from "@/components/ui/Marquee";

// Magic UI (MIT), adoptado verbatim en ECO-82.
const meta = {
  title: "Marketing/Marquee",
  component: Marquee,
  tags: ["autodocs"],
  args: {
    pauseOnHover: true,
    reverse: false,
    repeat: 4,
  },
} satisfies Meta<typeof Marquee>;

export default meta;
type Story = StoryObj<typeof meta>;

const Pill = ({ label }: { label: string }) => (
  <span className="rounded-full border border-border-default bg-surface-secondary px-4 py-2 text-content-secondary">
    {label}
  </span>
);

export const Default: Story = {
  render: (args) => (
    <Marquee {...args}>
      {["Next.js", "Prisma", "NestJS", "Tailwind", "Storybook"].map((l) => (
        <Pill key={l} label={l} />
      ))}
    </Marquee>
  ),
};

export const Reverse: Story = {
  args: { reverse: true },
  render: Default.render,
};
