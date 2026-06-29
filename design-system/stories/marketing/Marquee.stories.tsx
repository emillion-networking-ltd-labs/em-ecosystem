import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Marquee } from "@/components/ui/Marquee";
import Badge from "@/components/ui/Badge";
import { DemoCell, DemoStack } from "./_frame";

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

export const Default: Story = {
  render: (args) => (
    <Marquee {...args}>
      {LOGOS.map((l) => (
        <Pill key={l} label={l} />
      ))}
    </Marquee>
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
    <div className="h-72">
      <Marquee {...args}>
        {LOGOS.map((l) => (
          <Pill key={l} label={l} />
        ))}
      </Marquee>
    </div>
  ),
};

// AllVariants — ALWAYS last: every real boolean prop (default / reverse / no pause-on-hover / vertical).
const VARIANTS = [
  { label: "default · pauseOnHover", props: { pauseOnHover: true } },
  { label: "reverse", props: { reverse: true, pauseOnHover: true } },
  { label: "pauseOnHover off", props: { pauseOnHover: false } },
] as const;

export const AllVariants: Story = {
  render: () => (
    <DemoStack>
      {VARIANTS.map((v) => (
        <DemoCell key={v.label} caption={v.label} className="bg-surface-secondary py-6">
          <Marquee {...v.props}>
            {LOGOS.map((l) => (
              <Pill key={l} label={l} />
            ))}
          </Marquee>
        </DemoCell>
      ))}
      <DemoCell caption="vertical" className="h-56 bg-surface-secondary py-6">
        <Marquee vertical pauseOnHover>
          {LOGOS.map((l) => (
            <Pill key={l} label={l} />
          ))}
        </Marquee>
      </DemoCell>
    </DemoStack>
  ),
};
