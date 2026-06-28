import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Marquee } from "@/components/ui/Marquee";

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

const Pill = ({ label }: { label: string }) => (
  <span className="rounded-full border border-border-default bg-surface-secondary px-4 py-2 text-content-secondary">
    {label}
  </span>
);

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
    <div className="flex flex-col gap-4">
      {VARIANTS.map((v) => (
        <div key={v.label} className="flex flex-col gap-1.5">
          <Marquee {...v.props}>
            {LOGOS.map((l) => (
              <Pill key={l} label={l} />
            ))}
          </Marquee>
          <span className="text-caption text-content-tertiary font-mono">{v.label}</span>
        </div>
      ))}
      <div className="flex flex-col gap-1.5">
        <div className="h-56">
          <Marquee vertical pauseOnHover>
            {LOGOS.map((l) => (
              <Pill key={l} label={l} />
            ))}
          </Marquee>
        </div>
        <span className="text-caption text-content-tertiary font-mono">vertical</span>
      </div>
    </div>
  ),
};
