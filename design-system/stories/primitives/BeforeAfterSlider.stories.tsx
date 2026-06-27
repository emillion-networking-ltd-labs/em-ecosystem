import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import BeforeAfterSlider from "@/components/ui/BeforeAfterSlider";

// Inline SVG data URIs so the story is self-contained (no external assets).
const beforeSrc =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect width="400" height="500" fill="%239ca3af"/><text x="50%" y="50%" fill="white" font-size="40" text-anchor="middle" dominant-baseline="middle">Before</text></svg>',
  );
const afterSrc =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect width="400" height="500" fill="%233b82f6"/><text x="50%" y="50%" fill="white" font-size="40" text-anchor="middle" dominant-baseline="middle">After</text></svg>',
  );

const meta = {
  title: "Primitives/BeforeAfterSlider",
  component: BeforeAfterSlider,
  tags: ["autodocs"],
  args: {
    before: { src: beforeSrc, alt: "Before" },
    after: { src: afterSrc, alt: "After" },
    orientation: "horizontal",
    initialPosition: 50,
    aspectRatio: "4/5",
  },
  argTypes: {
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"],
    },
    aspectRatio: {
      control: "inline-radio",
      options: ["4/5", "1/1", "16/9", "3/4"],
    },
    objectFit: { control: "inline-radio", options: ["cover", "contain"] },
  },
} satisfies Meta<typeof BeforeAfterSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-64">
      <BeforeAfterSlider {...args} />
    </div>
  ),
};

// orientation: union real "horizontal" | "vertical". El divisor (y las flechas
// del handle) rotan según la orientación.
export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: (args) => (
    <div className="w-64">
      <BeforeAfterSlider {...args} />
    </div>
  ),
};

// aspectRatio: union real "4/5" | "1/1" | "16/9" | "3/4".
export const AspectRatios: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      {(["4/5", "1/1", "16/9", "3/4"] as const).map((ratio) => (
        <div key={ratio} className="flex flex-col gap-1.5">
          <span className="text-caption text-content-tertiary">{ratio}</span>
          <div className="w-48">
            <BeforeAfterSlider
              before={{ src: beforeSrc, alt: "Antes" }}
              after={{ src: afterSrc, alt: "Después" }}
              aspectRatio={ratio}
            />
          </div>
        </div>
      ))}
    </div>
  ),
};

// objectFit: union real "cover" | "contain". "contain" muestra la imagen
// completa (ideal para logos/diagramas); el hueco usa bg-surface-tertiary.
export const ObjectFitContain: Story = {
  args: { objectFit: "contain", aspectRatio: "16/9" },
  render: (args) => (
    <div className="w-64">
      <BeforeAfterSlider {...args} />
    </div>
  ),
};

// Slots de composición reales: before.label (recortada con la imagen ANTES),
// after.label (recorte inverso, solo donde se ve DESPUÉS). Igual que el
// ComponentShowcase, que coloca Badges "BEFORE"/"AFTER".
export const WithLabels: Story = {
  render: () => (
    <div className="w-64">
      <BeforeAfterSlider
        before={{
          src: beforeSrc,
          alt: "Antes",
          label: (
            <div className="absolute left-3 top-3 rounded-md bg-surface-inverse px-2 py-0.5 text-caption text-content-inverse">
              ANTES
            </div>
          ),
        }}
        after={{
          src: afterSrc,
          alt: "Después",
          label: (
            <div className="absolute bottom-3 right-3 rounded-md bg-surface-inverse px-2 py-0.5 text-caption text-content-inverse">
              DESPUÉS
            </div>
          ),
        }}
        aspectRatio="4/5"
      />
    </div>
  ),
};
