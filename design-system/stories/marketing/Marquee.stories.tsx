import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Marquee } from "@/components/ui/Marquee";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

// Magic UI (MIT), adopted verbatim in ECO-82. Requires the `marquee` / `marquee-vertical` keyframes (tokens.css).
const meta = {
  title: "Marketing/Marquee",
  component: Marquee,
  tags: ["autodocs"],
  args: {
    pauseOnHover: true,
    reverse: false,
    repeat: 4,
    vertical: false,
  },
} satisfies Meta<typeof Marquee>;

export default meta;
type Story = StoryObj<typeof meta>;

// Chips de logos = primitivo Badge (etiqueta no interactiva del sistema), no un span pill ad-hoc.
const Pill = ({ label }: { label: string }) => <Badge variant="default">{label}</Badge>;

const LOGOS = ["Next.js", "Prisma", "NestJS", "Tailwind", "Storybook"];

const Logos = () => (
  <>
    {LOGOS.map((l) => (
      <Pill key={l} label={l} />
    ))}
  </>
);

export const Default: Story = {
  render: (args) => (
    <Card className="flex min-h-[140px] items-center justify-center">
      <Marquee {...args}>
        <Logos />
      </Marquee>
    </Card>
  ),
};

// Reverse — the `reverse` prop flips the scroll direction.
export const Reverse: Story = {
  args: { reverse: true },
  render: Default.render,
};

// Vertical — the `vertical` prop scrolls top-to-bottom; bound the height so it stays in view.
export const Vertical: Story = {
  args: { vertical: true },
  render: (args) => (
    <Card className="flex min-h-[140px] items-center justify-center">
      <div className="h-72 overflow-hidden">
        <Marquee {...args} className="h-full">
          <Logos />
        </Marquee>
      </div>
    </Card>
  ),
};

// AllVariants — ALWAYS last: the real variants (Default, Reverse, Vertical) — one project Card each, name above.
const VARIANTS = [
  { label: "Default", node: <Marquee pauseOnHover><Logos /></Marquee> },
  { label: "Reverse", node: <Marquee reverse pauseOnHover><Logos /></Marquee> },
  {
    label: "Vertical",
    node: (
      <div className="h-72 overflow-hidden">
        <Marquee vertical pauseOnHover className="h-full">
          <Logos />
        </Marquee>
      </div>
    ),
  },
];

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {VARIANTS.map((v) => (
        <div key={v.label} className="flex flex-col gap-1.5">
          <span className="text-caption text-content-tertiary font-mono">{v.label}</span>
          <Card className="flex min-h-[140px] items-center justify-center">{v.node}</Card>
        </div>
      ))}
    </div>
  ),
};
